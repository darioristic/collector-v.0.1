import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { connectionPool, db } from "./index";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "migrations");

const run = async () => {
  await migrate(db, {
    migrationsFolder
  });

  await connectionPool.end();
};

void run().catch((error) => {
  console.error("Database migration failed", error);
  process.exit(1);
});

