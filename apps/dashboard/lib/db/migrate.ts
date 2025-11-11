import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "migrations");

const loadEnv = async () => {
  try {
    const { config } = await import("dotenv");
    config();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("dotenv nije pronađen; preskačem učitavanje .env fajla.", error);
    }
  }
};

await loadEnv();

const run = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString === "pg-mem") {
    throw new Error(
      "DATABASE_URL mora biti definisan i mora ukazivati na PostgreSQL instancu za pokretanje migracija."
    );
  }

  const pool = new Pool({
    connectionString,
    max: Number(process.env.DB_MAX_CONNECTIONS ?? 10),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined
  });

  try {
    const nodeDb = drizzleNodePostgres(pool);
    await migrate(nodeDb, { migrationsFolder });
  } finally {
    await pool.end();
  }
};

void run().catch((error) => {
  console.error("Pokretanje migracija je neuspešno završeno", error);
  process.exit(1);
});


