import Fastify from "fastify";
import { pathToFileURL } from "node:url";
const fastify = Fastify({ logger: true });
const systemUser = {
    id: "system",
    email: "system@crm.local",
    name: "System"
};
fastify.get("/api/health", async () => {
    fastify.log.debug({ checkedBy: systemUser.id }, "Health check requested");
    return { status: "ok" };
});
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
