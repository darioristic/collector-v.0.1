import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Pool } from "pg";

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations",
);

const loadEnv = async () => {
	try {
		const { config } = await import("dotenv");
		config();
	} catch (error) {
		if (process.env.NODE_ENV !== "production") {
			console.warn(
				"dotenv nije pronađen; preskačem učitavanje .env fajla.",
				error,
			);
		}
	}
};

await loadEnv();

const DEFAULT_LOCAL_CONNECTION =
	"postgres://postgres:postgres@localhost:5432/collector_dashboard";

const run = async () => {
	const environment = process.env.NODE_ENV ?? "development";
	const forceInMemory = process.env.USE_IN_MEMORY_DB === "true";
	const rawConnectionString = process.env.DATABASE_URL?.trim();
	const fallbackConnectionString =
		!rawConnectionString && !forceInMemory && environment !== "production"
			? DEFAULT_LOCAL_CONNECTION
			: undefined;
	const connectionString = rawConnectionString ?? fallbackConnectionString;

	if (!connectionString || connectionString === "pg-mem") {
		throw new Error(
			"DATABASE_URL mora biti definisan i mora ukazivati na PostgreSQL instancu za pokretanje migracija.\n" +
				"U development okruženju, ako DATABASE_URL nije definisan, koristi se fallback:\n" +
				`  ${DEFAULT_LOCAL_CONNECTION}\n\n` +
				"Molimo proverite da li PostgreSQL server radi na toj adresi.",
		);
	}

	const pool = new Pool({
		connectionString,
		max: Number(process.env.DB_MAX_CONNECTIONS ?? 10),
		ssl:
			process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
	});

	try {
		// Create migrations tracking table if it doesn't exist
		await pool.query(`
			CREATE TABLE IF NOT EXISTS drizzle_migrations (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			);
		`);

		// Add unique constraint if it doesn't exist
		await pool.query(`
			DO $$ 
			BEGIN
				IF NOT EXISTS (
					SELECT 1 FROM pg_constraint 
					WHERE conname = 'drizzle_migrations_hash_key'
				) THEN
					ALTER TABLE drizzle_migrations ADD CONSTRAINT drizzle_migrations_hash_key UNIQUE (hash);
				END IF;
			END $$;
		`);

		// Get list of migration files
		const files = await readdir(migrationsFolder);
		const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();

		console.log(`Found ${sqlFiles.length} migration files`);

		// Get already executed migrations
		const executedResult = await pool.query(
			"SELECT hash FROM drizzle_migrations ORDER BY id",
		);
		const executedHashes = new Set(executedResult.rows.map((row) => row.hash));

		// Execute each migration
		for (const file of sqlFiles) {
			const filePath = join(migrationsFolder, file);
			const content = await readFile(filePath, "utf-8");
			const hash = `${file}_${content.length}`;

			if (executedHashes.has(hash)) {
				console.log(`⏭  Skipping ${file} (already executed)`);
				continue;
			}

			console.log(`▶  Running ${file}...`);

			try {
				await pool.query("BEGIN");

				// Process SQL content - handle statements that need IF NOT EXISTS checks
				let wrappedContent = content;

				// Wrap CREATE TYPE statements with IF NOT EXISTS check
				// Handle both "CREATE TYPE" and "CREATE TYPE IF NOT EXISTS"
				wrappedContent = wrappedContent.replace(
					/CREATE TYPE\s+(?:IF NOT EXISTS\s+)?(?:"([^"]+)"|(\w+))\s+AS\s+ENUM\s*\([^)]+\)/gi,
					(match, quotedName, unquotedName) => {
						const typeName = quotedName || unquotedName;
						// Remove "IF NOT EXISTS" from the match if present, as we'll handle it in DO block
						const cleanMatch = match.replace(/\s+IF NOT EXISTS\s+/i, " ");
						return `
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN
		${cleanMatch};
	END IF;
END $$;`;
					},
				);

				// Wrap ADD CONSTRAINT IF NOT EXISTS statements
				// PostgreSQL doesn't support IF NOT EXISTS for ADD CONSTRAINT directly
				wrappedContent = wrappedContent.replace(
					/ALTER TABLE\s+(?:"([^"]+)"|(\w+))\s+ADD CONSTRAINT\s+IF NOT EXISTS\s+(?:"([^"]+)"|(\w+))\s+([\s\S]+?);/gi,
					(
						_match,
						tableQuoted,
						tableUnquoted,
						constraintQuoted,
						constraintUnquoted,
						constraintDef,
					) => {
						const tableName = tableQuoted || tableUnquoted;
						const constraintName = constraintQuoted || constraintUnquoted;
						return `
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint 
		WHERE conname = '${constraintName}'
	) THEN
		ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraintName}" ${constraintDef.trim()};
	END IF;
END $$;`;
					},
				);

				await pool.query(wrappedContent);

				// Insert migration record (ignore if already exists)
				try {
					await pool.query(
						"INSERT INTO drizzle_migrations (hash, created_at) VALUES ($1, $2)",
						[hash, Date.now()],
					);
				} catch (insertError) {
					// Ignore duplicate key errors
					const insertErrorMsg =
						insertError instanceof Error
							? insertError.message
							: String(insertError);
					if (
						!insertErrorMsg.includes("duplicate key") &&
						!insertErrorMsg.includes("unique constraint")
					) {
						throw insertError;
					}
				}

				await pool.query("COMMIT");
				console.log(`✓  Completed ${file}`);
			} catch (error) {
				await pool.query("ROLLBACK");
				const errorMsg = error instanceof Error ? error.message : String(error);

				// Check if error is about already existing objects
				if (
					errorMsg.includes("already exists") ||
					errorMsg.includes("duplicate key") ||
					errorMsg.includes("relation already exists")
				) {
					console.log(
						`⚠  ${file} had conflicts (objects may already exist), marking as executed...`,
					);
					// Still mark as executed to avoid retries
					try {
						// Use a simple INSERT with error handling instead of ON CONFLICT
						// since the constraint might not exist yet
						await pool.query(
							"INSERT INTO drizzle_migrations (hash, created_at) VALUES ($1, $2)",
							[hash, Date.now()],
						);
					} catch (insertError) {
						// Ignore if hash already exists (duplicate key error)
						const insertErrorMsg =
							insertError instanceof Error
								? insertError.message
								: String(insertError);
						if (
							!insertErrorMsg.includes("duplicate key") &&
							!insertErrorMsg.includes("unique constraint")
						) {
							// Re-throw if it's a different error
							throw insertError;
						}
					}
				} else {
					throw new Error(`Migration ${file} failed: ${errorMsg}`);
				}
			}
		}

		console.log("✓ All migrations completed successfully");
	} finally {
		await pool.end();
	}
};

void run().catch((error) => {
	console.error("Pokretanje migracija je neuspešno završeno", error);
	process.exit(1);
});
