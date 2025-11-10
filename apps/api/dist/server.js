import Fastify from "fastify";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import errorHandlerPlugin from "./plugins/error-handler";
import openApiPlugin from "./plugins/openapi";
import healthRoutes from "./routes/health";
const createLoggerOptions = () => {
    const baseLevel = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug");
    if (process.env.NODE_ENV === "production") {
        return {
            level: baseLevel
        };
    }
    return {
        level: baseLevel,
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                singleLine: false,
                translateTime: "SYS:standard"
            }
        }
    };
};
const registerHealthcheck = (app) => app.register(healthRoutes, { prefix: "/api" });
const modulesBaseUrl = new URL("./modules/", import.meta.url);
const modulesPath = fileURLToPath(modulesBaseUrl);
const loadModule = async (app, moduleName) => {
    const candidates = [`./${moduleName}/index.ts`, `./${moduleName}/index.js`];
    for (const candidate of candidates) {
        const moduleUrl = new URL(candidate, modulesBaseUrl);
        try {
            const importedModule = await import(moduleUrl.href);
            if (typeof importedModule.default === "function") {
                return importedModule.default;
            }
        }
        catch (error) {
            const nodeError = error;
            if (nodeError?.code === "ERR_MODULE_NOT_FOUND" ||
                nodeError?.code === "MODULE_NOT_FOUND" ||
                (nodeError instanceof Error && nodeError.message.includes("Cannot find module"))) {
                continue;
            }
            app.log.error({ err: error, module: moduleName }, "Failed to import module");
            return undefined;
        }
    }
    return undefined;
};
const registerModules = async (app) => {
    let entries;
    try {
        entries = await readdir(modulesPath, { withFileTypes: true });
    }
    catch (error) {
        const nodeError = error;
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
            app.log.warn({ module: entry.name }, "Module export missing or failed to load");
            continue;
        }
        await app.register(modulePlugin, { prefix: "/api" });
        app.log.info({ module: entry.name }, "Module registered");
    }
};
export const buildServer = async () => {
    const app = Fastify({ logger: createLoggerOptions() });
    await app.register(errorHandlerPlugin);
    await app.register(openApiPlugin);
    await registerHealthcheck(app);
    await registerModules(app);
    return app;
};
const fastify = await buildServer();
const start = async () => {
    try {
        await fastify.listen({
            port: Number(process.env.PORT ?? 4000),
            host: process.env.HOST ?? "0.0.0.0"
        });
        fastify.log.info("API server is listening");
    }
    catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
};
const isMain = typeof process.argv[1] === "string" && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    void start();
}
export default fastify;
