import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

export const pgClient = postgres(connectionString, {
  max: 10,
  prepare: false
});

export const connectionPool = pgClient;
export const db = drizzle(pgClient);
