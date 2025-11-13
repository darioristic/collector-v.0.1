import "dotenv/config";

import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
	throw new Error(
		"DATABASE_URL environment variable is required for Drizzle configuration.",
	);
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./lib/db/schema/**/*.ts",
	out: "./lib/db/migrations",
	casing: "snake_case",
	breakpoints: false,
	strict: true,
	// Disable interactive prompts
	verbose: false,
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
});
