import type { FastifyReply, RouteHandler } from "fastify";

import {
  createHttpError,
  type ApiDataReply,
  type ApiListReplyWithMeta
} from "../../lib/errors";
import { productStatus } from "../../db/schema/products.schema.js";
import { isProductsServiceError } from "./products.service";
import type {
  CreateProductPayload,
  ProductEntity,
  ProductListFilters,
  ProductStatus,
  UpdateProductPayload
} from "./products.types";
import {
  type ProductCreateBody,
  type ProductIdParams,
  type ProductUpdateBody
} from "./products.schema";

type ProductResponse = {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  category: string | null;
  active: boolean;
  relatedSalesOrders: string[];
};

type ListProductsQuery = {
  search?: string;
  status?: string | string[];
  categoryId?: string | string[];
  limit?: number;
  offset?: number;
};

type ListProductsReply = ApiListReplyWithMeta<ProductResponse>;
type GetProductReply = ApiDataReply<ProductResponse>;
type CreateProductReply = ApiDataReply<ProductResponse>;
type UpdateProductReply = ApiDataReply<ProductResponse>;
type DeleteProductReply = ApiDataReply<void>;

const isProductStatusValue = (value: string): value is ProductStatus =>
  productStatus.enumValues.includes(value as ProductStatus);

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const toArray = (value: string | string[] | undefined): string[] => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const parseListFilters = (query: ListProductsQuery): ProductListFilters => {
  const filters: ProductListFilters = {};

  if (query.search) {
    filters.search = query.search;
  }

  const statuses = toArray(query.status).filter(isProductStatusValue);
  if (statuses.length > 0) {
    filters.status = statuses;
  }

  const categories = toArray(query.categoryId).filter((value) => value.trim().length > 0);
  if (categories.length > 0) {
    filters.categoryIds = categories;
  }

  const limit = toNumberOrUndefined(query.limit);
  if (typeof limit === "number") {
    filters.limit = limit;
  }

  const offset = toNumberOrUndefined(query.offset);
  if (typeof offset === "number") {
    filters.offset = offset;
  }

  return filters;
};

const mapProductToResponse = (product: ProductEntity): ProductResponse => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  price: product.unitPrice,
  currency: product.currency,
  category: product.categoryName,
  active: product.status === "active",
  relatedSalesOrders: []
});

const mapCreateBodyToPayload = (body: ProductCreateBody): CreateProductPayload => ({
  name: body.name,
  sku: body.sku,
  unitPrice: body.price,
  status: body.active === false ? "inactive" : "active",
  categoryName: body.category ?? null,
  inventory: [],
  createdBy: null
});

const mapUpdateBodyToPayload = (body: ProductUpdateBody): UpdateProductPayload => {
  const payload: UpdateProductPayload = {};

  if (body.name !== undefined) {
    payload.name = body.name;
  }

  if (body.sku !== undefined) {
    payload.sku = body.sku;
  }

  if (body.price !== undefined) {
    payload.unitPrice = body.price;
  }

  if (body.category !== undefined) {
    payload.categoryName = body.category;
  }

  if (body.active !== undefined) {
    payload.status = body.active ? "active" : "inactive";
  }

  return payload;
};

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

export const listProducts: RouteHandler<{
  Querystring: ListProductsQuery;
  Reply: ListProductsReply;
}> = async (request, reply) => {
  const filters = parseListFilters(request.query);
  const result = await request.productsService.list(filters);

  return reply.status(200).send({
    data: result.items.map(mapProductToResponse),
    meta: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset
    }
  });
};

export const getProduct: RouteHandler<{
  Params: ProductIdParams;
  Reply: GetProductReply;
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

    return reply.status(200).send({ data: mapProductToResponse(product) });
  } catch (error) {
    return handleServiceError(reply, error);
  }
};

export const createProduct: RouteHandler<{
  Body: ProductCreateBody;
  Reply: CreateProductReply;
}> = async (request, reply) => {
  try {
    const payload = mapCreateBodyToPayload(request.body);
    const product = await request.productsService.createProduct(payload);

    return reply.status(201).send({ data: mapProductToResponse(product) });
  } catch (error) {
    return handleServiceError(reply, error);
  }
};

export const updateProduct: RouteHandler<{
  Params: ProductIdParams;
  Body: ProductUpdateBody;
  Reply: UpdateProductReply;
}> = async (request, reply) => {
  try {
    const payload = mapUpdateBodyToPayload(request.body);
    const updated = await request.productsService.updateProduct(request.params.id, payload);

    if (!updated) {
      return reply
        .status(404)
        .send(createHttpError(404, `Proizvod ${request.params.id} ne postoji`));
    }

    return reply.status(200).send({ data: mapProductToResponse(updated) });
  } catch (error) {
    return handleServiceError(reply, error);
  }
};

export const deleteProduct: RouteHandler<{
  Params: ProductIdParams;
  Reply: DeleteProductReply;
}> = async (request, reply) => {
  try {
    const deleted = await request.productsService.deleteProduct(request.params.id);

    if (!deleted) {
      return reply
        .status(404)
        .send(createHttpError(404, `Proizvod ${request.params.id} ne postoji`));
    }

    return reply.status(204).send();
  } catch (error) {
    return handleServiceError(reply, error);
  }
};

