import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Pool } from "pg";
import { newDb, type IMemoryDb } from "pg-mem";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../../src/db/migrations");

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

const registerExtensions = (db: IMemoryDb): void => {
	db.registerExtension("pgcrypto", (schema) => {
		schema.registerFunction({
			name: "gen_random_uuid",
			returns: "uuid",
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
		returns: "uuid",
		implementation: () => randomUUID(),
		impure: true,
	});
};

const registerLanguages = (db: IMemoryDb): void => {
	const sanitizePlPgSql = (code: string): string[] => {
		const controlFlowPatterns = [
			/^BEGIN;?$/i,
			/^END;?$/i,
			/^END IF;?$/i,
			/^IF\b.*THEN;?$/i,
			/^ELSE$/i,
			/^ELSIF\b.*THEN;?$/i,
			/^EXCEPTION$/i,
			/^WHEN\b.*THEN$/i,
			/^LOOP$/i,
			/^END LOOP;?$/i,
			/^NULL;?$/i,
		];

		const lines = code
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0 && !line.startsWith("--"))
			.filter((line) => !controlFlowPatterns.some((pattern) => pattern.test(line)));

		const sanitized = lines.join("\n");

		return sanitized
			.split(";")
			.map((statement) => statement.trim())
			.filter((statement) => statement.length > 0)
			.map((statement) =>
				statement.replace(/ADD VALUE IF NOT EXISTS/gi, "ADD VALUE"),
			);
	};

	db.registerLanguage("plpgsql", ({ code, schema }) => {
		const statements = sanitizePlPgSql(code);

		return () => {
			for (const statement of statements) {
				schema.none(statement);
			}

			return null;
		};
	});
};

const applyMigrations = async (db: IMemoryDb): Promise<void> => {
	const files = await getMigrationFiles();

	for (const file of files) {
		const sql = await readFile(join(migrationsDir, file), "utf8");
		db.public.none(sql);
	}
};

export const createTestPool = async (): Promise<Pool> => {
	const db = newDb({ autoCreateForeignKeyIndices: true });
	registerExtensions(db);
	registerLanguages(db);
	await applyMigrations(db);

	const adapter = db.adapters.createPg();
	const pool = new adapter.Pool();

	return pool as unknown as Pool;
};


