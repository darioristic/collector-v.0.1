import type { FastifyPluginAsync } from "fastify";

import {
  createProductSchema,
  deleteProductSchema,
  listInventorySchema,
  listProductsSchema,
  updateProductSchema
} from "./products.schema";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct
} from "./products.controller";
import { listInventory } from "./inventory.controller";

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", { schema: listProductsSchema }, listProducts);
  fastify.post("/", { schema: createProductSchema }, createProduct);
  fastify.put("/:id", { schema: updateProductSchema }, updateProduct);
  fastify.delete("/:id", { schema: deleteProductSchema }, deleteProduct);
  fastify.get("/inventory", { schema: listInventorySchema }, listInventory);
};

export default productsRoutes;

