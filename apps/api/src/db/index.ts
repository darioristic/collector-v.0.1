import {
	drizzle as drizzleNodePostgres,
	type NodePgDatabase,
} from "drizzle-orm/node-postgres";
import {
	drizzle as drizzlePostgresJs,
	type PostgresJsDatabase,
} from "drizzle-orm/postgres-js";
import type { Pool } from "pg";
import { newDb } from "pg-mem";
import postgres from "postgres";

const loadEnv = async () => {
	try {
		const { config } = await import("dotenv");
		config();
	} catch (error) {
		const shouldLogWarning = process.env.NODE_ENV !== "production";

		if (shouldLogWarning) {
			console.warn(
				"dotenv nije pronađen; preskačem učitavanje .env fajla.",
				error,
			);
		}
	}
};

await loadEnv();

type PostgresJsClient = ReturnType<typeof postgres>;
type DrizzleClient =
	| PostgresJsDatabase<Record<string, never>>
	| NodePgDatabase<Record<string, never>>;

const isTestEnvironment =
	process.env.NODE_ENV === "test" || process.env.DATABASE_URL === "pg-mem";
const connectionString = process.env.DATABASE_URL;

if (!connectionString && !isTestEnvironment) {
	throw new Error("DATABASE_URL environment variable is not defined");
}

let client: PostgresJsClient | Pool;
let database: DrizzleClient;

if (connectionString && !isTestEnvironment && connectionString !== "pg-mem") {
	const pgClient = postgres(connectionString, {
		max: 10,
		prepare: false,
	});

	client = pgClient;
	database = drizzlePostgresJs(pgClient);
} else {
	const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
	const adapter = memoryDb.adapters.createPg();
	const pool = new adapter.Pool();

	client = pool;
	database = drizzleNodePostgres(pool);
}

export const pgClient = client;
export const connectionPool = client;
export const db = database;
export type AppDatabase = DrizzleClient;
