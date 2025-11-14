import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import Fastify, {
	type FastifyInstance,
	type FastifyLoggerOptions,
	type FastifyPluginAsync,
} from "fastify";

import { type AppDatabase, db } from "./db/index.js";
import "./lib/env"; // Validate environment variables FIRST (will exit if invalid)
import { cachePlugin } from "./lib/cache.service";
import metricsPlugin from "./plugins/metrics.plugin";
import corsPlugin from "./plugins/cors";
import errorHandlerPlugin from "./plugins/error-handler";
import openApiPlugin from "./plugins/openapi";
import rateLimitPlugin from "./plugins/rate-limit";
import healthRoutes from "./routes/health";
import metricsRoutes from "./routes/metrics";

type PrettyLoggerOptions = FastifyLoggerOptions & {
	transport: {
		target: string;
		options?: Record<string, unknown>;
	};
};

const createLogger = (): FastifyLoggerOptions => {
	const baseLevel =
		process.env.LOG_LEVEL ??
		(process.env.NODE_ENV === "production" ? "info" : "debug");

	if (process.env.NODE_ENV === "production") {
		return {
			level: baseLevel,
		};
	}

	const devLogger: PrettyLoggerOptions = {
		level: baseLevel,
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true,
				singleLine: false,
				translateTime: "SYS:standard",
			},
		},
	};

	return devLogger;
};

const registerHealthcheck = (app: FastifyInstance) =>
	app.register(healthRoutes, { prefix: "/api" });

const registerMetrics = (app: FastifyInstance) =>
	app.register(metricsRoutes, { prefix: "/api" });

const modulesBaseUrl = new URL("./modules/", import.meta.url);
const modulesPath = fileURLToPath(modulesBaseUrl);

const loadModule = async (
	app: FastifyInstance,
	moduleName: string,
): Promise<FastifyPluginAsync | undefined> => {
	const candidates = [`./${moduleName}/index.ts`, `./${moduleName}/index.js`];

	for (const candidate of candidates) {
		const moduleUrl = new URL(candidate, modulesBaseUrl);

		try {
			const importedModule = await import(moduleUrl.href);

			if (typeof importedModule.default === "function") {
				return importedModule.default as FastifyPluginAsync;
			}
		} catch (error) {
			const nodeError = error as NodeJS.ErrnoException;

			if (
				nodeError?.code === "ERR_MODULE_NOT_FOUND" ||
				nodeError?.code === "MODULE_NOT_FOUND" ||
				(nodeError instanceof Error &&
					nodeError.message.includes("Cannot find module"))
			) {
				continue;
			}

			app.log.error(
				{ err: error, module: moduleName },
				"Failed to import module",
			);
			return undefined;
		}
	}

	return undefined;
};

const registerModules = async (app: FastifyInstance) => {
	let entries: Array<{ name: string; isDirectory(): boolean }>;

	try {
		entries = await readdir(modulesPath, { withFileTypes: true });
	} catch (error) {
		const nodeError = error as NodeJS.ErrnoException;

		if (nodeError?.code === "ENOENT") {
			app.log.warn("No modules directory found, skipping module registration");
			return;
		}

		throw error;
	}

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}

		const modulePlugin = await loadModule(app, entry.name);

		if (!modulePlugin) {
			app.log.warn(
				{ module: entry.name },
				"Module failed to load or is missing a default export, skipping",
			);
			continue;
		}

		try {
			await app.register(modulePlugin, { prefix: "/api" });
			app.log.info({ module: entry.name }, "Module registered");
		} catch (error) {
			app.log.error(
				{ err: error, module: entry.name },
				"Failed to register module, skipping",
			);
			continue;
		}
	}
};

export const buildServer = async () => {
	const logger = createLogger();
	const app = Fastify({ logger });
	const database: AppDatabase = db;

	if (!app.hasDecorator("db")) {
		app.decorate("db", { getter: () => database });
	}

	if (!app.hasRequestDecorator("db")) {
		app.decorateRequest("db", { getter: () => database });
	}

	await app.register(corsPlugin);
	await app.register(metricsPlugin);
	await app.register(cachePlugin);
	await app.register(rateLimitPlugin); // Rate limiting - MUST be after cache (for Redis)
	await app.register(errorHandlerPlugin);
	await app.register(openApiPlugin);
	await registerHealthcheck(app);
	await registerMetrics(app);
	await registerModules(app);

	return app;
};

const fastify = await buildServer();

const start = async () => {
	const port = Number(process.env.PORT ?? 4000);
	const host = process.env.HOST ?? "0.0.0.0";

	try {
		await fastify.listen({
			port,
			host,
		});

		fastify.log.info(
			`Server listening at http://${host === "0.0.0.0" ? "localhost" : host}:${port}`,
		);
	} catch (error) {
		const nodeError = error as NodeJS.ErrnoException;

		if (nodeError?.code === "EADDRINUSE") {
			fastify.log.error(
				`Failed to start server. Port ${port} is already in use.`,
			);
			fastify.log.error(
				`Please free the port by running: lsof -ti:${port} | xargs kill -9`,
			);
			fastify.log.error(
				`Or use a different port by setting PORT environment variable.`,
			);
		} else {
			fastify.log.error(
				{ err: error },
				"Failed to start server. Is port 4000 in use?",
			);
		}

		process.exit(1);
	}
};

const isMain =
	typeof process.argv[1] === "string" &&
	import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
	void start();
}

export default fastify;
