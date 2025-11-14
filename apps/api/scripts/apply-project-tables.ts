import { Pool } from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadEnv = async () => {
	try {
		const { config } = await import("dotenv");
		config({ path: join(__dirname, "../.env") });
		config({ path: join(__dirname, "../.env.local") });
		config({ path: join(__dirname, "../../.env") });
		config({ path: join(__dirname, "../../.env.local") });
	} catch {
		// Ignore if dotenv is not available
	}
};

await loadEnv();

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString === "pg-mem") {
	console.error("DATABASE_URL must be defined and point to a real PostgreSQL instance.");
	process.exit(1);
}

const pool = new Pool({
	connectionString,
	max: Number(process.env.DB_MAX_CONNECTIONS ?? 10),
	ssl:
		process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

try {
	const sql = readFileSync(
		join(__dirname, "../src/db/migrations/apply_project_tables.sql"),
		"utf-8",
	);

	console.log("Applying project tables migration...");
	await pool.query(sql);
	console.log("✅ Migration applied successfully!");
} catch (error) {
	console.error("❌ Migration failed:", error);
	process.exit(1);
} finally {
	await pool.end();
}

