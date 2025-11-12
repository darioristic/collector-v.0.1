import Decimal from "decimal.js";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql
} from "drizzle-orm";

import { db as defaultDb, type AppDatabase } from "../../db";
import {
  inventoryItems,
  inventoryLocations,
  productCategories,
  products
} from "../../db/schema/products.schema";
import type {
  CreateProductInput,
  InventoryAdjustmentInput,
  InventoryWriteInput,
  InventoryLocationDefinition,
  ProductCategorySummary,
  ProductEntity,
  ProductInventoryLocationSummary,
  ProductInventorySummary,
  ProductListFilters,
  ProductListResult,
  ProductStatus,
  UpdateProductInput
} from "./products.types";

type ProductRow = typeof products.$inferSelect;
type CategoryRow = typeof productCategories.$inferSelect;
type InventoryRow = typeof inventoryItems.$inferSelect;
type InventoryLocationRow = typeof inventoryLocations.$inferSelect;

const DEFAULT_LIMIT = 50;
const DEFAULT_CURRENCY = "EUR";

export interface ProductsRepository {
  list(filters?: ProductListFilters): Promise<ProductListResult>;
  findById(
    id: string,
    options?: { includeInventoryDetails?: boolean }
  ): Promise<ProductEntity | null>;
  findBySku(sku: string): Promise<ProductEntity | null>;
  create(input: CreateProductInput): Promise<ProductEntity>;
  bulkInsert(inputs: CreateProductInput[]): Promise<ProductEntity[]>;
  update(id: string, input: UpdateProductInput): Promise<ProductEntity | null>;
  delete(id: string): Promise<boolean>;
  adjustInventory(
    productId: string,
    adjustments: InventoryAdjustmentInput[]
  ): Promise<ProductInventorySummary>;
  replaceInventory(
    productId: string,
    entries: InventoryWriteInput[]
  ): Promise<ProductInventorySummary>;
  listCategories(): Promise<ProductCategorySummary[]>;
  findCategoryById(id: string): Promise<ProductCategorySummary | null>;
  findCategoryByName(name: string): Promise<ProductCategorySummary | null>;
  listInventoryLocations(): Promise<InventoryLocationDefinition[]>;
  findInventoryLocationById(
    id: string
  ): Promise<InventoryLocationDefinition | null>;
}

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  try {
    return new Decimal(value as Decimal.Value).toNumber();
  } catch {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
};

const toIsoString = (value: Date | string | null | undefined): string => {
  if (!value) {
    return new Date().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const serializeDecimal = (value: number | null | undefined): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  return new Decimal(value).toString();
};

const normalizeStatus = (
  status?: ProductStatus | null
): ProductStatus => status ?? "active";

const buildSearchPattern = (value: string): string =>
  `%${value.trim().replace(/\s+/g, "%")}%`;

type ProductSelectionRow = {
  product: ProductRow;
  category: CategoryRow | null;
  onHand: number | null;
  reserved: number | null;
  totalCount?: number | null;
};

const mapInventoryLocation = (
  item: InventoryRow,
  location: InventoryLocationRow | null
): ProductInventoryLocationSummary => ({
  locationId: item.locationId,
  name: location?.name ?? "Unknown location",
  address: location?.address ?? null,
  quantity: toNumber(item.quantity),
  reserved: toNumber(item.reserved),
  updatedAt: toIsoString(item.updatedAt)
});

const composeInventorySummary = (
  productId: string,
  onHand: number,
  reserved: number,
  locations: ProductInventoryLocationSummary[] = []
): ProductInventorySummary => ({
  productId,
  onHand,
  reserved,
  available: onHand - reserved,
  locations
});

const mapProductEntity = (
  row: ProductRow,
  category: CategoryRow | null,
  inventory?: ProductInventorySummary
): ProductEntity => {
  const unitPrice = toNumber(row.unitPrice);

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description ?? null,
    status: row.status,
    categoryId: row.categoryId ?? null,
    categoryName: category?.name ?? null,
    unitPrice,
    currency: DEFAULT_CURRENCY,
    createdBy: row.createdBy ?? null,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
    inventory
  };
};

const mapCategory = (row: CategoryRow): ProductCategorySummary => ({
  id: row.id,
  name: row.name,
  description: row.description ?? null,
  createdAt: toIsoString(row.createdAt)
});

const mapLocation = (row: InventoryLocationRow): InventoryLocationDefinition => ({
  id: row.id,
  name: row.name,
  address: row.address ?? null
});

const applyFilters = (filters?: ProductListFilters) => {
  if (!filters) {
    return undefined;
  }

  const conditions = [];

  if (filters.search) {
    const pattern = buildSearchPattern(filters.search);
    conditions.push(
      or(ilike(products.name, pattern), ilike(products.sku, pattern))
    );
  }

  if (filters.status && filters.status.length > 0) {
    conditions.push(inArray(products.status, filters.status));
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    conditions.push(inArray(products.categoryId, filters.categoryIds));
  }

  if (typeof filters.minPrice === "number") {
    conditions.push(sql`${products.unitPrice} >= ${serializeDecimal(filters.minPrice) ?? "0"}`);
  }

  if (typeof filters.maxPrice === "number") {
    conditions.push(sql`${products.unitPrice} <= ${serializeDecimal(filters.maxPrice) ?? "0"}`);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};

const resolveOrderBy = (filters?: ProductListFilters) => {
  const sortBy = filters?.sortBy ?? "createdAt";
  const sortDirection = filters?.sortDirection === "asc" ? "asc" : "desc";

  switch (sortBy) {
    case "name":
      return sortDirection === "asc" ? asc(products.name) : desc(products.name);
    case "unitPrice":
      return sortDirection === "asc"
        ? asc(products.unitPrice)
        : desc(products.unitPrice);
    case "createdAt":
    default:
      return sortDirection === "asc"
        ? asc(products.createdAt)
        : desc(products.createdAt);
  }
};

const ensureSummaryPresence = (
  productIds: string[],
  summaries: Map<string, ProductInventorySummary>
) => {
  for (const id of productIds) {
    if (!summaries.has(id)) {
      summaries.set(id, composeInventorySummary(id, 0, 0, []));
    }
  }
};

class DrizzleProductsRepository implements ProductsRepository {
  constructor(private readonly database: AppDatabase = defaultDb) {}

  async list(filters?: ProductListFilters): Promise<ProductListResult> {
    const whereClause = applyFilters(filters);
    const limit = filters?.limit ?? DEFAULT_LIMIT;
    const offset = filters?.offset ?? 0;
    const orderBy = resolveOrderBy(filters);

    const rows = await this.database
      .select({
        product: products,
        category: productCategories,
        onHand: sql<number>`coalesce(sum(${inventoryItems.quantity}), 0)`,
        reserved: sql<number>`coalesce(sum(${inventoryItems.reserved}), 0)`,
        totalCount: sql<number>`count(*) over()`
      })
      .from(products)
      .leftJoin(
        productCategories,
        eq(products.categoryId, productCategories.id)
      )
      .leftJoin(inventoryItems, eq(inventoryItems.productId, products.id))
      .where(whereClause)
      .groupBy(products.id, productCategories.id)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const productIds = rows.map((row) => row.product.id);
    let inventoryMap: Map<string, ProductInventorySummary> | undefined;

    if (filters?.includeInventoryDetails) {
      inventoryMap = await this.fetchInventorySummaries(productIds, true);
      ensureSummaryPresence(productIds, inventoryMap);
    }

    const items = rows.map((row) => {
      const summary =
        inventoryMap?.get(row.product.id) ??
        composeInventorySummary(
          row.product.id,
          toNumber(row.onHand),
          toNumber(row.reserved)
        );

      return mapProductEntity(row.product, row.category, summary);
    });

    const total =
      rows.length > 0 ? toNumber(rows[0]?.totalCount ?? rows.length) : 0;

    return {
      items,
      total
    };
  }

  async findById(
    id: string,
    options?: { includeInventoryDetails?: boolean }
  ): Promise<ProductEntity | null> {
    const [row] = await this.database
      .select({
        product: products,
        category: productCategories,
        onHand: sql<number>`coalesce(sum(${inventoryItems.quantity}), 0)`,
        reserved: sql<number>`coalesce(sum(${inventoryItems.reserved}), 0)`
      })
      .from(products)
      .leftJoin(
        productCategories,
        eq(products.categoryId, productCategories.id)
      )
      .leftJoin(inventoryItems, eq(inventoryItems.productId, products.id))
      .where(eq(products.id, id))
      .groupBy(products.id, productCategories.id)
      .limit(1);

    if (!row) {
      return null;
    }

    let summary: ProductInventorySummary | undefined;

    if (options?.includeInventoryDetails) {
      const inventoryMap = await this.fetchInventorySummaries([id], true);
      summary = inventoryMap.get(id);
      ensureSummaryPresence([id], inventoryMap);
      summary = inventoryMap.get(id);
    } else {
      summary = composeInventorySummary(
        row.product.id,
        toNumber(row.onHand),
        toNumber(row.reserved)
      );
    }

    return mapProductEntity(row.product, row.category, summary ?? undefined);
  }

  async findBySku(sku: string): Promise<ProductEntity | null> {
    const [row] = await this.database
      .select({
        product: products,
        category: productCategories
      })
      .from(products)
      .leftJoin(
        productCategories,
        eq(products.categoryId, productCategories.id)
      )
      .where(eq(products.sku, sku))
      .limit(1);

    if (!row) {
      return null;
    }

    const inventory = await this.fetchInventorySummaries(
      [row.product.id],
      false
    );

    return mapProductEntity(
      row.product,
      row.category,
      inventory.get(row.product.id)
    );
  }

  async create(input: CreateProductInput): Promise<ProductEntity> {
    return this.database.transaction(async (tx) => {
      const payload: typeof products.$inferInsert = {
        sku: input.sku,
        name: input.name,
        description: input.description ?? null,
        status: normalizeStatus(input.status),
        categoryId: input.categoryId ?? null,
        createdBy: input.createdBy ?? null
      };

      if (input.id) {
        payload.id = input.id;
      }

      const serializedUnitPrice = serializeDecimal(input.unitPrice);
      if (serializedUnitPrice !== undefined) {
        payload.unitPrice = serializedUnitPrice;
      }

      const [created] = await tx.insert(products).values(payload).returning();

      if (!created) {
        throw new Error("Failed to create product");
      }

      if (input.inventory && input.inventory.length > 0) {
        await this.replaceInventoryInternal(tx, created.id, input.inventory);
      }

      const product = await this.findByIdInternal(tx, created.id, {
        includeInventoryDetails: true
      });

      if (!product) {
        throw new Error("Failed to load created product");
      }

      return product;
    });
  }

  async bulkInsert(inputs: CreateProductInput[]): Promise<ProductEntity[]> {
    if (inputs.length === 0) {
      return [];
    }

    return this.database.transaction(async (tx) => {
      const productPayloads = inputs.map((input) => {
        const payload: typeof products.$inferInsert = {
          sku: input.sku,
          name: input.name,
          description: input.description ?? null,
          status: normalizeStatus(input.status),
          categoryId: input.categoryId ?? null,
          createdBy: input.createdBy ?? null
        };

        if (input.id) {
          payload.id = input.id;
        }

        const serializedUnitPrice = serializeDecimal(input.unitPrice);
        if (serializedUnitPrice !== undefined) {
          payload.unitPrice = serializedUnitPrice;
        }

        return payload;
      });

      await tx.insert(products).values(productPayloads);

      const inventoryInstructions = inputs.filter(
        (input) => input.inventory && input.inventory.length > 0
      );

      for (const entry of inventoryInstructions) {
        const productId =
          entry.id ??
          (
            await tx
              .select({ id: products.id })
              .from(products)
              .where(eq(products.sku, entry.sku))
              .limit(1)
          )[0]?.id;

        if (productId) {
          await this.replaceInventoryInternal(tx, productId, entry.inventory ?? []);
        }
      }

      const ids = (
        await tx
          .select({ id: products.id })
          .from(products)
          .where(
            inArray(
              products.sku,
              inputs.map((input) => input.sku)
            )
          )
      ).map((row) => row.id);

      const summaries = await this.fetchInventorySummaries(ids, true, tx);
      ensureSummaryPresence(ids, summaries);

      const rows = await tx
        .select({
          product: products,
          category: productCategories
        })
        .from(products)
        .leftJoin(
          productCategories,
          eq(products.categoryId, productCategories.id)
        )
        .where(inArray(products.id, ids));

      return rows.map((row) =>
        mapProductEntity(
          row.product,
          row.category,
          summaries.get(row.product.id)
        )
      );
    });
  }

  async update(id: string, input: UpdateProductInput): Promise<ProductEntity | null> {
    return this.database.transaction(async (tx) => {
      const existing = await this.findByIdInternal(tx, id, {
        includeInventoryDetails: input.unitPrice !== undefined
      });

      if (!existing) {
        return null;
      }

      const payload: Partial<typeof products.$inferInsert> = {
        updatedAt: new Date()
      };

      if (input.name !== undefined) {
        payload.name = input.name;
      }

      if (input.sku !== undefined) {
        payload.sku = input.sku;
      }

      if (input.description !== undefined) {
        payload.description = input.description ?? null;
      }

      if (input.status !== undefined) {
        payload.status = normalizeStatus(input.status);
      }

      if (input.categoryId !== undefined) {
        payload.categoryId = input.categoryId ?? null;
      }

      if (input.unitPrice !== undefined) {
        const serialized = serializeDecimal(input.unitPrice);
        payload.unitPrice = serialized ?? "0";
      }

      await tx.update(products).set(payload).where(eq(products.id, id));

      return this.findByIdInternal(tx, id, {
        includeInventoryDetails: true
      });
    });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.database
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    return deleted.length > 0;
  }

  async adjustInventory(
    productId: string,
    adjustments: InventoryAdjustmentInput[]
  ): Promise<ProductInventorySummary> {
    if (adjustments.length === 0) {
      const summaries = await this.fetchInventorySummaries([productId], true);
      ensureSummaryPresence([productId], summaries);
      return summaries.get(productId)!;
    }

    return this.database.transaction(async (tx) => {
      for (const adjustment of adjustments) {
        const quantityDelta = adjustment.quantityDelta ?? 0;
        const reservedDelta = adjustment.reservedDelta ?? 0;

        const [existing] = await tx
          .select()
          .from(inventoryItems)
          .where(
            and(
              eq(inventoryItems.productId, productId),
              eq(inventoryItems.locationId, adjustment.locationId)
            )
          )
          .limit(1);

        if (!existing) {
          const initialQuantity = Math.max(quantityDelta, 0);
          const initialReserved = Math.max(reservedDelta, 0);

          await tx
            .insert(inventoryItems)
            .values({
              productId,
              locationId: adjustment.locationId,
              quantity: initialQuantity,
              reserved: initialReserved
            })
            .onConflictDoNothing();

          continue;
        }

        const nextQuantity = Math.max(existing.quantity + quantityDelta, 0);
        const nextReserved = Math.max(existing.reserved + reservedDelta, 0);

        await tx
          .update(inventoryItems)
          .set({
            quantity: nextQuantity,
            reserved: nextReserved,
            updatedAt: new Date()
          })
          .where(eq(inventoryItems.id, existing.id));
      }

      const summaries = await this.fetchInventorySummaries([productId], true, tx);
      ensureSummaryPresence([productId], summaries);
      return summaries.get(productId)!;
    });
  }

  async replaceInventory(
    productId: string,
    entries: InventoryWriteInput[]
  ): Promise<ProductInventorySummary> {
    return this.database.transaction(async (tx) => {
      await this.replaceInventoryInternal(tx, productId, entries);
      const summaries = await this.fetchInventorySummaries([productId], true, tx);
      ensureSummaryPresence([productId], summaries);
      return summaries.get(productId)!;
    });
  }

  private async findByIdInternal(
    database: AppDatabase,
    id: string,
    options?: { includeInventoryDetails?: boolean }
  ): Promise<ProductEntity | null> {
    const [row] = await database
      .select({
        product: products,
        category: productCategories,
        onHand: sql<number>`coalesce(sum(${inventoryItems.quantity}), 0)`,
        reserved: sql<number>`coalesce(sum(${inventoryItems.reserved}), 0)`
      })
      .from(products)
      .leftJoin(
        productCategories,
        eq(products.categoryId, productCategories.id)
      )
      .leftJoin(inventoryItems, eq(inventoryItems.productId, products.id))
      .where(eq(products.id, id))
      .groupBy(products.id, productCategories.id)
      .limit(1);

    if (!row) {
      return null;
    }

    let summary: ProductInventorySummary | undefined;

    if (options?.includeInventoryDetails) {
      const inventoryMap = await this.fetchInventorySummaries([id], true, database);
      ensureSummaryPresence([id], inventoryMap);
      summary = inventoryMap.get(id);
    } else {
      summary = composeInventorySummary(
        row.product.id,
        toNumber(row.onHand),
        toNumber(row.reserved)
      );
    }

    return mapProductEntity(row.product, row.category, summary);
  }

  private async fetchInventorySummaries(
    productIds: string[],
    includeDetails: boolean,
    database: AppDatabase = this.database
  ): Promise<Map<string, ProductInventorySummary>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const rows = await database
      .select({
        item: inventoryItems,
        location: inventoryLocations
      })
      .from(inventoryItems)
      .leftJoin(
        inventoryLocations,
        eq(inventoryItems.locationId, inventoryLocations.id)
      )
      .where(inArray(inventoryItems.productId, productIds));

    const summaries = new Map<string, ProductInventorySummary>();

    for (const row of rows) {
      if (!row.item) {
        continue;
      }

      const productId = row.item.productId;
      const quantity = toNumber(row.item.quantity);
      const reserved = toNumber(row.item.reserved);

      const summary =
        summaries.get(productId) ??
        composeInventorySummary(productId, 0, 0, []);

      summary.onHand += quantity;
      summary.reserved += reserved;

      if (includeDetails) {
        summary.locations.push(mapInventoryLocation(row.item, row.location));
      }

      summary.available = summary.onHand - summary.reserved;

      summaries.set(productId, summary);
    }

    ensureSummaryPresence(productIds, summaries);

    return summaries;
  }

  private async replaceInventoryInternal(
    database: AppDatabase,
    productId: string,
    entries: InventoryWriteInput[]
  ): Promise<void> {
    await database
      .delete(inventoryItems)
      .where(eq(inventoryItems.productId, productId));

    if (entries.length === 0) {
      return;
    }

    await database.insert(inventoryItems).values(
      entries.map((entry) => ({
        productId,
        locationId: entry.locationId,
        quantity: Math.max(entry.quantity ?? 0, 0),
        reserved: Math.max(entry.reserved ?? 0, 0)
      }))
    );
  }

  async listCategories(): Promise<ProductCategorySummary[]> {
    const rows = await this.database
      .select()
      .from(productCategories)
      .orderBy(asc(productCategories.name));

    return rows.map((row) => mapCategory(row));
  }

  async findCategoryById(id: string): Promise<ProductCategorySummary | null> {
    const [row] = await this.database
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id))
      .limit(1);

    return row ? mapCategory(row) : null;
  }

  async findCategoryByName(name: string): Promise<ProductCategorySummary | null> {
    const [row] = await this.database
      .select()
      .from(productCategories)
      .where(ilike(productCategories.name, name))
      .limit(1);

    return row ? mapCategory(row) : null;
  }

  async listInventoryLocations(): Promise<InventoryLocationDefinition[]> {
    const rows = await this.database
      .select()
      .from(inventoryLocations)
      .orderBy(asc(inventoryLocations.name));

    return rows.map((row) => mapLocation(row));
  }

  async findInventoryLocationById(
    id: string
  ): Promise<InventoryLocationDefinition | null> {
    const [row] = await this.database
      .select()
      .from(inventoryLocations)
      .where(eq(inventoryLocations.id, id))
      .limit(1);

    return row ? mapLocation(row) : null;
  }
}

export const createProductsRepository = (
  database: AppDatabase = defaultDb
): ProductsRepository => new DrizzleProductsRepository(database);


