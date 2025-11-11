import type { FastifyPluginAsync } from "fastify";

import productsRoutes from "./products.routes";
import { createProductsRepository } from "./products.repository";
import { ProductsService } from "./products.service";

const productsModule: FastifyPluginAsync = async (fastify) => {
  const repository = createProductsRepository(fastify.db);
  const service = new ProductsService(repository, fastify.cache);

  if (!fastify.hasDecorator("productsService")) {
    fastify.decorate("productsService", service);
  }

  if (!fastify.hasRequestDecorator("productsService")) {
    fastify.decorateRequest("productsService", { getter: () => service });
  }

  await fastify.register(productsRoutes, { prefix: "/products" });
};

export default productsModule;

