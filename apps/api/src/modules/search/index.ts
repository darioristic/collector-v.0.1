import type { FastifyPluginAsync } from "fastify";
import searchRoutes from "./search.routes";

const searchModule: FastifyPluginAsync = async (app) => {
	await app.register(searchRoutes, { prefix: "/search" });
};

export default searchModule;

