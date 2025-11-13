import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { logger } from "../lib/logger";

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations",
);

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

const run = async () => {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString || connectionString === "pg-mem") {
		throw new Error(
			"DATABASE_URL must be defined and point to a real PostgreSQL instance for migrations.",
		);
	}

	const pool = new Pool({
		connectionString,
		max: Number(process.env.DB_MAX_CONNECTIONS ?? 10),
		ssl:
			process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
	});

	try {
		const nodeDb = drizzleNodePostgres(pool);
		await migrate(nodeDb, { migrationsFolder });
	} finally {
		await pool.end();
	}
};

void run().catch((error) => {
	logger.error({ err: error }, "Database migration failed");
	process.exit(1);
});
