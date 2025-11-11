"use server";

import type { Pool } from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePostgresJs } from "drizzle-orm/postgres-js";
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

const connectionString = process.env.DATABASE_URL;
const shouldUseInMemoryDb =
  process.env.NODE_ENV === "test" || connectionString === "pg-mem";
const globalForDb = globalThis as DatabaseGlobals;

const createPgMemDatabase = (): { client: Pool; db: NodePgDatabase<Record<string, never>> } => {
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
    db: drizzleNodePostgres(pool)
  };
};

const createPostgresJsDatabase = (
  url: string
): { client: PostgresJsClient; db: PostgresJsDatabase<Record<string, never>> } => {
  const client = postgres(url, {
    max: 10,
    prepare: false
  });

  return {
    client,
    db: drizzlePostgresJs(client)
  };
};

if (!connectionString && !shouldUseInMemoryDb) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

const hasMismatchedDriver =
  typeof globalForDb._usingInMemoryDb === "boolean" && globalForDb._usingInMemoryDb !== shouldUseInMemoryDb;

if (!globalForDb._drizzle || hasMismatchedDriver) {
  const { client, db } = shouldUseInMemoryDb
    ? createPgMemDatabase()
    : createPostgresJsDatabase(connectionString!);

  globalForDb._dbClient = client;
  globalForDb._drizzle = db;
  globalForDb._usingInMemoryDb = shouldUseInMemoryDb;
}

export const db = globalForDb._drizzle as DatabaseInstance;

