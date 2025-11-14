import type { productStatus } from "../../db/schema/products.schema.js";

export type ProductStatus = (typeof productStatus.enumValues)[number];

export type ProductCategorySummary = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export type ProductInventoryLocationSummary = {
  locationId: string;
  name: string;
  address: string | null;
  quantity: number;
  reserved: number;
  updatedAt: string;
};

export type ProductInventorySummary = {
  productId: string;
  onHand: number;
  reserved: number;
  available: number;
  locations: ProductInventoryLocationSummary[];
};

export type InventoryLocationDefinition = {
  id: string;
  name: string;
  address: string | null;
};

export type ProductEntity = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  status: ProductStatus;
  categoryId: string | null;
  categoryName: string | null;
  unitPrice: number;
  currency: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  inventory?: ProductInventorySummary;
};

export type ProductListFilters = {
  search?: string;
  status?: ProductStatus[];
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "name" | "unitPrice";
  sortDirection?: "asc" | "desc";
  includeInventoryDetails?: boolean;
};

export type ProductListResult = {
  items: ProductEntity[];
  total: number;
};

export type InventoryWriteInput = {
  locationId: string;
  quantity?: number;
  reserved?: number;
};

export type InventoryAdjustmentInput = {
  locationId: string;
  quantityDelta?: number;
  reservedDelta?: number;
};

export type CreateProductInput = {
  id?: string;
  sku: string;
  name: string;
  description?: string | null;
  status?: ProductStatus;
  categoryId?: string | null;
  unitPrice?: number;
  createdBy?: string | null;
  inventory?: InventoryWriteInput[];
};

export type UpdateProductInput = {
  name?: string;
  sku?: string;
  description?: string | null;
  status?: ProductStatus;
  categoryId?: string | null;
  unitPrice?: number | null;
};

export type CreateProductPayload = CreateProductInput & {
  categoryName?: string | null;
};

export type UpdateProductPayload = UpdateProductInput & {
  categoryName?: string | null;
};


