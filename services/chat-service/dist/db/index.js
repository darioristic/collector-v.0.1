import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("[chat-service] DATABASE_URL environment variable is not defined");
    console.error("[chat-service] Available env vars:", Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("DB")));
    throw new Error("DATABASE_URL environment variable is not defined");
}
console.log(`[chat-service] Database connection string: ${connectionString.split("@")[1] || "configured"}`);
const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
// Test connection on startup
pool.on("connect", () => {
    console.log("[chat-service] Database pool connected");
});
pool.on("error", (err) => {
    console.error("[chat-service] Database pool error:", err);
});
export const db = drizzle(pool);
