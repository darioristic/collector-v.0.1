import type { FastifyReply, RouteHandler } from "fastify";

import {
  createHttpError,
  type ApiDataReply,
  type ApiListReply
} from "../../lib/errors";
import { isProductsServiceError } from "./products.service";
import type {
  InventoryAdjustmentInput,
  ProductInventorySummary
} from "./products.types";
import type { ProductIdParams } from "./products.schema";

type InventorySummaryResponse = ProductInventorySummary & {
  productName?: string;
  sku?: string;
};

type ListInventoryReply = ApiListReply<InventorySummaryResponse>;
type GetInventoryReply = ApiDataReply<InventorySummaryResponse>;
type AdjustInventoryReply = ApiDataReply<InventorySummaryResponse>;

type AdjustInventoryBody = {
  adjustments: InventoryAdjustmentInput[];
};

const mapInventorySummary = (
  summary: ProductInventorySummary,
  productName?: string,
  sku?: string
): InventorySummaryResponse => ({
  ...summary,
  productName,
  sku
});

const handleServiceError = (reply: FastifyReply, error: unknown) => {
  if (isProductsServiceError(error)) {
    return reply
      .status(error.statusCode)
      .send(
        createHttpError(error.statusCode, error.message, {
          error: error.code,
          details: error.details
        })
      );
  }

  throw error;
};

export const listInventory: RouteHandler<{
  Reply: ListInventoryReply;
}> = async (request, reply) => {
  try {
    const result = await request.productsService.list({
      includeInventoryDetails: true
    });

    const data = result.items.map((product) =>
      mapInventorySummary(product.inventory ?? {
        productId: product.id,
        onHand: 0,
        reserved: 0,
        available: 0,
        locations: []
      }, product.name, product.sku)
    );

    return reply.status(200).send({ data });
  } catch (error) {
    return handleServiceError(reply, error);
  }
};

export const getProductInventory: RouteHandler<{
  Params: ProductIdParams;
  Reply: GetInventoryReply;
}> = async (request, reply) => {
  try {
    const product = await request.productsService.getProduct(request.params.id, {
      includeInventoryDetails: true
    });

    if (!product) {
      return reply
        .status(404)
        .send(createHttpError(404, `Proizvod ${request.params.id} ne postoji`));
    }

    const summary = product.inventory ?? {
      productId: product.id,
      onHand: 0,
      reserved: 0,
      available: 0,
      locations: []
    };

    return reply
      .status(200)
      .send({
        data: mapInventorySummary(summary, product.name, product.sku)
      });
  } catch (error) {
    return handleServiceError(reply, error);
  }
};

export const adjustInventory: RouteHandler<{
  Params: ProductIdParams;
  Body: AdjustInventoryBody;
  Reply: AdjustInventoryReply;
}> = async (request, reply) => {
  try {
    if (!Array.isArray(request.body?.adjustments) || request.body.adjustments.length === 0) {
      return reply
        .status(400)
        .send(createHttpError(400, "Bar jedna izmena lagera je obavezna"));
    }

    const summary = await request.productsService.adjustInventory(
      request.params.id,
      request.body.adjustments
    );

    const product = await request.productsService.getProduct(request.params.id);

    return reply
      .status(200)
      .send({
        data: mapInventorySummary(summary, product?.name, product?.sku)
      });
  } catch (error) {
    return handleServiceError(reply, error);
  }
};

