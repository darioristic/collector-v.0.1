import { getDb } from "@/lib/db";
import { invoices } from "@/lib/db/schema/invoices";
import { and, or, like, inArray, gte, lte, desc, asc, sql } from "drizzle-orm";
import type { Invoice } from "@/components/invoices/tables/columns";

type SortParam = [string, "asc" | "desc"];

interface GetInvoicesParams {
  searchQuery?: string | null;
  sort?: SortParam[] | null;
  filter?: {
    start?: string | null;
    end?: string | null;
    statuses?: string[] | null;
    customers?: string[] | null;
  };
  from?: number;
  to?: number;
}

interface GetInvoicesResult {
  data: Invoice[];
  meta: {
    count: number;
  };
}

export async function getInvoices({
  searchQuery,
  sort,
  filter,
  from = 0,
  to = 25,
}: GetInvoicesParams): Promise<GetInvoicesResult> {
  const db = await getDb();

  // Build where conditions
  const conditions = [];

  // Search query
  if (searchQuery) {
    conditions.push(
      or(
        like(invoices.invoiceNumber, `%${searchQuery}%`),
        like(invoices.token, `%${searchQuery}%`)
      )!
    );
  }

  // Status filter
  if (filter?.statuses && filter.statuses.length > 0) {
    conditions.push(inArray(invoices.status, filter.statuses as any));
  }

  // Customer filter
  if (filter?.customers && filter.customers.length > 0) {
    conditions.push(inArray(invoices.customerId, filter.customers as any));
  }

  // Date range filter
  if (filter?.start) {
    conditions.push(gte(invoices.dueDate, new Date(filter.start)));
  }
  if (filter?.end) {
    conditions.push(lte(invoices.dueDate, new Date(filter.end)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Build sort
  let orderBy;
  if (sort && sort.length > 0) {
    const [field, direction] = sort[0];
    // Map common field names to schema columns
    const fieldMap: Record<string, any> = {
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
      dueDate: invoices.dueDate,
      invoiceDate: invoices.issueDate,
      invoice_number: invoices.invoiceNumber,
      status: invoices.status,
      total: invoices.total,
    };
    
    const column = fieldMap[field] || invoices.createdAt;
    orderBy = direction === "desc" ? desc(column) : asc(column);
  }
  if (!orderBy) {
    orderBy = desc(invoices.createdAt);
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(whereClause);

  const totalCount = Number(countResult[0]?.count || 0);

  // Get data
  const limit = to - from;
  const offset = from;

  const data = await db
    .select()
    .from(invoices)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // Transform to Invoice type
  const transformedData: Invoice[] = data.map((invoice) => ({
    id: invoice.id,
    due_date: invoice.dueDate?.toISOString() || "",
    invoice_date: invoice.invoiceDate?.toISOString(),
    paid_at: invoice.paidAt?.toISOString(),
    status: invoice.status || "draft",
    currency: invoice.currency || "USD",
    invoice_number: invoice.invoiceNumber || "",
    amount: invoice.total ? Number(invoice.total) : undefined,
    vat: invoice.vatAmount ? Number(invoice.vatAmount) : undefined,
    tax: invoice.taxAmount ? Number(invoice.taxAmount) : undefined,
    updated_at: invoice.updatedAt?.toISOString(),
    viewed_at: invoice.lastViewedAt?.toISOString(),
    template: {
      logo_url: invoice.logoUrl || undefined,
      from_label: invoice.fromLabel || "From",
      customer_label: invoice.customerLabel || "To",
      invoice_no_label: invoice.invoiceNoLabel || "Invoice No",
      issue_date_label: invoice.issueDateLabel || "Issue Date",
      due_date_label: invoice.dueDateLabel || "Due Date",
      description_label: invoice.descriptionLabel || "Description",
      quantity_label: invoice.quantityLabel || "Quantity",
      price_label: invoice.priceLabel || "Price",
      total_label: invoice.totalLabel || "Total",
      vat_label: invoice.vatLabel || "VAT",
      tax_label: invoice.taxLabel || "Tax",
      payment_label: invoice.paymentLabel || "Payment Details",
      note_label: invoice.noteLabel || "Note",
      include_vat: invoice.includeVat ?? true,
      include_tax: invoice.includeTax ?? false,
      tax_rate: invoice.taxRate ? Number(invoice.taxRate) : undefined,
      date_format: invoice.dateFormat || "yyyy-MM-dd",
      currency: invoice.currency || "USD",
      size: invoice.size || "a4",
    } as any,
    token: invoice.token || "",
    sent_to: invoice.sentTo,
    customer_details: invoice.customerDetails as any,
    internal_note: invoice.internalNote,
    customer: invoice.customerId
      ? {
          id: invoice.customerId,
          name: invoice.customerName || "",
          website: "",
        }
      : undefined,
    customer_name: invoice.customerName || undefined,
  }));

  return {
    data: transformedData,
    meta: {
      count: totalCount,
    },
  };
}

