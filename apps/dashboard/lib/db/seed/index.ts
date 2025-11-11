import "dotenv/config";

import { drizzle as drizzlePostgresJs } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { seedVault } from "./vault";

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString === "pg-mem") {
  throw new Error("DATABASE_URL mora biti definisan za pokretanje seed skripti.");
}

const client = postgres(connectionString, {
  max: Number(process.env.DB_MAX_CONNECTIONS ?? 5),
  idle_timeout: 0,
  prepare: false,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

const db = drizzlePostgresJs(client);

const run = async () => {
  const vaultResult = await seedVault(db);

  console.log(
    `[seed][vault] Kreirano: ${vaultResult.inserted}, preskočeno: ${vaultResult.skipped}`
  );
};

run()
  .then(async () => {
    await client.end({ timeout: 5 });
  })
  .catch(async (error) => {
    console.error("[seed] Greška pri pokretanju seed skripti", error);
    await client.end({ timeout: 5 });
    process.exit(1);
  });


