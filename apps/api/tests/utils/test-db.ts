import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool, PoolClient } from "pg";
import { type IMemoryDb, newDb } from "pg-mem";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../../src/db/migrations");
const MIGRATION_SKIP_LIST = new Set([
	"0008_performance_indexes.sql",
	"0010_products_inventory_indexes.sql",
	"0015_add_missing_composite_indexes.sql",
]);

const migrationFileComparator = (a: string, b: string): number => {
	const extractVersion = (filename: string): number | null => {
		const match = filename.match(/^(\d+)/);
		return match ? Number.parseInt(match[1], 10) : null;
	};

	const aVersion = extractVersion(a);
	const bVersion = extractVersion(b);

	if (aVersion !== null && bVersion !== null) {
		if (aVersion !== bVersion) {
			return aVersion - bVersion;
		}
		return a.localeCompare(b);
	}

	if (aVersion !== null) {
		return -1;
	}

	if (bVersion !== null) {
		return 1;
	}

	return a.localeCompare(b);
};

const getMigrationFiles = async (): Promise<string[]> => {
	const entries = await readdir(migrationsDir);
	return entries
		.filter((entry) => entry.endsWith(".sql"))
		.sort(migrationFileComparator);
};

const splitSqlStatements = (sql: string): string[] => {
	const statements: string[] = [];
	let current = "";
	let inString = false;
	let dollarTag: string | null = null;

	for (let index = 0; index < sql.length; ) {
		const char = sql[index];

		if (!inString) {
			const dollarMatch = sql.slice(index).match(/^\$[A-Za-z0-9_]*\$/);
			if (dollarMatch) {
				const tag = dollarMatch[0];
				current += tag;
				index += tag.length;
				if (dollarTag === tag) {
					dollarTag = null;
				} else if (!dollarTag) {
					dollarTag = tag;
				}
				continue;
			}
		}

		if (!dollarTag && char === "'") {
			inString = !inString;
			current += char;
			index += 1;
			continue;
		}

		if (!inString && !dollarTag && char === ";") {
			statements.push(current);
			current = "";
			index += 1;
			continue;
		}

		current += char;
		index += 1;
	}

	if (current.trim().length > 0) {
		statements.push(current);
	}

	return statements;
};

const isIgnorableMigrationError = (error: unknown): boolean => {
	if (!(error instanceof Error)) {
		return false;
	}

	const message = error.message.toLowerCase();
	return (
		message.includes("already exists") ||
		message.includes("concurrent transactions") ||
		message.includes("does not exist")
	);
};

const executeSqlFile = (dbSchema: IMemoryDb["public"], sql: string): void => {
	const statements = splitSqlStatements(sql);

	for (const rawStatement of statements) {
		let statement = rawStatement.trim();

		while (statement.startsWith("--")) {
			const newlineIndex = statement.indexOf("\n");
			if (newlineIndex === -1) {
				statement = "";
				break;
			}
			statement = statement.slice(newlineIndex + 1).trim();
		}

		if (!statement) {
			continue;
		}

		try {
			dbSchema.none(statement);
		} catch (error) {
			if (isIgnorableMigrationError(error)) {
				continue;
			}
			throw error;
		}
	}
};

const registerExtensions = (db: IMemoryDb): void => {
	db.registerExtension("pgcrypto", (schema) => {
		schema.registerFunction({
			name: "gen_random_uuid",
			// biome-ignore lint/suspicious/noExplicitAny: pg-mem types limitation - "uuid" not supported in returns type
            returns: "uuid" as unknown as string,
			implementation: () => randomUUID(),
			impure: true,
		});
	});

	db.registerExtension("pg_trgm", () => {
		// pg-mem triggers the extension factory during CREATE EXTENSION execution.
		// We don't need full text search support for the test suite, so a no-op implementation is sufficient.
	});

	db.public.registerFunction({
		name: "gen_random_uuid",
		// biome-ignore lint/suspicious/noExplicitAny: pg-mem types limitation - "uuid" not supported in returns type
        returns: "uuid" as unknown as string,
		implementation: () => randomUUID(),
		impure: true,
	});
};

type PlPgSqlOperation =
	| { kind: "sql"; statement: string }
	| {
			kind: "if";
			condition: { negate: boolean; query: string } | null;
			body: PlPgSqlOperation[];
			elseBody?: PlPgSqlOperation[];
	  };

type ParseResult = {
	operations: PlPgSqlOperation[];
	index: number;
	terminator?: string;
};

const keywordRegexCache = new Map<string, RegExp>();

const getKeywordRegex = (keyword: string): RegExp => {
	const cached = keywordRegexCache.get(keyword);
	if (cached) {
		return cached;
	}

	const pattern = `^${keyword.replace(/\s+/g, "\\s+")}(?![A-Za-z0-9_])`;
	const regex = new RegExp(pattern, "i");
	keywordRegexCache.set(keyword, regex);
	return regex;
};

const matchKeyword = (
	code: string,
	index: number,
	keyword: string,
): number | null => {
	const regex = getKeywordRegex(keyword);
	const fragment = code.slice(index);
	const match = fragment.match(regex);
	if (!match) {
		return null;
	}
	return index + match[0].length;
};

const startsWithKeyword = (
	code: string,
	index: number,
	keyword: string,
): boolean => matchKeyword(code, index, keyword) !== null;

const skipWhitespace = (code: string, startIndex: number): number => {
	let index = startIndex;
	while (index < code.length) {
		const char = code[index];
		if (char === " " || char === "\t" || char === "\n" || char === "\r") {
			index += 1;
		} else {
			break;
		}
	}
	return index;
};

const skipOptionalSemicolon = (code: string, startIndex: number): number => {
	let index = skipWhitespace(code, startIndex);
	if (code[index] === ";") {
		index += 1;
	}
	return index;
};

const normalizeStatement = (statement: string): string =>
	statement.replace(/ADD VALUE IF NOT EXISTS/gi, "ADD VALUE");

const readStatement = (
	code: string,
	startIndex: number,
): { statement: string; index: number } => {
	let index = startIndex;
	let statement = "";
	let inString = false;

	while (index < code.length) {
		const char = code[index];

		if (char === "'" && !inString) {
			inString = true;
			statement += char;
			index += 1;
			continue;
		}

		if (char === "'" && inString) {
			if (code[index + 1] === "'") {
				statement += "''";
				index += 2;
				continue;
			}
			inString = false;
			statement += char;
			index += 1;
			continue;
		}

		if (!inString && char === ";") {
			index += 1;
			break;
		}

		statement += char;
		index += 1;
	}

	return { statement: statement.trim(), index };
};

const matchAnyKeyword = (
	code: string,
	index: number,
	keywords: string[],
): { keyword: string } | null => {
	for (const keyword of keywords) {
		if (startsWithKeyword(code, index, keyword)) {
			return { keyword };
		}
	}
	return null;
};

const parseBlock = (
	code: string,
	startIndex: number,
	terminators: string[],
): ParseResult => {
	const operations: PlPgSqlOperation[] = [];
	let index = startIndex;

	while (index < code.length) {
		index = skipWhitespace(code, index);

		if (terminators.length > 0) {
			const matched = matchAnyKeyword(code, index, terminators);
			if (matched) {
				return { operations, index, terminator: matched.keyword };
			}
		}

		if (index >= code.length) {
			break;
		}

		if (startsWithKeyword(code, index, "IF")) {
			const { operation, index: nextIndex } = parseIfBlock(code, index);
			operations.push(operation);
			index = nextIndex;
			continue;
		}

		if (startsWithKeyword(code, index, "BEGIN")) {
			const afterBegin = consumeKeyword(code, index, "BEGIN");
			const nested = parseBlock(code, afterBegin, ["END"]);
			index = nested.index;

			if (nested.terminator !== "END") {
				throw new Error("BEGIN block missing END");
			}

			index = consumeKeyword(code, index, "END");
			index = skipOptionalSemicolon(code, index);
			operations.push(...nested.operations);
			continue;
		}

		if (startsWithKeyword(code, index, "EXCEPTION")) {
			index = skipExceptionBlock(code, index);
			continue;
		}

		if (startsWithKeyword(code, index, "NULL")) {
			const skipped = readStatement(code, index);
			index = skipped.index;
			continue;
		}

		const statementResult = readStatement(code, index);
		index = statementResult.index;

		if (statementResult.statement.length > 0) {
			operations.push({
				kind: "sql",
				statement: normalizeStatement(statementResult.statement),
			});
		}
	}

	return { operations, index };
};

const consumeKeyword = (
	code: string,
	startIndex: number,
	keyword: string,
): number => {
	const nextIndex = matchKeyword(code, startIndex, keyword);
	if (nextIndex === null) {
		throw new Error(`Expected keyword "${keyword}" in plpgsql block`);
	}
	return nextIndex;
};

const skipExceptionBlock = (code: string, startIndex: number): number => {
	let index = consumeKeyword(code, startIndex, "EXCEPTION");

	while (index < code.length) {
		const matched = matchKeyword(code, index, "END");
		if (matched !== null) {
			return index;
		}
		index += 1;
	}

	return index;
};

const parseIfBlock = (
	code: string,
	startIndex: number,
): { operation: PlPgSqlOperation; index: number } => {
	let index = consumeKeyword(code, startIndex, "IF");
	index = skipWhitespace(code, index);

	const conditionExpression = readConditionExpression(code, index);
	index = conditionExpression.index;

	const existsMatch = conditionExpression.expression.match(
		/^(NOT\s+)?EXISTS\s*\(([\s\S]+)\)$/i,
	);
	const condition = existsMatch?.[2]
		? {
				negate: Boolean(existsMatch[1]),
				query: existsMatch[2].trim(),
			}
		: null;

	const thenResult = parseBlock(code, index, ["END IF", "ELSE"]);
	index = thenResult.index;

	let elseBody: PlPgSqlOperation[] | undefined;
	let finalIndex: number;

	if (thenResult.terminator === "ELSE") {
		const elseStart = consumeKeyword(code, index, "ELSE");
		const elseResult = parseBlock(code, elseStart, ["END IF"]);
		elseBody = elseResult.operations;
		finalIndex = consumeKeyword(code, elseResult.index, "END IF");
	} else if (thenResult.terminator === "END IF") {
		finalIndex = consumeKeyword(code, index, "END IF");
	} else {
		throw new Error("IF block missing END IF");
	}

	finalIndex = skipOptionalSemicolon(code, finalIndex);

	return {
		operation: {
			kind: "if",
			condition,
			body: thenResult.operations,
			elseBody,
		},
		index: finalIndex,
	};
};

const readConditionExpression = (
	code: string,
	startIndex: number,
): { expression: string; index: number } => {
	let index = startIndex;
	let expression = "";
	let depth = 0;
	let inString = false;

	while (index < code.length) {
		const char = code[index];

		if (char === "'" && !inString) {
			inString = true;
			expression += char;
			index += 1;
			continue;
		}

		if (char === "'" && inString) {
			if (code[index + 1] === "'") {
				expression += "''";
				index += 2;
				continue;
			}
			inString = false;
			expression += char;
			index += 1;
			continue;
		}

		if (!inString && char === "(") {
			depth += 1;
		} else if (!inString && char === ")" && depth > 0) {
			depth -= 1;
		} else if (
			!inString &&
			depth === 0 &&
			startsWithKeyword(code, index, "THEN")
		) {
			index = consumeKeyword(code, index, "THEN");
			return { expression: expression.trim(), index };
		}

		expression += char;
		index += 1;
	}

	throw new Error('Expected keyword "THEN" in plpgsql block');
};

const compilePlPgSqlOperations = (code: string): PlPgSqlOperation[] => {
	const sanitized = code
		.replace(/\r\n/g, "\n")
		.replace(/--.*$/gm, "")
		.replace(/-->.*$/gm, "")
		.trim();

	if (!sanitized) {
		return [];
	}

	const { operations } = parseBlock(sanitized, 0, []);
	return operations;
};

const isDuplicateObjectError = (error: unknown): boolean => {
	if (!(error instanceof Error)) {
		return false;
	}

	return /already exists/i.test(error.message);
};

const executeOperations = (
	schema: IMemoryDb["public"],
	operations: PlPgSqlOperation[],
): void => {
	for (const operation of operations) {
		if (operation.kind === "sql") {
			if (operation.statement.toUpperCase() === "NULL") {
				continue;
			}

			try {
				schema.none(operation.statement);
			} catch (error) {
				if (isDuplicateObjectError(error)) {
					continue;
				}
				throw error;
			}
			continue;
		}

		if (operation.kind === "if") {
			if (operation.condition === null) {
				executeOperations(schema, operation.body);
				continue;
			}

			const matches = schema.many(operation.condition.query);
			const result = matches.length > 0;
			const shouldRun = operation.condition.negate ? !result : result;

			if (shouldRun) {
				executeOperations(schema, operation.body);
			} else if (operation.elseBody) {
				executeOperations(schema, operation.elseBody);
			}
		}
	}
};

const patchQueryable = <T extends { query: (...args: unknown[]) => unknown }>(
	queryable: T,
): T => {
	const originalQuery = queryable.query.bind(queryable);
	queryable.query = ((...args: unknown[]) => {
		const options: { rowMode?: string } = {};

		if (args.length > 0 && args[0] && typeof args[0] === "object") {
			const config = { ...(args[0] as Record<string, unknown>) };
			if ("rowMode" in config) {
				options.rowMode = config.rowMode as string | undefined;
				delete config.rowMode;
			}
			if ("types" in config) {
				delete config.types;
			}
			args[0] = config;
		}

		const result = originalQuery(...args);
		if (options.rowMode !== "array") {
			return result;
		}

		return Promise.resolve(result).then((res: unknown) => {
			if (!res || typeof res !== "object") {
				return res;
			}

			const resObj = res as {
				fields?: Array<{ name: string }> | (() => Array<{ name: string }>);
				rows?: Array<Record<string, unknown>>;
				[key: string]: unknown;
			};

			const fields = Array.isArray(resObj.fields)
				? resObj.fields
				: typeof resObj.fields === "function"
					? resObj.fields()
					: [];

			const rows = Array.isArray(resObj.rows)
				? resObj.rows.map((row) => {
						if (fields.length === 0) {
							return Object.values(row);
						}
						return fields.map((field) => row[field.name]);
					})
				: resObj.rows;

			return { ...resObj, rows };
		});
	}) as typeof queryable.query;
	return queryable;
};

const registerLanguages = (db: IMemoryDb): void => {
	db.registerLanguage("plpgsql", ({ code, schema }) => {
		const operations = compilePlPgSqlOperations(code);

		return () => {
			executeOperations(schema, operations);
			return null;
		};
	});
};

const applyMigrations = async (db: IMemoryDb): Promise<void> => {
	const files = await getMigrationFiles();

	for (const file of files) {
		if (MIGRATION_SKIP_LIST.has(file)) {
			continue;
		}

		const sql = await readFile(join(migrationsDir, file), "utf8");
		executeSqlFile(db.public, sql);
	}
};

const ensureTestCompatibility = (db: IMemoryDb): void => {
	const columnPatches = [
		{ table: "users", definition: '"hashed_password" text' },
		{ table: "users", definition: '"default_company_id" uuid' },
	];

	for (const patch of columnPatches) {
		try {
			db.public.none(
				`ALTER TABLE "${patch.table}" ADD COLUMN ${patch.definition}`,
			);
		} catch (error) {
			if (!isIgnorableMigrationError(error)) {
				throw error;
			}
		}
	}
};

export const createTestPool = async (): Promise<Pool> => {
	const db = newDb({
		autoCreateForeignKeyIndices: true,
		noAstCoverageCheck: true,
	});
	registerExtensions(db);
	registerLanguages(db);
	await applyMigrations(db);
	ensureTestCompatibility(db);

	const adapter = db.adapters.createPg();
	const pool = patchQueryable(new adapter.Pool()) as Pool;

	const originalConnect = pool.connect.bind(pool);
	pool.connect = (async (...args: unknown[]) => {
        const client = (await originalConnect(
            ...(args as Parameters<typeof pool.connect>)
        )) as unknown as PoolClient;
        return patchQueryable(client) as PoolClient;
	}) as typeof pool.connect;

	return pool as unknown as Pool;
};
export const createTestPool = async (): Promise<Pool> => {
	const db = newDb({
		autoCreateForeignKeyIndices: true,
		noAstCoverageCheck: true,
	});
	registerExtensions(db);
	registerLanguages(db);
	await applyMigrations(db);
	ensureTestCompatibility(db);

	const adapter = db.adapters.createPg();
	const pool = patchQueryable(new adapter.Pool()) as Pool;

	const originalConnect = pool.connect.bind(pool);
	pool.connect = (async (...args: unknown[]) => {
        const client = (await originalConnect(
            ...(args as Parameters<typeof pool.connect>)
        )) as unknown as PoolClient;
        return patchQueryable(client) as PoolClient;
	}) as typeof pool.connect;

	return pool as unknown as Pool;
};
