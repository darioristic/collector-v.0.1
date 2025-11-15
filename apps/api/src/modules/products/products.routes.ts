import type { FastifyPluginAsync } from "fastify";
import { createSearchPreValidation } from "../../lib/validation/search";

import {
  adjustInventorySchema,
  createProductSchema,
  deleteProductSchema,
  getProductInventorySchema,
  getProductSchema,
  listInventorySchema,
  listProductsSchema,
  updateProductSchema
} from "./products.schema";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct
} from "./products.controller";
import {
  adjustInventory,
  getProductInventory,
  listInventory
} from "./inventory.controller";

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/",
    { schema: listProductsSchema, preValidation: createSearchPreValidation(255, "search") },
    listProducts
  );
  fastify.get("/inventory", { schema: listInventorySchema }, listInventory);
  fastify.get("/:id/inventory", { schema: getProductInventorySchema }, getProductInventory);
  fastify.post(
    "/:id/inventory/adjustments",
    { schema: adjustInventorySchema },
    adjustInventory
  );
  fastify.get("/:id", { schema: getProductSchema }, getProduct);
  fastify.post("/", { schema: createProductSchema }, createProduct);
  fastify.put("/:id", { schema: updateProductSchema }, updateProduct);
  fastify.delete("/:id", { schema: deleteProductSchema }, deleteProduct);
};

export default productsRoutes;

