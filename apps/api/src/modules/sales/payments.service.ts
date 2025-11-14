import { and, desc, eq, sql } from "drizzle-orm";

import type { AppDatabase } from "../../db/index.js";
import { payments, invoices } from "../../db/schema/sales.schema.js";
import type { Payment, PaymentCreateInput, PaymentStatus } from "@crm/types";

type PaymentEntity = typeof payments.$inferSelect;

export class PaymentsService {
  constructor(private database: AppDatabase) {}

  private mapPayment(payment: PaymentEntity): Payment {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      companyId: payment.companyId,
      contactId: payment.contactId,
      status: payment.status as PaymentStatus,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes,
      paymentDate: payment.paymentDate,
      createdAt: payment.createdAt.toISOString()
    };
  }

  async list(filters?: {
    invoiceId?: string;
    status?: PaymentStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Payment[]; total: number }> {
    let query = this.database.select().from(payments).$dynamic();
    let countQuery = this.database
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .$dynamic();

    const conditions = [];

    if (filters?.invoiceId) {
      conditions.push(eq(payments.invoiceId, filters.invoiceId));
    }

    if (filters?.status) {
      conditions.push(eq(payments.status, filters.status));
    }

    if (conditions.length > 0) {
      const whereClause = and(...conditions);
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    // Apply pagination
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    query = query.orderBy(desc(payments.paymentDate), desc(payments.createdAt)).limit(limit).offset(offset);

    // Execute both queries in parallel
    const [rows, [countResult]] = await Promise.all([query, countQuery]);

    const total = countResult?.count ?? 0;
    const data = rows.map((row) => this.mapPayment(row));

    return { data, total };
  }

  async getById(id: string): Promise<Payment | null> {
    const [payment] = await this.database.select().from(payments).where(eq(payments.id, id)).limit(1);

    if (!payment) {
      return null;
    }

    return this.mapPayment(payment);
  }

  async create(input: PaymentCreateInput): Promise<Payment> {
    // Get invoice to extract currency if not provided
    const [invoice] = await this.database
      .select()
      .from(invoices)
      .where(eq(invoices.id, input.invoiceId))
      .limit(1);

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const [payment] = await this.database
      .insert(payments)
      .values({
        invoiceId: input.invoiceId,
        amount: input.amount.toString(),
        currency: input.currency || "EUR",
        method: input.method,
        reference: input.reference || null,
        notes: input.notes || null,
        paymentDate: input.paymentDate || new Date().toISOString().split("T")[0],
        status: input.status || "completed"
      })
      .returning();

    // Update invoice amountPaid
    await this.updateInvoicePaymentStatus(input.invoiceId);

    return this.mapPayment(payment);
  }

  async delete(id: string): Promise<void> {
    const payment = await this.getById(id);
    if (!payment) {
      throw new Error("Payment not found");
    }

    await this.database.delete(payments).where(eq(payments.id, id));

    // Update invoice amountPaid after deletion
    await this.updateInvoicePaymentStatus(payment.invoiceId);
  }

  private async updateInvoicePaymentStatus(invoiceId: string): Promise<void> {
    // Calculate total paid amount for this invoice
    const [result] = await this.database
      .select({
        totalPaid: sql<string>`COALESCE(SUM(${payments.amount}), 0)`
      })
      .from(payments)
      .where(and(eq(payments.invoiceId, invoiceId), eq(payments.status, "completed")));

    const totalPaid = Number(result?.totalPaid || 0);

    // Update invoice amountPaid and balance
    await this.database.execute(sql`
      UPDATE invoices
      SET amount_paid = ${totalPaid},
          balance = total - ${totalPaid}
      WHERE id = ${invoiceId}
    `);
  }
}