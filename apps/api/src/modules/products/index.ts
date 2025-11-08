import type { FastifyPluginAsync } from "fastify";

import productsRoutes from "./products.routes";

const productsModule: FastifyPluginAsync = async (app) => {
  await app.register(productsRoutes, { prefix: "/products" });
};

export default productsModule;

