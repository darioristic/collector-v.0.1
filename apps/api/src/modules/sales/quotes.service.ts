import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import Decimal from "decimal.js";
import type { AppDatabase } from "../../db/index.js";
import { accounts, accountContacts } from "../../db/schema/accounts.schema.js";
import { quotes, quoteItems } from "../../db/schema/sales.schema.js";
import type {
  Quote,
  QuoteCreateInput,
  QuoteItem,
  QuoteItemCreateInput,
  QuoteSortField,
  QuoteUpdateInput
} from "@crm/types";
import type { CacheService } from "../../lib/cache.service";

type QuoteInsert = typeof quotes.$inferInsert;
type QuoteRow = typeof quotes.$inferSelect;
type QuoteItemRow = typeof quoteItems.$inferSelect;

/**
 * QuotesService handles all quote-related business logic
 * 
 * Features:
 * - Optimized queries using window functions for pagination
 * - Redis caching for improved performance (TTL: 10-15 minutes)
 * - JOIN queries to avoid N+1 problem
 * - Transaction support for data consistency
 * - Support for quote conversion to orders
 * 
 * @example
 * ```typescript
 * const service = new QuotesService(db, cache);
 * const quotes = await service.list({ status: 'draft' });
 * ```
 */
export class QuotesService {
  /**
   * Creates a new QuotesService instance
   * 
   * @param database - Drizzle database instance
   * @param cache - Optional cache service for performance optimization
   */
  constructor(
    private database: AppDatabase,
    private cache?: CacheService
  ) {}

  /**
   * OPTIMIZED: Window function for count + caching + JOINs
   */
  async list(filters?: {
    companyId?: string;
    contactId?: string;
    status?: typeof quotes.$inferSelect.status;
    search?: string;
    limit?: number;
    offset?: number;
    sortField?: QuoteSortField;
    sortOrder?: "asc" | "desc";
  }): Promise<{ data: Quote[]; total: number }> {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;
    const sortField = filters?.sortField ?? "createdAt";
    const sortOrder = filters?.sortOrder ?? "desc";

    const cacheKey = `quotes:list:${JSON.stringify(filters || {})}`;

    if (this.cache) {
      const cached = await this.cache.get<{ data: Quote[]; total: number }>(cacheKey);
      if (cached) return cached;
    }

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

    const orderColumn = getOrderColumn(sortField);
    const orderClause = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

    // OPTIMIZATION: Window function
    const data = await this.database
      .select({
        quote: quotes,
        companyName: accounts.name,
        contactName: accountContacts.fullName,
        totalCount: sql<number>`count(*) over()`
      })
      .from(quotes)
      .leftJoin(accounts, eq(quotes.companyId, accounts.id))
      .leftJoin(accountContacts, eq(quotes.contactId, accountContacts.id))
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    const total = data.length > 0 ? Number(data[0].totalCount) : 0;

    const result = {
      data: data.map((row) =>
        this.mapQuoteFromDb(row.quote, {
          companyName: row.companyName,
          contactName: row.contactName
        })
      ),
      total
    };

    if (this.cache) {
      await this.cache.set(cacheKey, result, { ttl: 600 });
    }

    return result;
  }

  /**
   * OPTIMIZED: Single JOIN query + caching
   */
  async getById(id: number): Promise<Quote | null> {
    const cacheKey = `quotes:${id}`;

    if (this.cache) {
      const cached = await this.cache.get<Quote>(cacheKey);
      if (cached) return cached;
    }

    // FIX N+1
    const result = await this.database
      .select({
        quote: quotes,
        item: quoteItems,
        companyName: accounts.name,
        contactName: accountContacts.fullName
      })
      .from(quotes)
      .leftJoin(quoteItems, eq(quoteItems.quoteId, quotes.id))
      .leftJoin(accounts, eq(quotes.companyId, accounts.id))
      .leftJoin(accountContacts, eq(quotes.contactId, accountContacts.id))
      .where(eq(quotes.id, id));

    if (result.length === 0) return null;

    const quoteData = result[0].quote;
    const companyName = result[0].companyName;
    const contactName = result[0].contactName;
    const items = result
      .filter(row => row.item !== null)
      .map(row => this.mapQuoteItemFromDb(row.item!));

    const quote: Quote = {
      ...this.mapQuoteFromDb(quoteData, { companyName, contactName }),
      items
    };

    if (this.cache) {
      await this.cache.set(cacheKey, quote, { ttl: 900 });
    }

    return quote;
  }

  async create(input: QuoteCreateInput): Promise<Quote> {
    try {
      const { subtotal, tax, total } = this.calculateTotals(input.items);

      const result = await this.database.transaction(async (tx) => {
        const [newQuote] = await tx
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
            status: (input.status || "draft") as typeof quotes.$inferSelect.status,
            notes: input.notes || null
          })
          .returning();

        if (input.items.length > 0) {
          await tx.insert(quoteItems).values(
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

        return newQuote;
      });

      if (this.cache) {
        await this.cache.deletePattern('quotes:list:*');
      }

      const quote = await this.getById(result.id);
      if (!quote) throw new Error('Failed to retrieve created quote');
      return quote;

    } catch (error) {
      throw new Error(`Failed to create quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async update(id: number, input: QuoteUpdateInput): Promise<Quote | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) return null;

      let subtotal: Decimal | undefined;
      let tax: Decimal | undefined;
      let total: Decimal | undefined;

      if (input.items) {
        const calculated = this.calculateTotals(input.items);
        subtotal = calculated.subtotal;
        tax = calculated.tax;
        total = calculated.total;
      }

      await this.database.transaction(async (tx) => {
        const updateData: Partial<QuoteInsert> = {};
        if (input.companyId !== undefined) updateData.companyId = input.companyId || null;
        if (input.contactId !== undefined) updateData.contactId = input.contactId || null;
        if (input.issueDate !== undefined) updateData.issueDate = input.issueDate;
        if (input.expiryDate !== undefined) updateData.expiryDate = input.expiryDate;
        if (input.currency !== undefined) updateData.currency = input.currency;
        if (input.status !== undefined) updateData.status = input.status as typeof quotes.$inferSelect.status;
        if (input.notes !== undefined) updateData.notes = input.notes;
        if (subtotal !== undefined) updateData.subtotal = subtotal.toString();
        if (tax !== undefined) updateData.tax = tax.toString();
        if (total !== undefined) updateData.total = total.toString();
        updateData.updatedAt = new Date();

        await tx.update(quotes).set(updateData).where(eq(quotes.id, id));

        if (input.items) {
          await tx.delete(quoteItems).where(eq(quoteItems.quoteId, id));

          if (input.items.length > 0) {
            await tx.insert(quoteItems).values(
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
      });

      if (this.cache) {
        await this.cache.delete(`quotes:${id}`);
        await this.cache.deletePattern('quotes:list:*');
      }

      return this.getById(id);

    } catch (error) {
      throw new Error(`Failed to update quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const deleted = await this.database.delete(quotes).where(eq(quotes.id, id)).returning();

      if (deleted.length > 0 && this.cache) {
        await this.cache.delete(`quotes:${id}`);
        await this.cache.deletePattern('quotes:list:*');
      }

      return deleted.length > 0;

    } catch (error) {
      throw new Error(`Failed to delete quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

    const tax = subtotal.times(0.2);
    const total = subtotal.plus(tax);

    return { subtotal, tax, total };
  }

  private mapQuoteFromDb(
    dbQuote: QuoteRow,
    extras: { companyName?: string | null; contactName?: string | null } = {}
  ): Quote {
    return {
      id: dbQuote.id,
      quoteNumber: dbQuote.quoteNumber,
      companyId: dbQuote.companyId ?? null,
      contactId: dbQuote.contactId ?? null,
      companyName: extras.companyName ?? null,
      contactName: extras.contactName ?? null,
      issueDate: dbQuote.issueDate 
        ? (typeof dbQuote.issueDate === 'string' 
          ? dbQuote.issueDate 
          : String(dbQuote.issueDate))
        : new Date().toISOString().split('T')[0],
      expiryDate: dbQuote.expiryDate 
        ? (typeof dbQuote.expiryDate === 'string' 
          ? dbQuote.expiryDate 
          : String(dbQuote.expiryDate))
        : null,
      currency: dbQuote.currency,
      subtotal: Number(dbQuote.subtotal),
      tax: Number(dbQuote.tax),
      total: Number(dbQuote.total),
      status: dbQuote.status,
      notes: dbQuote.notes ?? null,
      createdAt: dbQuote.createdAt.toISOString(),
      updatedAt: dbQuote.updatedAt.toISOString()
    };
  }

  private mapQuoteItemFromDb(dbItem: QuoteItemRow): QuoteItem {
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

const getOrderColumn = (
  field: QuoteSortField
):
  | typeof quotes.issueDate
  | typeof quotes.expiryDate
  | typeof quotes.total
  | typeof quotes.quoteNumber
  | typeof quotes.createdAt => {
  switch (field) {
    case "issueDate":
      return quotes.issueDate;
    case "expiryDate":
      return quotes.expiryDate;
    case "total":
      return quotes.total;
    case "quoteNumber":
      return quotes.quoteNumber;
    case "createdAt":
    default:
      return quotes.createdAt;
  }
};