"use server";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePostgresJs } from "drizzle-orm/postgres-js";
import type { Pool } from "pg";
import { newDb } from "pg-mem";
import postgres from "postgres";

type PostgresJsClient = ReturnType<typeof postgres>;
type DatabaseInstance =
	| PostgresJsDatabase<Record<string, never>>
	| NodePgDatabase<Record<string, never>>;

type DatabaseGlobals = {
	_dbClient?: PostgresJsClient | Pool;
	_drizzle?: DatabaseInstance;
	_usingInMemoryDb?: boolean;
};

const DEFAULT_LOCAL_CONNECTION =
	"postgres://postgres:postgres@localhost:5432/collector_dashboard";

const environment = process.env.NODE_ENV ?? "development";
const forceInMemory = process.env.USE_IN_MEMORY_DB === "true";
const rawConnectionString = process.env.DATABASE_URL?.trim();
const fallbackConnectionString =
	!rawConnectionString && !forceInMemory && environment !== "production"
		? DEFAULT_LOCAL_CONNECTION
		: undefined;
const connectionString = rawConnectionString ?? fallbackConnectionString;

if (!rawConnectionString && fallbackConnectionString) {
	process.env.DATABASE_URL = fallbackConnectionString;
}

const shouldUseInMemoryDb =
	forceInMemory ||
	environment === "test" ||
	connectionString === "pg-mem" ||
	!connectionString;
const globalForDb = globalThis as DatabaseGlobals;

const createPgMemDatabase = (): {
	client: Pool;
	db: NodePgDatabase<Record<string, never>>;
} => {
	const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
	const adapter = memoryDb.adapters.createPg();
	const pool = new adapter.Pool();
	const originalQuery = pool.query.bind(pool);

	pool.query = (config: any, values?: any, callback?: any) => {
		if (config && typeof config === "object" && "rowMode" in config) {
			// pg-mem does not support rowMode; strip it to fallback to default behaviour
			delete config.rowMode;
		}
		if (config && typeof config === "object" && "types" in config) {
			delete config.types;
		}
		return originalQuery(config, values, callback);
	};

	return {
		client: pool,
		db: drizzleNodePostgres(pool),
	};
};

const createPostgresJsDatabase = (
	url: string,
): {
	client: PostgresJsClient;
	db: PostgresJsDatabase<Record<string, never>>;
} => {
	const client = postgres(url, {
		max: 10,
		prepare: false,
	});

	return {
		client,
		db: drizzlePostgresJs(client),
	};
};

if (!connectionString && !shouldUseInMemoryDb) {
	throw new Error("DATABASE_URL environment variable is not defined");
}

if (!connectionString && shouldUseInMemoryDb && environment === "production") {
	console.warn(
		"[database] DATABASE_URL is missing. Falling back to the in-memory pg-mem instance. Configure DATABASE_URL to connect to PostgreSQL.",
	);
}

const ensureDatabase = () => {
	const hasMismatchedDriver =
		typeof globalForDb._usingInMemoryDb === "boolean" &&
		globalForDb._usingInMemoryDb !== shouldUseInMemoryDb;

	if (!globalForDb._drizzle || hasMismatchedDriver) {
		const { client, db } = shouldUseInMemoryDb
			? createPgMemDatabase()
			: createPostgresJsDatabase(connectionString!);

		globalForDb._dbClient = client;
		globalForDb._drizzle = db;
		globalForDb._usingInMemoryDb = shouldUseInMemoryDb;
	}
};

export async function getDb(): Promise<DatabaseInstance> {
	ensureDatabase();
	return globalForDb._drizzle as DatabaseInstance;
}
