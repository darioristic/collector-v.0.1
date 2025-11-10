import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import Decimal from "decimal.js";
import { invoices, invoiceItems } from "../../db/schema/sales.schema.js";
import type {
  Invoice,
  InvoiceCreateInput,
  InvoiceItem,
  InvoiceItemCreateInput,
  InvoiceUpdateInput
} from "@crm/types";

export class InvoicesService {
  constructor(private database: PostgresJsDatabase<Record<string, never>>) {}

  async list(filters?: {
    customerId?: string;
    orderId?: number;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Invoice[]; total: number }> {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

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

    const [data, countResult] = await Promise.all([
      this.database
        .select()
        .from(invoices)
        .where(whereClause)
        .orderBy(desc(invoices.createdAt))
        .limit(limit)
        .offset(offset),
      this.database
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(whereClause)
    ]);

    return {
      data: data.map((inv) => this.mapInvoiceFromDb(inv)),
      total: Number(countResult[0]?.count ?? 0)
    };
  }

  async getById(id: string): Promise<Invoice | null> {
    const [invoice] = await this.database
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!invoice) {
      return null;
    }

    // Fetch items
    const items = await this.database
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id))
      .orderBy(invoiceItems.id);

    return {
      ...this.mapInvoiceFromDb(invoice),
      items: items.map((item) => this.mapInvoiceItemFromDb(item))
    };
  }

  async create(input: InvoiceCreateInput): Promise<Invoice> {
    // Calculate totals from items
    const calculated = this.calculateTotals(input.items);

    // Create invoice
    const [newInvoice] = await this.database
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
      await this.database.insert(invoiceItems).values(
        input.items.map((item) => {
          const itemCalc = this.calculateItemTotals(item);
          return {
            invoiceId: newInvoice.id,
            description: item.description || null,
            quantity: item.quantity.toString(),
            unit: item.unit || "pcs",
            unitPrice: item.unitPrice.toString(),
            discountRate: (item.discountRate || 0).toString(),
            vatRate: (item.vatRate || 20).toString(),
            totalExclVat: itemCalc.totalExclVat.toString(),
            vatAmount: itemCalc.vatAmount.toString(),
            totalInclVat: itemCalc.totalInclVat.toString()
          };
        })
      );
    }

    return this.getById(newInvoice.id) as Promise<Invoice>;
  }

  async update(id: string, input: InvoiceUpdateInput): Promise<Invoice | null> {
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

    // Update invoice
    const updateData: any = {};
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

    await this.database.update(invoices).set(updateData).where(eq(invoices.id, id));

    // Update items if provided
    if (input.items) {
      // Delete existing items
      await this.database.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

      // Insert new items
      if (input.items.length > 0) {
        await this.database.insert(invoiceItems).values(
          input.items.map((item) => {
            const itemCalc = this.calculateItemTotals(item);
            return {
              invoiceId: id,
              description: item.description || null,
              quantity: item.quantity.toString(),
              unit: item.unit || "pcs",
              unitPrice: item.unitPrice.toString(),
              discountRate: (item.discountRate || 0).toString(),
              vatRate: (item.vatRate || 20).toString(),
              totalExclVat: itemCalc.totalExclVat.toString(),
              vatAmount: itemCalc.vatAmount.toString(),
              totalInclVat: itemCalc.totalInclVat.toString()
            };
          })
        );
      }
    }

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.database.delete(invoices).where(eq(invoices.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
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
    const vatRate = new Decimal(item.vatRate || 20);

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

  private mapInvoiceFromDb(dbInvoice: any): Invoice {
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

  private mapInvoiceItemFromDb(dbItem: any): InvoiceItem {
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