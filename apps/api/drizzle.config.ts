import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, ".env") });
config({ path: resolve(__dirname, ".env.local") });
config({ path: resolve(__dirname, "../../.env") });
config({ path: resolve(__dirname, "../../.env.local") });

// Resolve DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/collector_dashboard";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/*",
  out: "./src/db/migrations",
  dbCredentials: {
    url: databaseUrl
  },
  verbose: true,
  strict: true
});