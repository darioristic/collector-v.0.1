import pino from "pino";

/**
 * Standalone logger for CLI scripts (seed, migrate, etc.)
 * Uses pino with pretty printing in development, JSON in production
 */
export const createStandaloneLogger = () => {
	const isProduction = process.env.NODE_ENV === "production";
	const level = process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

	if (isProduction) {
		return pino({ level });
	}

	return pino({
		level,
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true,
				singleLine: false,
				translateTime: "SYS:standard",
			},
		},
	});
};

export const logger = createStandaloneLogger();

