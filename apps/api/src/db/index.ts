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
import { logger } from "../lib/logger";
import { getMetricsService } from "../lib/metrics.service";

const loadEnv = async () => {
	try {
		const { config } = await import("dotenv");
		config();
	} catch (error) {
		const shouldLogWarning = process.env.NODE_ENV !== "production";

		if (shouldLogWarning) {
			logger.warn(
				{ err: error },
				"dotenv nije pronađen; preskačem učitavanje .env fajla.",
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
    const baseClient = postgres(connectionString, {
        max: 10,
        prepare: false,
    });

    const metricsEnabled = process.env.DB_METRICS_ENABLED === "true";
    const pgClient = (() => {
        if (!metricsEnabled) return baseClient;
        const metrics = getMetricsService();
        const wrap = (fn: (...args: unknown[]) => unknown) => {
            return (...args: unknown[]) => {
                const start = Date.now();
                try {
                    const result = fn(...args);
                    return Promise.resolve(result).finally(() => {
                        metrics.recordQueryTime("", Date.now() - start);
                    });
                } catch (error) {
                    metrics.recordQueryTime("", Date.now() - start);
                    throw error;
                }
            };
        };
        const wrapped = ((...args: unknown[]) => wrap(baseClient as unknown as (...args: unknown[]) => unknown)(...args)) as ReturnType<typeof postgres>;
        (wrapped as unknown as { unsafe: (...args: unknown[]) => unknown }).unsafe = wrap((baseClient as unknown as { unsafe: (...args: unknown[]) => unknown }).unsafe.bind(baseClient as unknown as object));
        (wrapped as unknown as { end: (...args: unknown[]) => unknown }).end = (baseClient as unknown as { end: (...args: unknown[]) => unknown }).end.bind(baseClient as unknown as object);
        if ((baseClient as unknown as { begin?: (...args: unknown[]) => unknown }).begin) {
            (wrapped as unknown as { begin: (...args: unknown[]) => unknown }).begin = wrap((baseClient as unknown as { begin: (...args: unknown[]) => unknown }).begin.bind(baseClient as unknown as object));
        }
        if ((baseClient as unknown as { transaction?: (...args: unknown[]) => unknown }).transaction) {
            (wrapped as unknown as { transaction: (...args: unknown[]) => unknown }).transaction = (baseClient as unknown as { transaction: (...args: unknown[]) => unknown }).transaction.bind(baseClient as unknown as object);
        }
        return wrapped as typeof baseClient;
    })();

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
