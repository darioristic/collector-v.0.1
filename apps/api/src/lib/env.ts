import { z } from "zod";

/**
 * Environment Variables Schema & Validation
 *
 * Validates all required environment variables on startup.
 * Fails fast with clear error messages if configuration is invalid.
 */

const envSchema = z.object({
	// Node Environment
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

	// Server Configuration
	PORT: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.pipe(z.number().min(1).max(65535))
		.default("4000"),
	HOST: z.string().default("0.0.0.0"),

	// Database
	DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),

	// Redis
	REDIS_URL: z.string().url("REDIS_URL must be a valid Redis connection URL"),

	// CORS
	ALLOWED_ORIGINS: z
		.string()
		.refine(
			(val) => {
				// In production, NEVER allow wildcard
				if (process.env.NODE_ENV === "production" && val === "*") {
					return false;
				}
				return true;
			},
			{
				message:
					"ALLOWED_ORIGINS cannot be '*' in production! Use comma-separated list of allowed origins.",
			},
		)
		.optional(),

	// Logging
	LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).optional(),

	// Optional Settings
	SESSION_EXPIRY_DAYS: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.pipe(z.number().positive())
		.default("30"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 *
 * Call this at application startup before anything else.
 * Will exit process with code 1 if validation fails.
 */
export function validateEnv(): Env {
	try {
		const parsed = envSchema.parse(process.env);

		console.log("✅ Environment validation passed");

		// Log non-sensitive config in development
		if (parsed.NODE_ENV !== "production") {
			console.log("📋 Configuration:");
			console.log(`  NODE_ENV: ${parsed.NODE_ENV}`);
			console.log(`  PORT: ${parsed.PORT}`);
			console.log(`  HOST: ${parsed.HOST}`);
			console.log(`  DATABASE_URL: ${maskConnectionString(parsed.DATABASE_URL)}`);
			console.log(`  REDIS_URL: ${maskConnectionString(parsed.REDIS_URL)}`);
			console.log(`  ALLOWED_ORIGINS: ${parsed.ALLOWED_ORIGINS || "*"}`);
		}

		return parsed;
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("❌ Environment validation failed:");
			console.error("");

			for (const issue of error.issues) {
				console.error(`  ${issue.path.join(".")}: ${issue.message}`);
			}

			console.error("");
			console.error("Please check your .env file and ensure all required variables are set.");
			console.error("See .env.example for reference.");
		} else {
			console.error("❌ Unexpected error during environment validation:", error);
		}

		process.exit(1);
	}
}

/**
 * Mask sensitive parts of connection strings for logging
 */
function maskConnectionString(url: string): string {
	try {
		const parsed = new URL(url);

		if (parsed.password) {
			parsed.password = "****";
		}

		return parsed.toString();
	} catch {
		return "****";
	}
}

// Export validated environment for use throughout the app
export const env = validateEnv();