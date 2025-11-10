import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import Decimal from "decimal.js";
import { quotes, quoteItems } from "../../db/schema/sales.schema.js";
import type {
  Quote,
  QuoteCreateInput,
  QuoteItem,
  QuoteItemCreateInput,
  QuoteStatus,
  QuoteUpdateInput
} from "@crm/types";

export class QuotesService {
  constructor(private database: PostgresJsDatabase<Record<string, never>>) {}

  async list(filters?: {
    companyId?: string;
    contactId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Quote[]; total: number }> {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const conditions = [];
    if (filters?.companyId) {
      conditions.push(eq(quotes.companyId, filters.companyId));
    }
    if (filters?.contactId) {
      conditions.push(eq(quotes.contactId, filters.contactId));
    }
    if (filters?.status) {
      conditions.push(eq(quotes.status, filters.status));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(quotes.quoteNumber, `%${filters.search}%`),
          ilike(quotes.notes, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      this.database
        .select()
        .from(quotes)
        .where(whereClause)
        .orderBy(desc(quotes.createdAt))
        .limit(limit)
        .offset(offset),
      this.database
        .select({ count: sql<number>`count(*)` })
        .from(quotes)
        .where(whereClause)
    ]);

    return {
      data: data.map((q) => this.mapQuoteFromDb(q)),
      total: Number(countResult[0]?.count ?? 0)
    };
  }

  async getById(id: number): Promise<Quote | null> {
    const [quote] = await this.database.select().from(quotes).where(eq(quotes.id, id)).limit(1);

    if (!quote) {
      return null;
    }

    // Fetch items
    const items = await this.database
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, id))
      .orderBy(quoteItems.id);

    return {
      ...this.mapQuoteFromDb(quote),
      items: items.map((item) => this.mapQuoteItemFromDb(item))
    };
  }

  async create(input: QuoteCreateInput): Promise<Quote> {
    // Calculate totals from items
    const { subtotal, tax, total } = this.calculateTotals(input.items);

    // Create quote
    const [newQuote] = await this.database
      .insert(quotes)
      .values({
        quoteNumber: input.quoteNumber,
        companyId: input.companyId || null,
        contactId: input.contactId || null,
        issueDate: input.issueDate || new Date().toISOString().split("T")[0],
        expiryDate: input.expiryDate || null,
        currency: input.currency || "EUR",
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        status: input.status || "draft",
        notes: input.notes || null
      })
      .returning();

    // Create quote items
    if (input.items.length > 0) {
      await this.database.insert(quoteItems).values(
        input.items.map((item) => ({
          quoteId: newQuote.id,
          productId: item.productId || null,
          description: item.description || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          total: new Decimal(item.quantity).times(item.unitPrice).toString()
        }))
      );
    }

    return this.getById(newQuote.id) as Promise<Quote>;
  }

  async update(id: number, input: QuoteUpdateInput): Promise<Quote | null> {
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

    // Update quote
    const updateData: any = {};
    if (input.companyId !== undefined) updateData.companyId = input.companyId || null;
    if (input.contactId !== undefined) updateData.contactId = input.contactId || null;
    if (input.issueDate !== undefined) updateData.issueDate = input.issueDate;
    if (input.expiryDate !== undefined) updateData.expiryDate = input.expiryDate;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (subtotal !== undefined) updateData.subtotal = subtotal.toString();
    if (tax !== undefined) updateData.tax = tax.toString();
    if (total !== undefined) updateData.total = total.toString();
    updateData.updatedAt = new Date();

    await this.database.update(quotes).set(updateData).where(eq(quotes.id, id));

    // Update items if provided
    if (input.items) {
      // Delete existing items
      await this.database.delete(quoteItems).where(eq(quoteItems.quoteId, id));

      // Insert new items
      if (input.items.length > 0) {
        await this.database.insert(quoteItems).values(
          input.items.map((item) => ({
            quoteId: id,
            productId: item.productId || null,
            description: item.description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            total: new Decimal(item.quantity).times(item.unitPrice).toString()
          }))
        );
      }
    }

    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.database.delete(quotes).where(eq(quotes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  private calculateTotals(items: QuoteItemCreateInput[]): {
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

  private mapQuoteFromDb(dbQuote: any): Quote {
    return {
      id: dbQuote.id,
      quoteNumber: dbQuote.quoteNumber,
      companyId: dbQuote.companyId,
      contactId: dbQuote.contactId,
      issueDate: dbQuote.issueDate,
      expiryDate: dbQuote.expiryDate,
      currency: dbQuote.currency,
      subtotal: Number(dbQuote.subtotal),
      tax: Number(dbQuote.tax),
      total: Number(dbQuote.total),
      status: dbQuote.status,
      notes: dbQuote.notes,
      createdAt: dbQuote.createdAt.toISOString(),
      updatedAt: dbQuote.updatedAt.toISOString()
    };
  }

  private mapQuoteItemFromDb(dbItem: any): QuoteItem {
    return {
      id: dbItem.id,
      quoteId: dbItem.quoteId,
      productId: dbItem.productId,
      description: dbItem.description,
      quantity: dbItem.quantity,
      unitPrice: Number(dbItem.unitPrice),
      total: Number(dbItem.total),
      createdAt: dbItem.createdAt.toISOString()
    };
  }
}