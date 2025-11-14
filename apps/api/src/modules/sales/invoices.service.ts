import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import Decimal from "decimal.js";
import type { AppDatabase } from "../../db/index.js";
import { invoices, invoiceItems } from "../../db/schema/sales.schema.js";
import type {
  Invoice,
  InvoiceCreateInput,
  InvoiceItem,
  InvoiceItemCreateInput,
  InvoiceUpdateInput
} from "@crm/types";
import type { CacheService } from "../../lib/cache.service";
import { TAX_CONFIG } from "../../config/tax.config.js";

type InvoiceInsert = typeof invoices.$inferInsert;
type InvoiceRow = typeof invoices.$inferSelect;
type InvoiceItemRow = typeof invoiceItems.$inferSelect;

export class InvoicesService {
  constructor(
    private database: AppDatabase,
    private cache?: CacheService
  ) {}

  /**
   * OPTIMIZED: Window function for count + caching
   */
  async list(filters?: {
    customerId?: string;
    orderId?: number;
    status?: typeof invoices.$inferSelect.status;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Invoice[]; total: number }> {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const cacheKey = `invoices:list:${JSON.stringify(filters || {})}`;

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<{ data: Invoice[]; total: number }>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const conditions = [];
    if (filters?.customerId) {
      conditions.push(eq(invoices.customerId, filters.customerId));
    }
    if (filters?.orderId) {
      conditions.push(eq(invoices.orderId, filters.orderId));
    }
    if (filters?.status) {
      conditions.push(eq(invoices.status, filters.status));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(invoices.invoiceNumber, `%${filters.search}%`),
          ilike(invoices.customerName, `%${filters.search}%`),
          ilike(invoices.customerEmail, `%${filters.search}%`),
          ilike(invoices.notes, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // OPTIMIZATION: Use window function instead of 2 queries
    const data = await this.database
      .select({
        id: invoices.id,
        orderId: invoices.orderId,
        invoiceNumber: invoices.invoiceNumber,
        customerId: invoices.customerId,
        customerName: invoices.customerName,
        customerEmail: invoices.customerEmail,
        billingAddress: invoices.billingAddress,
        status: invoices.status,
        issuedAt: invoices.issuedAt,
        dueDate: invoices.dueDate,
        amountBeforeDiscount: invoices.amountBeforeDiscount,
        discountTotal: invoices.discountTotal,
        subtotal: invoices.subtotal,
        totalVat: invoices.totalVat,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        balance: invoices.balance,
        currency: invoices.currency,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        totalCount: sql<number>`count(*) over()`
      })
      .from(invoices)
      .where(whereClause)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    const total = data.length > 0 ? Number(data[0].totalCount) : 0;

    const result = {
      data: data.map((inv) => {
        const { totalCount: _totalCount, ...invoiceRow } = inv;
        return this.mapInvoiceFromDb(invoiceRow as InvoiceRow);
      }),
      total
    };

    // Cache for 10 minutes
    if (this.cache) {
      await this.cache.set(cacheKey, result, { ttl: 600 });
    }

    return result;
  }

  /**
   * OPTIMIZED: Single JOIN query instead of N+1 + caching
   */
  async getById(id: string): Promise<Invoice | null> {
    const cacheKey = `invoices:${id}`;

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<Invoice>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // FIX N+1: Use JOIN to fetch invoice and items in one query
    const result = await this.database
      .select({
        invoice: invoices,
        item: invoiceItems
      })
      .from(invoices)
      .leftJoin(invoiceItems, eq(invoiceItems.invoiceId, invoices.id))
      .where(eq(invoices.id, id));

    if (result.length === 0) {
      return null;
    }

    // Group items by invoice
    const invoiceData = result[0].invoice;
    const items = result
      .filter(row => row.item !== null)
      .map(row => this.mapInvoiceItemFromDb(row.item!));

    const invoice: Invoice = {
      ...this.mapInvoiceFromDb(invoiceData),
      items
    };

    // Cache for 15 minutes
    if (this.cache) {
      await this.cache.set(cacheKey, invoice, { ttl: 900 });
    }

    return invoice;
  }

  /**
   * OPTIMIZED: Use transaction to ensure atomicity + cache invalidation
   */
  async create(input: InvoiceCreateInput): Promise<Invoice> {
    try {
      // Calculate totals from items
      const calculated = this.calculateTotals(input.items);

      // Use transaction to ensure atomicity
      const result = await this.database.transaction(async (tx) => {
        // Create invoice
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            invoiceNumber: input.invoiceNumber,
            orderId: input.orderId || null,
            customerId: input.customerId,
            customerName: input.customerName,
            customerEmail: input.customerEmail || null,
            billingAddress: input.billingAddress || null,
            issuedAt: input.issuedAt ? new Date(input.issuedAt) : new Date(),
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            currency: input.currency || "EUR",
            amountBeforeDiscount: calculated.amountBeforeDiscount.toString(),
            discountTotal: calculated.discountTotal.toString(),
            subtotal: calculated.subtotal.toString(),
            totalVat: calculated.totalVat.toString(),
            total: calculated.total.toString(),
            amountPaid: "0",
            balance: calculated.total.toString(),
            status: input.status || "draft",
            notes: input.notes || null
          })
          .returning();

        // Create invoice items
        if (input.items.length > 0) {
          await tx.insert(invoiceItems).values(
            input.items.map((item) => {
              const itemCalc = this.calculateItemTotals(item);
              return {
                invoiceId: newInvoice.id,
                description: item.description || null,
                quantity: item.quantity.toString(),
                unit: item.unit || "pcs",
                unitPrice: item.unitPrice.toString(),
                discountRate: (item.discountRate || 0).toString(),
                vatRate: (item.vatRate || TAX_CONFIG.DEFAULT_RATE_PERCENTAGE).toString(),
                totalExclVat: itemCalc.totalExclVat.toString(),
                vatAmount: itemCalc.vatAmount.toString(),
                totalInclVat: itemCalc.totalInclVat.toString()
              };
            })
          );
        }

        return newInvoice;
      });

      // Invalidate list cache
      if (this.cache) {
        await this.cache.deletePattern('invoices:list:*');
      }

      // Get full invoice with items
      const invoice = await this.getById(result.id);
      if (!invoice) {
        throw new Error('Failed to retrieve created invoice');
      }

      return invoice;

    } catch (error) {
      throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * OPTIMIZED: Use transaction + cache invalidation
   */
  async update(id: string, input: InvoiceUpdateInput): Promise<Invoice | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        return null;
      }

      // If items are provided, recalculate totals
      let calculated:
        | {
            amountBeforeDiscount: Decimal;
            discountTotal: Decimal;
            subtotal: Decimal;
            totalVat: Decimal;
            total: Decimal;
          }
        | undefined;

      if (input.items) {
        calculated = this.calculateTotals(input.items);
      }

      // Use transaction
      await this.database.transaction(async (tx) => {
        // Update invoice
        const updateData: Partial<InvoiceInsert> = {};
        if (input.orderId !== undefined) updateData.orderId = input.orderId || null;
        if (input.customerName !== undefined) updateData.customerName = input.customerName;
        if (input.customerEmail !== undefined) updateData.customerEmail = input.customerEmail || null;
        if (input.billingAddress !== undefined) updateData.billingAddress = input.billingAddress || null;
        if (input.issuedAt !== undefined) updateData.issuedAt = new Date(input.issuedAt);
        if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
        if (input.currency !== undefined) updateData.currency = input.currency;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.notes !== undefined) updateData.notes = input.notes;

        if (calculated) {
          updateData.amountBeforeDiscount = calculated.amountBeforeDiscount.toString();
          updateData.discountTotal = calculated.discountTotal.toString();
          updateData.subtotal = calculated.subtotal.toString();
          updateData.totalVat = calculated.totalVat.toString();
          updateData.total = calculated.total.toString();
          // Recalculate balance based on new total and existing amountPaid
          const amountPaid = new Decimal(existing.amountPaid);
          updateData.balance = calculated.total.minus(amountPaid).toString();
        }

        updateData.updatedAt = new Date();

        await tx.update(invoices).set(updateData).where(eq(invoices.id, id));

        // Update items if provided
        if (input.items) {
          // Delete existing items
          await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

          // Insert new items
          if (input.items.length > 0) {
            await tx.insert(invoiceItems).values(
              input.items.map((item) => {
                const itemCalc = this.calculateItemTotals(item);
                return {
                  invoiceId: id,
                  description: item.description || null,
                  quantity: item.quantity.toString(),
                  unit: item.unit || "pcs",
                  unitPrice: item.unitPrice.toString(),
                  discountRate: (item.discountRate || 0).toString(),
                  vatRate: (item.vatRate || TAX_CONFIG.DEFAULT_RATE_PERCENTAGE).toString(),
                  totalExclVat: itemCalc.totalExclVat.toString(),
                  vatAmount: itemCalc.vatAmount.toString(),
                  totalInclVat: itemCalc.totalInclVat.toString()
                };
              })
            );
          }
        }
      });

      // Invalidate caches
      if (this.cache) {
        await this.cache.delete(`invoices:${id}`);
        await this.cache.deletePattern('invoices:list:*');
      }

      return this.getById(id);

    } catch (error) {
      throw new Error(`Failed to update invoice: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * OPTIMIZED: Cache invalidation on delete
   */
  async delete(id: string): Promise<boolean> {
    try {
      const deleted = await this.database.delete(invoices).where(eq(invoices.id, id)).returning();

      if (deleted.length > 0 && this.cache) {
        await this.cache.delete(`invoices:${id}`);
        await this.cache.deletePattern('invoices:list:*');
      }

      return deleted.length > 0;

    } catch (error) {
      throw new Error(`Failed to delete invoice: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private calculateItemTotals(item: InvoiceItemCreateInput): {
    amountBeforeDiscount: Decimal;
    discountAmount: Decimal;
    totalExclVat: Decimal;
    vatAmount: Decimal;
    totalInclVat: Decimal;
  } {
    const quantity = new Decimal(item.quantity);
    const unitPrice = new Decimal(item.unitPrice);
    const discountRate = new Decimal(item.discountRate || 0);
    const vatRate = new Decimal(item.vatRate || TAX_CONFIG.DEFAULT_RATE_PERCENTAGE);

    // Calculate amounts
    const amountBeforeDiscount = quantity.times(unitPrice);
    const discountAmount = amountBeforeDiscount.times(discountRate).dividedBy(100);
    const totalExclVat = amountBeforeDiscount.minus(discountAmount);
    const vatAmount = totalExclVat.times(vatRate).dividedBy(100);
    const totalInclVat = totalExclVat.plus(vatAmount);

    return {
      amountBeforeDiscount,
      discountAmount,
      totalExclVat,
      vatAmount,
      totalInclVat
    };
  }

  private calculateTotals(items: InvoiceItemCreateInput[]): {
    amountBeforeDiscount: Decimal;
    discountTotal: Decimal;
    subtotal: Decimal;
    totalVat: Decimal;
    total: Decimal;
  } {
    let amountBeforeDiscount = new Decimal(0);
    let discountTotal = new Decimal(0);
    let subtotal = new Decimal(0);
    let totalVat = new Decimal(0);
    let total = new Decimal(0);

    for (const item of items) {
      const itemCalc = this.calculateItemTotals(item);
      amountBeforeDiscount = amountBeforeDiscount.plus(itemCalc.amountBeforeDiscount);
      discountTotal = discountTotal.plus(itemCalc.discountAmount);
      subtotal = subtotal.plus(itemCalc.totalExclVat);
      totalVat = totalVat.plus(itemCalc.vatAmount);
      total = total.plus(itemCalc.totalInclVat);
    }

    return {
      amountBeforeDiscount,
      discountTotal,
      subtotal,
      totalVat,
      total
    };
  }

  private mapInvoiceFromDb(dbInvoice: InvoiceRow): Invoice {
    return {
      id: dbInvoice.id,
      orderId: dbInvoice.orderId,
      invoiceNumber: dbInvoice.invoiceNumber,
      customerId: dbInvoice.customerId,
      customerName: dbInvoice.customerName,
      customerEmail: dbInvoice.customerEmail,
      billingAddress: dbInvoice.billingAddress,
      status: dbInvoice.status,
      issuedAt: dbInvoice.issuedAt.toISOString(),
      dueDate: dbInvoice.dueDate ? dbInvoice.dueDate.toISOString() : null,
      amountBeforeDiscount: Number(dbInvoice.amountBeforeDiscount),
      discountTotal: Number(dbInvoice.discountTotal),
      subtotal: Number(dbInvoice.subtotal),
      totalVat: Number(dbInvoice.totalVat),
      total: Number(dbInvoice.total),
      amountPaid: Number(dbInvoice.amountPaid),
      balance: Number(dbInvoice.balance),
      currency: dbInvoice.currency,
      notes: dbInvoice.notes,
      createdAt: dbInvoice.createdAt.toISOString(),
      updatedAt: dbInvoice.updatedAt.toISOString()
    };
  }

  private mapInvoiceItemFromDb(dbItem: InvoiceItemRow): InvoiceItem {
    return {
      id: dbItem.id,
      invoiceId: dbItem.invoiceId,
      description: dbItem.description,
      quantity: Number(dbItem.quantity),
      unit: dbItem.unit,
      unitPrice: Number(dbItem.unitPrice),
      discountRate: Number(dbItem.discountRate),
      vatRate: Number(dbItem.vatRate),
      totalExclVat: Number(dbItem.totalExclVat),
      vatAmount: Number(dbItem.vatAmount),
      totalInclVat: Number(dbItem.totalInclVat),
      createdAt: dbItem.createdAt.toISOString()
    };
  }
}