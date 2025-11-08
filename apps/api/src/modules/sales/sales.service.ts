import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { db } from "../../db";
import {
  invoices,
  opportunities,
  orderItems,
  orders,
  salesDeals
} from "../../db/schema";

const formatDate = (value: Date | string | null | undefined): string => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
};

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  return new Date(value);
};

const toNumericString = (value: number | string): string =>
  typeof value === "number" ? value.toString() : value;

export type DealStage = typeof opportunities.$inferSelect.stage;

export type Deal = {
  id: string;
  opportunityId: string;
  accountId: string;
  title: string;
  stage: DealStage;
  amount: number;
  closeDate: string;
  createdAt: string;
};

export type DealCreateInput = {
  accountId: string;
  title: string;
  stage: DealStage;
  amount: number;
  closeDate: string;
  description?: string | null;
};

export type DealUpdateInput = Partial<Omit<DealCreateInput, "accountId">> & {
  accountId?: string;
  description?: string | null;
};

export type OrderStatus = typeof orders.$inferSelect.status;

export type OrderItem = {
  id: string;
  productId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
};

export type Order = {
  id: string;
  accountId: string;
  dealId: string | null;
  status: OrderStatus;
  currency: string;
  totalAmount: number;
  orderedAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type OrderCreateItemInput = {
  id?: string;
  productId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
};

export type OrderCreateInput = {
  dealId: string;
  status: OrderStatus;
  currency?: string;
  items: OrderCreateItemInput[];
};

export type OrderUpdateInput = Partial<Omit<OrderCreateInput, "items">> & {
  items?: OrderCreateItemInput[];
};

export type InvoiceStatus = typeof invoices.$inferSelect.status;

export type Invoice = {
  id: string;
  orderId: string;
  status: InvoiceStatus;
  amount: number;
  balance: number;
  issueDate: string;
  dueDate: string | null;
};

export type InvoiceCreateInput = {
  orderId: string;
  status: InvoiceStatus;
  amount: number;
  balance?: number;
  issueDate: string;
  dueDate?: string | null;
};

export type InvoiceUpdateInput = Partial<InvoiceCreateInput>;

type SalesDatabase = typeof db;

const calculateOrderTotals = (items: OrderCreateItemInput[]): {
  total: string;
  normalized: OrderItem[];
} => {
  const normalized = items.map((item) => ({
    id: item.id ?? randomUUID(),
    productId: item.productId ?? null,
    name: item.name,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    discount: item.discount ?? 0
  }));

  const total = normalized.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice - (item.discount ?? 0),
    0
  );

  return {
    total: total.toFixed(2),
    normalized
  };
};

class DrizzleSalesService {
  constructor(private readonly database: SalesDatabase = db) {}

  async listDeals(): Promise<Deal[]> {
    const results = await this.database
      .select({
        id: salesDeals.id,
        opportunityId: salesDeals.opportunityId,
        accountId: opportunities.accountId,
        title: opportunities.title,
        stage: opportunities.stage,
        amount: opportunities.value,
        closeDate: opportunities.closeDate,
        createdAt: salesDeals.createdAt
      })
      .from(salesDeals)
      .innerJoin(opportunities, eq(salesDeals.opportunityId, opportunities.id))
      .orderBy(desc(salesDeals.createdAt));

    return results.map((row) => ({
      id: row.id,
      opportunityId: row.opportunityId,
      accountId: row.accountId,
      title: row.title,
      stage: row.stage,
      amount: Number(row.amount ?? 0),
      closeDate: formatDate(row.closeDate),
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString()
    }));
  }

  async getDeal(id: string): Promise<Deal | null> {
    const [result] = await this.database
      .select({
        id: salesDeals.id,
        opportunityId: salesDeals.opportunityId,
        accountId: opportunities.accountId,
        title: opportunities.title,
        stage: opportunities.stage,
        amount: opportunities.value,
        closeDate: opportunities.closeDate,
        createdAt: salesDeals.createdAt
      })
      .from(salesDeals)
      .innerJoin(opportunities, eq(salesDeals.opportunityId, opportunities.id))
      .where(eq(salesDeals.id, id))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      opportunityId: result.opportunityId,
      accountId: result.accountId,
      title: result.title,
      stage: result.stage,
      amount: Number(result.amount ?? 0),
      closeDate: formatDate(result.closeDate),
      createdAt: result.createdAt?.toISOString() ?? new Date().toISOString()
    };
  }

  async createDeal(input: DealCreateInput): Promise<Deal> {
    const now = new Date();

    const created = await this.database.transaction(async (tx) => {
      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          id: randomUUID(),
          accountId: input.accountId,
          title: input.title,
          stage: input.stage,
          value: toNumericString(input.amount),
          probability: "0",
          closeDate: toDate(input.closeDate),
          createdAt: now,
          updatedAt: now
        })
        .returning({
          id: opportunities.id,
          accountId: opportunities.accountId,
          title: opportunities.title,
          stage: opportunities.stage,
          value: opportunities.value,
          closeDate: opportunities.closeDate,
          createdAt: opportunities.createdAt
        });

      const [deal] = await tx
        .insert(salesDeals)
        .values({
          id: randomUUID(),
          opportunityId: opportunity.id,
          description: input.description ?? null,
          createdAt: now
        })
        .returning({
          id: salesDeals.id,
          createdAt: salesDeals.createdAt
        });

      return {
        dealId: deal.id,
        createdAt: deal.createdAt ?? now,
        opportunity
      };
    });

    return {
      id: created.dealId,
      opportunityId: created.opportunity.id,
      accountId: created.opportunity.accountId,
      title: created.opportunity.title,
      stage: created.opportunity.stage,
      amount: Number(created.opportunity.value ?? 0),
      closeDate: formatDate(created.opportunity.closeDate),
      createdAt: created.createdAt.toISOString()
    };
  }

  async updateDeal(id: string, input: DealUpdateInput): Promise<Deal | null> {
    const existing = await this.getDeal(id);

    if (!existing) {
      return null;
    }

    await this.database.transaction(async (tx) => {
      if (input.accountId || input.title || input.stage || input.amount || input.closeDate) {
        await tx
          .update(opportunities)
          .set({
            ...(input.accountId ? { accountId: input.accountId } : {}),
            ...(input.title ? { title: input.title } : {}),
            ...(input.stage ? { stage: input.stage } : {}),
            ...(typeof input.amount !== "undefined"
              ? { value: toNumericString(input.amount) }
              : {}),
            ...(typeof input.closeDate !== "undefined"
              ? { closeDate: toDate(input.closeDate) }
              : {}),
            updatedAt: new Date()
          })
          .where(eq(opportunities.id, existing.opportunityId));
      }

      if (typeof input.description !== "undefined") {
        await tx
          .update(salesDeals)
          .set({ description: input.description })
          .where(eq(salesDeals.id, id));
      }
    });

    return this.getDeal(id);
  }

  async deleteDeal(id: string): Promise<boolean> {
    const deal = await this.getDeal(id);

    if (!deal) {
      return false;
    }

    await this.database.transaction(async (tx) => {
      await tx.delete(opportunities).where(eq(opportunities.id, deal.opportunityId));
    });

    return true;
  }

  async listOrders(): Promise<Order[]> {
    const rows = await this.database.query.orders.findMany({
      orderBy: (ordersTable, operators) => operators.desc(ordersTable.orderedAt),
      with: {
        items: true
      }
    });

    return rows.map((row) => ({
      id: row.id,
      accountId: row.accountId,
      dealId: row.dealId,
      status: row.status,
      currency: row.currency,
      totalAmount: Number(row.totalAmount ?? 0),
      orderedAt: row.orderedAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
      items: row.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.unitPrice ?? 0),
        discount: Number(item.discount ?? 0)
      }))
    }));
  }

  async getOrder(id: string): Promise<Order | null> {
    const [order] = await this.database.query.orders.findMany({
      where: (ordersTable, { eq }) => eq(ordersTable.id, id),
      limit: 1,
      with: {
        items: true
      }
    });

    if (!order) {
      return null;
    }

    return {
      id: order.id,
      accountId: order.accountId,
      dealId: order.dealId,
      status: order.status,
      currency: order.currency,
      totalAmount: Number(order.totalAmount ?? 0),
      orderedAt: order.orderedAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: order.updatedAt?.toISOString() ?? new Date().toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.unitPrice ?? 0),
        discount: Number(item.discount ?? 0)
      }))
    };
  }

  async createOrder(input: OrderCreateInput): Promise<Order> {
    const deal = await this.getDeal(input.dealId);

    if (!deal) {
      throw new Error(`Deal ${input.dealId} not found`);
    }

    const { total, normalized } = calculateOrderTotals(input.items);

    const now = new Date();

    const created = await this.database.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          id: randomUUID(),
          accountId: deal.accountId,
          dealId: input.dealId,
          ownerId: null,
          status: input.status,
          currency: input.currency ?? "USD",
          totalAmount: total,
          notes: null,
          orderedAt: now,
          updatedAt: now
        })
        .returning({
          id: orders.id,
          accountId: orders.accountId,
          dealId: orders.dealId,
          status: orders.status,
          currency: orders.currency,
          totalAmount: orders.totalAmount,
          orderedAt: orders.orderedAt,
          updatedAt: orders.updatedAt
        });

      await tx
        .insert(orderItems)
        .values(
          normalized.map((item) => ({
            id: item.id,
            orderId: order.id,
            productId: item.productId ?? null,
            name: item.name,
            quantity: toNumericString(item.quantity),
            unitPrice: toNumericString(item.unitPrice),
            discount: toNumericString(item.discount ?? 0)
          }))
        );

      return {
        order,
        items: normalized
      };
    });

    return {
      id: created.order.id,
      accountId: created.order.accountId,
      dealId: created.order.dealId,
      status: created.order.status,
      currency: created.order.currency,
      totalAmount: Number(created.order.totalAmount ?? 0),
      orderedAt: created.order.orderedAt?.toISOString() ?? now.toISOString(),
      updatedAt: created.order.updatedAt?.toISOString() ?? now.toISOString(),
      items: created.items
    };
  }

  async updateOrder(id: string, input: OrderUpdateInput): Promise<Order | null> {
    const existing = await this.getOrder(id);

    if (!existing) {
      return null;
    }

    await this.database.transaction(async (tx) => {
      const updates: Partial<typeof orders.$inferInsert> = {};

      if (input.status) {
        updates.status = input.status;
      }

      if (input.currency) {
        updates.currency = input.currency;
      }

      if (input.items && input.items.length > 0) {
        const { total, normalized } = calculateOrderTotals(input.items);
        updates.totalAmount = total;
        updates.updatedAt = new Date();

        await tx.delete(orderItems).where(eq(orderItems.orderId, id));

        await tx
          .insert(orderItems)
          .values(
            normalized.map((item) => ({
              id: item.id,
              orderId: id,
              productId: item.productId ?? null,
              name: item.name,
              quantity: toNumericString(item.quantity),
              unitPrice: toNumericString(item.unitPrice),
              discount: toNumericString(item.discount ?? 0)
            }))
          );
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = updates.updatedAt ?? new Date();
        await tx.update(orders).set(updates).where(eq(orders.id, id));
      }
    });

    return this.getOrder(id);
  }

  async deleteOrder(id: string): Promise<boolean> {
    const existing = await this.getOrder(id);

    if (!existing) {
      return false;
    }

    await this.database.transaction(async (tx) => {
      await tx.delete(orderItems).where(eq(orderItems.orderId, id));
      await tx.delete(orders).where(eq(orders.id, id));
    });

    return true;
  }

  async listInvoices(): Promise<Invoice[]> {
    const rows = await this.database
      .select({
        id: invoices.id,
        orderId: invoices.orderId,
        status: invoices.status,
        total: invoices.total,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedAt: invoices.issuedAt
      })
      .from(invoices)
      .orderBy(desc(invoices.issuedAt));

    return rows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      status: row.status,
      amount: Number(row.total ?? 0),
      balance: Number(row.balance ?? 0),
      issueDate: formatDate(row.issuedAt),
      dueDate: row.dueDate ? formatDate(row.dueDate) : null,
      issuedAt: row.issuedAt?.toISOString() ?? new Date().toISOString()
    }));
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const [row] = await this.database
      .select({
        id: invoices.id,
        orderId: invoices.orderId,
        status: invoices.status,
        total: invoices.total,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedAt: invoices.issuedAt
      })
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      orderId: row.orderId,
      status: row.status,
      amount: Number(row.total ?? 0),
      balance: Number(row.balance ?? 0),
      issueDate: formatDate(row.issuedAt),
      dueDate: row.dueDate ? formatDate(row.dueDate) : null
    };
  }

  async createInvoice(input: InvoiceCreateInput): Promise<Invoice> {
    const now = new Date();

    const [created] = await this.database
      .insert(invoices)
      .values({
        id: randomUUID(),
        orderId: input.orderId,
        status: input.status,
        dueDate: toDate(input.dueDate ?? null),
        issuedAt: toDate(input.issueDate) ?? now,
        total: toNumericString(input.amount),
        balance: toNumericString(input.balance ?? input.amount)
      })
      .returning({
        id: invoices.id,
        orderId: invoices.orderId,
        status: invoices.status,
        total: invoices.total,
        balance: invoices.balance,
        dueDate: invoices.dueDate,
        issuedAt: invoices.issuedAt
      });

    return {
      id: created.id,
      orderId: created.orderId,
      status: created.status,
      amount: Number(created.total ?? 0),
      balance: Number(created.balance ?? 0),
      issueDate: formatDate(created.issuedAt),
      dueDate: created.dueDate ? formatDate(created.dueDate) : null
    };
  }

  async updateInvoice(id: string, input: InvoiceUpdateInput): Promise<Invoice | null> {
    const existing = await this.getInvoice(id);

    if (!existing) {
      return null;
    }

    const updates: Partial<typeof invoices.$inferInsert> = {};

    if (typeof input.status !== "undefined") {
      updates.status = input.status;
    }

    if (typeof input.amount !== "undefined") {
      updates.total = toNumericString(input.amount);
      if (typeof input.balance === "undefined") {
        updates.balance = toNumericString(input.amount);
      }
    }

    if (typeof input.balance !== "undefined") {
      updates.balance = toNumericString(input.balance);
    }

    if (typeof input.issueDate !== "undefined") {
      updates.issuedAt = toDate(input.issueDate) ?? new Date();
    }

    if (typeof input.dueDate !== "undefined") {
      updates.dueDate = toDate(input.dueDate);
    }

    if (Object.keys(updates).length === 0) {
      return existing;
    }

    await this.database
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id));

    return this.getInvoice(id);
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const existing = await this.getInvoice(id);

    if (!existing) {
      return false;
    }

    await this.database.delete(invoices).where(eq(invoices.id, id));

    return true;
  }
}

export type SalesService = DrizzleSalesService;

export const createSalesService = (database: SalesDatabase = db): SalesService => {
  return new DrizzleSalesService(database);
};

declare module "fastify" {
  interface FastifyInstance {
    salesService: SalesService;
  }

  interface FastifyRequest {
    salesService: SalesService;
  }
}


