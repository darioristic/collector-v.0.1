import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import Decimal from "decimal.js";
import type { AppDatabase } from "../../db";
import { orders, orderItems } from "../../db/schema/sales.schema.js";
import type {
  Order,
  OrderCreateInput,
  OrderItem,
  OrderItemCreateInput,
  OrderUpdateInput
} from "@crm/types";
import type { CacheService } from "../../lib/cache.service";

/**
 * OrdersService handles all order-related business logic
 * 
 * Features:
 * - Optimized queries using window functions for pagination
 * - Redis caching for improved performance (TTL: 5-10 minutes)
 * - JOIN queries to avoid N+1 problem
 * - Transaction support for data consistency
 * 
 * @example
 * ```typescript
 * const service = new OrdersService(db, cache);
 * const orders = await service.list({ status: 'pending', limit: 10 });
 * ```
 */
export class OrdersService {
  /**
   * Creates a new OrdersService instance
   * 
   * @param database - Drizzle database instance
   * @param cache - Optional cache service for performance optimization
   */
  constructor(
    private database: AppDatabase,
    private cache?: CacheService
  ) {}

  /**
   * List orders with optional filtering and pagination
   * 
   * OPTIMIZED: Uses window function for count (1 query instead of 2) + Redis caching
   * 
   * @param filters - Optional filters for orders
   * @param filters.companyId - Filter by company ID
   * @param filters.contactId - Filter by contact ID
   * @param filters.quoteId - Filter by quote ID
   * @param filters.status - Filter by order status
   * @param filters.search - Search in order number and notes
   * @param filters.limit - Maximum number of results (default: 50)
   * @param filters.offset - Number of results to skip (default: 0)
   * @returns Promise resolving to orders list with total count
   * 
   * @example
   * ```typescript
   * const result = await service.list({ status: 'pending', limit: 20 });
   * console.log(`Found ${result.total} orders, showing ${result.data.length}`);
   * ```
   */
  async list(filters?: {
    companyId?: string;
    contactId?: string;
    quoteId?: number;
    status?: typeof orders.$inferSelect.status;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Order[]; total: number }> {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    // Create cache key from filters
    const cacheKey = `orders:list:${JSON.stringify(filters || {})}`;

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<{ data: Order[]; total: number }>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const conditions = [];
    if (filters?.companyId) {
      conditions.push(eq(orders.companyId, filters.companyId));
    }
    if (filters?.contactId) {
      conditions.push(eq(orders.contactId, filters.contactId));
    }
    if (filters?.quoteId) {
      conditions.push(eq(orders.quoteId, filters.quoteId));
    }
    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(orders.orderNumber, `%${filters.search}%`),
          ilike(orders.notes, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // OPTIMIZATION: Use window function instead of 2 queries
    const data = await this.database
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        quoteId: orders.quoteId,
        companyId: orders.companyId,
        contactId: orders.contactId,
        orderDate: orders.orderDate,
        expectedDelivery: orders.expectedDelivery,
        currency: orders.currency,
        subtotal: orders.subtotal,
        tax: orders.tax,
        total: orders.total,
        status: orders.status,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        totalCount: sql<number>`count(*) over()`
      })
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const total = data.length > 0 ? Number(data[0].totalCount) : 0;

    const result = {
      data: data.map((o) => this.mapOrderFromDb(o)),
      total
    };

    // Cache for 5 minutes
    if (this.cache) {
      await this.cache.set(cacheKey, result, { ttl: 300 });
    }

    return result;
  }

  /**
   * Get order by ID with all items
   * 
   * OPTIMIZED: Uses single JOIN query instead of N+1 queries + Redis caching
   * 
   * @param id - Order ID
   * @returns Promise resolving to order with items, or null if not found
   * 
   * @example
   * ```typescript
   * const order = await service.getById(123);
   * if (order) {
   *   console.log(`Order ${order.orderNumber} has ${order.items.length} items`);
   * }
   * ```
   */
  async getById(id: number): Promise<Order | null> {
    const cacheKey = `orders:${id}`;

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<Order>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // FIX N+1: Use JOIN to fetch order and items in one query
    const result = await this.database
      .select({
        order: orders,
        item: orderItems
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(eq(orders.id, id));

    if (result.length === 0) {
      return null;
    }

    // Group items by order
    const orderData = result[0].order;
    const items = result
      .filter(row => row.item !== null)
      .map(row => this.mapOrderItemFromDb(row.item!));

    const order: Order = {
      ...this.mapOrderFromDb(orderData),
      items
    };

    // Cache for 10 minutes
    if (this.cache) {
      await this.cache.set(cacheKey, order, { ttl: 600 });
    }

    return order;
  }

  /**
   * OPTIMIZED: Use transaction to ensure atomicity
   */
  async create(input: OrderCreateInput): Promise<Order> {
    try {
      // Calculate totals from items
      const { subtotal, tax, total } = this.calculateTotals(input.items);

      // Use transaction to ensure atomicity
      const result = await this.database.transaction(async (tx) => {
        // Create order
        const [newOrder] = await tx
          .insert(orders)
          .values({
            orderNumber: input.orderNumber,
            quoteId: input.quoteId || null,
            companyId: input.companyId || null,
            contactId: input.contactId || null,
            orderDate: input.orderDate || new Date().toISOString().split("T")[0],
            expectedDelivery: input.expectedDelivery || null,
            currency: input.currency || "EUR",
            subtotal: subtotal.toString(),
            tax: tax.toString(),
            total: total.toString(),
            status: (input.status || "pending") as typeof orders.$inferSelect.status,
            notes: input.notes || null
          })
          .returning();

        // Create order items
        if (input.items.length > 0) {
          await tx.insert(orderItems).values(
            input.items.map((item) => ({
              orderId: newOrder.id,
              productId: item.productId || null,
              description: item.description || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice.toString(),
              total: new Decimal(item.quantity).times(item.unitPrice).toString()
            }))
          );
        }

        return newOrder;
      });

      // Invalidate list cache
      if (this.cache) {
        await this.cache.deletePattern('orders:list:*');
      }

      // Get full order with items
      const order = await this.getById(result.id);
      if (!order) {
        throw new Error('Failed to retrieve created order');
      }

      return order;

    } catch (error) {
      throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * OPTIMIZED: Use transaction + cache invalidation
   */
  async update(id: number, input: OrderUpdateInput): Promise<Order | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        return null;
      }

      // If items are provided, recalculate totals
      let subtotal: Decimal | undefined;
      let tax: Decimal | undefined;
      let total: Decimal | undefined;

      if (input.items) {
        const calculated = this.calculateTotals(input.items);
        subtotal = calculated.subtotal;
        tax = calculated.tax;
        total = calculated.total;
      }

      // Use transaction
      await this.database.transaction(async (tx) => {
        // Update order
        const updateData: any = {};
        if (input.quoteId !== undefined) updateData.quoteId = input.quoteId || null;
        if (input.companyId !== undefined) updateData.companyId = input.companyId || null;
        if (input.contactId !== undefined) updateData.contactId = input.contactId || null;
        if (input.orderDate !== undefined) updateData.orderDate = input.orderDate;
        if (input.expectedDelivery !== undefined) updateData.expectedDelivery = input.expectedDelivery;
        if (input.currency !== undefined) updateData.currency = input.currency;
        if (input.status !== undefined) updateData.status = input.status as typeof orders.$inferSelect.status;
        if (input.notes !== undefined) updateData.notes = input.notes;
        if (subtotal !== undefined) updateData.subtotal = subtotal.toString();
        if (tax !== undefined) updateData.tax = tax.toString();
        if (total !== undefined) updateData.total = total.toString();
        updateData.updatedAt = new Date();

        await tx.update(orders).set(updateData).where(eq(orders.id, id));

        // Update items if provided
        if (input.items) {
          // Delete existing items
          await tx.delete(orderItems).where(eq(orderItems.orderId, id));

          // Insert new items
          if (input.items.length > 0) {
            await tx.insert(orderItems).values(
              input.items.map((item) => ({
                orderId: id,
                productId: item.productId || null,
                description: item.description || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice.toString(),
                total: new Decimal(item.quantity).times(item.unitPrice).toString()
              }))
            );
          }
        }
      });

      // Invalidate caches
      if (this.cache) {
        await this.cache.delete(`orders:${id}`);
        await this.cache.deletePattern('orders:list:*');
      }

      return this.getById(id);

    } catch (error) {
      throw new Error(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * OPTIMIZED: Cache invalidation on delete
   */
  async delete(id: number): Promise<boolean> {
    try {
      const deleted = await this.database.delete(orders).where(eq(orders.id, id)).returning();

      if (deleted.length > 0 && this.cache) {
        await this.cache.delete(`orders:${id}`);
        await this.cache.deletePattern('orders:list:*');
      }

      return deleted.length > 0;

    } catch (error) {
      throw new Error(`Failed to delete order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateTotals(items: OrderItemCreateInput[]): {
    subtotal: Decimal;
    tax: Decimal;
    total: Decimal;
  } {
    const subtotal = items.reduce((acc, item) => {
      const itemTotal = new Decimal(item.quantity).times(item.unitPrice);
      return acc.plus(itemTotal);
    }, new Decimal(0));

    // Tax is 20% of subtotal
    const tax = subtotal.times(0.2);
    const total = subtotal.plus(tax);

    return { subtotal, tax, total };
  }

  private mapOrderFromDb(dbOrder: any): Order {
    return {
      id: dbOrder.id,
      orderNumber: dbOrder.orderNumber,
      quoteId: dbOrder.quoteId,
      companyId: dbOrder.companyId,
      contactId: dbOrder.contactId,
      orderDate: dbOrder.orderDate,
      expectedDelivery: dbOrder.expectedDelivery,
      currency: dbOrder.currency,
      subtotal: Number(dbOrder.subtotal),
      tax: Number(dbOrder.tax),
      total: Number(dbOrder.total),
      status: dbOrder.status,
      notes: dbOrder.notes,
      createdAt: dbOrder.createdAt.toISOString(),
      updatedAt: dbOrder.updatedAt.toISOString()
    };
  }

  private mapOrderItemFromDb(dbItem: any): OrderItem {
    return {
      id: dbItem.id,
      orderId: dbItem.orderId,
      productId: dbItem.productId,
      description: dbItem.description,
      quantity: dbItem.quantity,
      unitPrice: Number(dbItem.unitPrice),
      total: Number(dbItem.total),
      createdAt: dbItem.createdAt.toISOString()
    };
  }
}