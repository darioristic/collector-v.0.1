import {
  createProductsRepository,
  type ProductsRepository
} from "./products.repository";
import type {
  CreateProductPayload,
  InventoryAdjustmentInput,
  InventoryLocationDefinition,
  ProductCategorySummary,
  ProductEntity,
  ProductInventorySummary,
  ProductListFilters,
  ProductListResult,
  UpdateProductPayload
} from "./products.types";
import type { CacheService } from "../../lib/cache.service";

const PRODUCT_LIST_CACHE_PREFIX = "products:list";
const PRODUCT_DETAIL_CACHE_PREFIX = "products:detail";

const normalizeSku = (sku: string): string => sku.trim().toUpperCase();

const sanitizeFilters = (filters?: ProductListFilters): ProductListFilters | undefined => {
  if (!filters) {
    return undefined;
  }

  const sanitized: ProductListFilters = {};

  if (filters.search) {
    sanitized.search = filters.search.trim();
  }

  if (filters.status && filters.status.length > 0) {
    sanitized.status = [...new Set(filters.status)];
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    sanitized.categoryIds = [...new Set(filters.categoryIds)];
  }

  if (typeof filters.minPrice === "number") {
    sanitized.minPrice = filters.minPrice;
  }

  if (typeof filters.maxPrice === "number") {
    sanitized.maxPrice = filters.maxPrice;
  }

  if (typeof filters.limit === "number") {
    sanitized.limit = filters.limit;
  }

  if (typeof filters.offset === "number") {
    sanitized.offset = filters.offset;
  }

  sanitized.sortBy = filters.sortBy;
  sanitized.sortDirection = filters.sortDirection;
  sanitized.includeInventoryDetails = filters.includeInventoryDetails;

  return sanitized;
};

export class ProductServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ProductServiceError";
  }

  static notFound(message: string): ProductServiceError {
    return new ProductServiceError(404, "NOT_FOUND", message);
  }

  static conflict(message: string, details?: unknown): ProductServiceError {
    return new ProductServiceError(409, "CONFLICT", message, details);
  }

  static badRequest(message: string, details?: unknown): ProductServiceError {
    return new ProductServiceError(400, "BAD_REQUEST", message, details);
  }
}

const isServiceError = (error: unknown): error is ProductServiceError =>
  error instanceof ProductServiceError;

export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository = createProductsRepository(),
    private readonly cache?: CacheService
  ) {}

  async list(
    filters?: ProductListFilters
  ): Promise<ProductListResult> {
    const sanitizedFilters = sanitizeFilters(filters);
    const cacheKey = `${PRODUCT_LIST_CACHE_PREFIX}:${JSON.stringify(sanitizedFilters ?? {})}`;

    if (this.cache) {
      const cached = await this.cache.get<ProductListResult>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const result = await this.repository.list(sanitizedFilters);

    if (this.cache) {
      await this.cache.set(cacheKey, result, { ttl: 240 });
    }

    return result;
  }

  async getProduct(
    id: string,
    options?: { includeInventoryDetails?: boolean }
  ): Promise<ProductEntity | null> {
    const cacheKey = `${PRODUCT_DETAIL_CACHE_PREFIX}:${id}:${options?.includeInventoryDetails ? "full" : "basic"}`;

    if (this.cache && !options?.includeInventoryDetails) {
      const cached = await this.cache.get<ProductEntity | null>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const product = await this.repository.findById(id, options);

    if (this.cache && product && !options?.includeInventoryDetails) {
      await this.cache.set(cacheKey, product, { ttl: 300 });
    }

    return product;
  }

  async createProduct(input: CreateProductPayload): Promise<ProductEntity> {
    const sku = normalizeSku(input.sku);
    const existingSku = await this.repository.findBySku(sku);

    if (existingSku) {
      throw ProductServiceError.conflict(`SKU ${sku} je već dodeljen drugom proizvodu`);
    }

    const categoryId = await this.resolveCategoryId(input);

    const payload = {
      ...input,
      sku,
      categoryId
    };

    const product = await this.repository.create(payload);

    await this.invalidateCaches(product.id);

    return product;
  }

  async updateProduct(id: string, input: UpdateProductPayload): Promise<ProductEntity | null> {
    if (input.sku) {
      const normalized = normalizeSku(input.sku);
      const existingSku = await this.repository.findBySku(normalized);

      if (existingSku && existingSku.id !== id) {
        throw ProductServiceError.conflict(`SKU ${normalized} je već dodeljen proizvodu ${existingSku.id}`);
      }

      input.sku = normalized;
    }

    const categoryId = await this.resolveCategoryId(input);

    if (typeof categoryId !== "undefined") {
      input.categoryId = categoryId;
    }

    const updated = await this.repository.update(id, input);

    if (!updated) {
      return null;
    }

    await this.invalidateCaches(id);

    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const deleted = await this.repository.delete(id);

    if (deleted) {
      await this.invalidateCaches(id);
    }

    return deleted;
  }

  async getInventory(productId: string): Promise<ProductInventorySummary> {
    const product = await this.repository.findById(productId, {
      includeInventoryDetails: true
    });

    if (!product) {
      throw ProductServiceError.notFound(`Proizvod ${productId} ne postoji`);
    }

    if (!product.inventory) {
      return {
        productId,
        onHand: 0,
        reserved: 0,
        available: 0,
        locations: []
      };
    }

    return product.inventory;
  }

  async adjustInventory(
    productId: string,
    adjustments: InventoryAdjustmentInput[]
  ): Promise<ProductInventorySummary> {
    const product = await this.repository.findById(productId);

    if (!product) {
      throw ProductServiceError.notFound(`Proizvod ${productId} ne postoji`);
    }

    const uniqueLocationIds = [
      ...new Set(adjustments.map((adjustment) => adjustment.locationId))
    ];

    await this.ensureLocationsExist(uniqueLocationIds);

    const summary = await this.repository.adjustInventory(productId, adjustments);

    await this.invalidateCaches(productId);

    return summary;
  }

  async listCategories(): Promise<ProductCategorySummary[]> {
    return this.repository.listCategories();
  }

  async listInventoryLocations(): Promise<InventoryLocationDefinition[]> {
    return this.repository.listInventoryLocations();
  }

  private async resolveCategoryId(
    input: { categoryId?: string | null; categoryName?: string | null }
  ): Promise<string | null | undefined> {
    if (input.categoryId) {
      const category = await this.repository.findCategoryById(input.categoryId);

      if (!category) {
        throw ProductServiceError.badRequest(`Kategorija ${input.categoryId} ne postoji`);
      }

      return category.id;
    }

    if (input.categoryName) {
      const existing = await this.repository.findCategoryByName(input.categoryName);

      if (!existing) {
        throw ProductServiceError.badRequest(
          `Kategorija sa nazivom "${input.categoryName}" ne postoji`
        );
      }

      return existing.id;
    }

    return input.categoryId ?? null;
  }

  private async ensureLocationsExist(locationIds: string[]): Promise<void> {
    if (locationIds.length === 0) {
      return;
    }

    await Promise.all(
      locationIds.map(async (locationId) => {
        const location = await this.repository.findInventoryLocationById(locationId);

        if (!location) {
          throw ProductServiceError.badRequest(`Skladišna lokacija ${locationId} ne postoji`);
        }
      })
    );
  }

  private async invalidateCaches(productId?: string): Promise<void> {
    if (!this.cache) {
      return;
    }

    await this.cache.deletePattern(`${PRODUCT_LIST_CACHE_PREFIX}:*`);

    if (productId) {
      await this.cache.delete(
        `${PRODUCT_DETAIL_CACHE_PREFIX}:${productId}:basic`,
        `${PRODUCT_DETAIL_CACHE_PREFIX}:${productId}:full`
      );
    }
  }
}

export const isProductsServiceError = isServiceError;

declare module "fastify" {
  interface FastifyInstance {
    productsService: ProductsService;
  }

  interface FastifyRequest {
    productsService: ProductsService;
  }
}


