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
type InvoiceItemInsert = Omit<typeof invoiceItems.$inferInsert, "id" | "createdAt">;

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

    // Simpler and more compatible approach: separate queries
    const [invoiceRow] = await this.database
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!invoiceRow) {
      return null;
    }

    let itemRows: InvoiceItemRow[] = [];
    try {
      console.log("[InvoicesService.getById] Fetching invoice items for invoiceId:", id, "type:", typeof id);
      itemRows = await this.database
        .select({
          id: invoiceItems.id,
          invoiceId: invoiceItems.invoiceId,
          description: invoiceItems.description,
          quantity: invoiceItems.quantity,
          unit: invoiceItems.unit,
          unitPrice: invoiceItems.unitPrice,
          discountRate: invoiceItems.discountRate,
          vatRate: invoiceItems.vatRate,
          total: invoiceItems.total,
          totalExclVat: invoiceItems.totalExclVat,
          vatAmount: invoiceItems.vatAmount,
          totalInclVat: invoiceItems.totalInclVat,
          createdAt: invoiceItems.createdAt
        })
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id)) as unknown as InvoiceItemRow[];
      console.log("[InvoicesService.getById] Fetched", itemRows.length, "invoice items");
      if (itemRows.length > 0) {
        console.log("[InvoicesService.getById] First item sample:", JSON.stringify(itemRows[0], null, 2));
      }
    } catch (error) {
      console.error("[InvoicesService.getById] Error fetching invoice items:", error);
      if (error instanceof Error) {
        console.error("[InvoicesService.getById] Error message:", error.message);
        console.error("[InvoicesService.getById] Error stack:", error.stack);
      }
      itemRows = [];
    }

    const invoice: Invoice = {
      ...this.mapInvoiceFromDb(invoiceRow as InvoiceRow),
      items: itemRows.map((row, index) => {
        try {
          return this.mapInvoiceItemFromDb(row as InvoiceItemRow);
        } catch (error) {
          console.error(`[InvoicesService.getById] Error mapping invoice item at index ${index}:`, error);
          console.error(`[InvoicesService.getById] Item row data:`, JSON.stringify(row, null, 2));
          throw error;
        }
      })
    };

    // Cache for 15 minutes
    if (this.cache) {
      await this.cache.set(cacheKey, invoice, { ttl: 900 });
    }

    return invoice;
  }

  /**
   * Transform notes to JSON format if it's a string (backward compatibility)
   */
  private transformNotes(notes: unknown): unknown {
    if (!notes) return null;
    if (typeof notes === "string") {
      // Convert string to Tiptap JSON format
      const trimmed = notes.trim();
      if (!trimmed) return null;
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: trimmed
              }
            ]
          }
        ]
      };
    }
    // Already JSON format
    return notes;
  }

  /**
   * OPTIMIZED: Use transaction to ensure atomicity + cache invalidation
   */
  async create(input: InvoiceCreateInput): Promise<Invoice> {
    try {
      // Calculate totals from items
      const calculated = this.calculateTotals(input.items);

      console.log("[InvoicesService.create] Creating invoice with input:", JSON.stringify(input, null, 2));
      console.log("[InvoicesService.create] Calculated totals:", JSON.stringify(calculated, null, 2));

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
            notes: this.transformNotes(input.notes)
          })
          .returning();

        // Create invoice items
        if (input.items.length > 0) {
          const itemsToInsert: InvoiceItemInsert[] = input.items.map((item) => {
            const itemCalc = this.calculateItemTotals(item);
            const insertItem = {
              invoiceId: newInvoice.id,
              description: item.description || null,
              quantity: new Decimal(item.quantity).toFixed(2),
              unit: item.unit || "pcs",
              unitPrice: new Decimal(item.unitPrice).toFixed(2),
              discountRate: new Decimal(item.discountRate || 0).toFixed(2),
              vatRate: new Decimal(item.vatRate || TAX_CONFIG.DEFAULT_RATE_PERCENTAGE).toFixed(2),
              total: itemCalc.totalInclVat.toFixed(2),
              totalExclVat: itemCalc.totalExclVat.toFixed(2),
              vatAmount: itemCalc.vatAmount.toFixed(2),
              totalInclVat: itemCalc.totalInclVat.toFixed(2)
            };
            console.log("[InvoicesService.create] Inserting item:", JSON.stringify(insertItem, null, 2));
            return insertItem;
          });
          console.log("[InvoicesService.create] Inserting", itemsToInsert.length, "items");
          await tx.insert(invoiceItems).values(itemsToInsert);
          console.log("[InvoicesService.create] Items inserted successfully");
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
      console.error("[InvoicesService.create] Error creating invoice:", error);
      if (error instanceof Error) {
        console.error("[InvoicesService.create] Error message:", error.message);
        console.error("[InvoicesService.create] Error stack:", error.stack);
      }
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
        if (input.notes !== undefined) updateData.notes = this.transformNotes(input.notes);

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
            const itemsToInsert: InvoiceItemInsert[] = input.items.map((item) => {
              const itemCalc = this.calculateItemTotals(item);
              return {
                invoiceId: id,
                description: item.description || null,
                quantity: new Decimal(item.quantity).toFixed(2),
                unit: item.unit || "pcs",
                unitPrice: new Decimal(item.unitPrice).toFixed(2),
                discountRate: new Decimal(item.discountRate || 0).toFixed(2),
                vatRate: new Decimal(item.vatRate || TAX_CONFIG.DEFAULT_RATE_PERCENTAGE).toFixed(2),
                total: itemCalc.totalInclVat.toFixed(2),
                totalExclVat: itemCalc.totalExclVat.toFixed(2),
                vatAmount: itemCalc.vatAmount.toFixed(2),
                totalInclVat: itemCalc.totalInclVat.toFixed(2)
              };
            });
            await tx.insert(invoiceItems).values(itemsToInsert);
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
    const tiptapToString = (value: unknown): string | null => {
      if (!value) return null;
      if (typeof value === "string") return value;
      try {
        const doc = value as { content?: Array<{ content?: Array<{ text?: string }> }> };
        if (!doc?.content) return null;
        return doc.content
          .map((p) => (p?.content ? p.content.map((n) => n.text ?? "").join("") : ""))
          .join("\n");
      } catch {
        return null;
      }
    };
    const toIso = (value: unknown): string => {
      const d = value instanceof Date ? value : new Date(value as string);
      return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    };
    const toIsoNullable = (value: unknown | null | undefined): string | null => {
      if (value === null || value === undefined) return null;
      const d = value instanceof Date ? value : new Date(value as string);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    };

    return {
      id: dbInvoice.id,
      orderId: dbInvoice.orderId,
      invoiceNumber: dbInvoice.invoiceNumber,
      customerId: dbInvoice.customerId,
      customerName: dbInvoice.customerName,
      customerEmail: dbInvoice.customerEmail,
      billingAddress: dbInvoice.billingAddress,
      status: dbInvoice.status,
      issuedAt: toIso(dbInvoice.issuedAt),
      dueDate: toIsoNullable(dbInvoice.dueDate),
      amountBeforeDiscount: Number(dbInvoice.amountBeforeDiscount),
      discountTotal: Number(dbInvoice.discountTotal),
      subtotal: Number(dbInvoice.subtotal),
      totalVat: Number(dbInvoice.totalVat),
      total: Number(dbInvoice.total),
      amountPaid: Number(dbInvoice.amountPaid),
      balance: Number(dbInvoice.balance),
      currency: dbInvoice.currency,
      notes: tiptapToString(dbInvoice.notes),
      createdAt: toIso(dbInvoice.createdAt),
      updatedAt: toIso(dbInvoice.updatedAt)
    };
  }

  private mapInvoiceItemFromDb(dbItem: InvoiceItemRow): InvoiceItem {
    const d = dbItem.createdAt instanceof Date ? dbItem.createdAt : new Date(dbItem.createdAt as unknown as string);
    return {
      id: String(dbItem.id),
      invoiceId: String(dbItem.invoiceId),
      description: dbItem.description,
      quantity: Number(dbItem.quantity),
      unit: dbItem.unit,
      unitPrice: Number(dbItem.unitPrice),
      discountRate: Number(dbItem.discountRate),
      vatRate: Number(dbItem.vatRate),
      totalExclVat: Number(dbItem.totalExclVat),
      vatAmount: Number(dbItem.vatAmount),
      totalInclVat: Number(dbItem.totalInclVat),
      createdAt: Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
    };
  }
}
