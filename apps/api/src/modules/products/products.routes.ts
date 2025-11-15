import type { FastifyPluginAsync } from "fastify";
import type { ApiDataReply, ApiListReplyWithMeta } from "../../lib/errors";
import type { ProductIdParams, ProductCreateBody, ProductUpdateBody } from "./products.schema";

type ProductResponse = {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  description: string | null;
  specifications: Record<string, unknown> | null;
  category: string | null;
  active: boolean;
  relatedSalesOrders: string[];
};

type ListProductsReply = ApiListReplyWithMeta<ProductResponse>;
type GetProductReply = ApiDataReply<ProductResponse>;
type CreateProductReply = ApiDataReply<ProductResponse>;
type UpdateProductReply = ApiDataReply<ProductResponse>;
type DeleteProductReply = ApiDataReply<void>;
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
  fastify.get<{
    Querystring: {
      search?: string;
      status?: string | string[];
      categoryId?: string | string[];
      limit?: number;
      offset?: number;
    };
    Reply: ListProductsReply;
  }>(
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
  fastify.get<{ Params: ProductIdParams; Reply: GetProductReply }>("/:id", { schema: getProductSchema }, getProduct);
  fastify.post<{ Body: ProductCreateBody; Reply: CreateProductReply }>("/", { schema: createProductSchema }, createProduct);
  fastify.put<{ Params: ProductIdParams; Body: ProductUpdateBody; Reply: UpdateProductReply }>(
    "/:id",
    { schema: updateProductSchema },
    updateProduct
  );
  fastify.delete<{ Params: ProductIdParams; Reply: DeleteProductReply }>("/:id", { schema: deleteProductSchema }, deleteProduct);
};

export default productsRoutes;

