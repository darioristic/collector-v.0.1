import { getDb } from "@/lib/db";
import { invoices, invoiceLineItems } from "@/lib/db/schema/invoices";
import { eq, asc } from "drizzle-orm";
import type { InvoiceFormValues } from "@/actions/invoice/schema";

export async function getDraftInvoice(id: string): Promise<InvoiceFormValues | null> {
  const db = await getDb();

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoice) {
    return null;
  }

  // Fetch line items
  const lineItemsData = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id))
    .orderBy(asc(invoiceLineItems.sortOrder));

  // Transform line items
  const lineItems = lineItemsData.map((item) => ({
    name: item.name || "",
    quantity: item.quantity ? Number(item.quantity) : 0,
    price: item.price ? Number(item.price) : 0,
    vat: item.vat ? Number(item.vat) : undefined,
    tax: item.tax ? Number(item.tax) : undefined,
  }));

  // Transform database invoice to InvoiceFormValues
  const result: InvoiceFormValues = {
    id: invoice.id,
    template: {
      customer_label: invoice.customerLabel || "To",
      from_label: invoice.fromLabel || "From",
      invoice_no_label: invoice.invoiceNoLabel || "Invoice No",
      issue_date_label: invoice.issueDateLabel || "Issue Date",
      due_date_label: invoice.dueDateLabel || "Due Date",
      description_label: invoice.descriptionLabel || "Description",
      price_label: invoice.priceLabel || "Price",
      quantity_label: invoice.quantityLabel || "Quantity",
      total_label: invoice.totalLabel || "Total",
      vat_label: invoice.vatLabel || "VAT",
      tax_label: invoice.taxLabel || "Tax",
      payment_label: invoice.paymentLabel || "Payment Details",
      note_label: invoice.noteLabel || "Note",
      logo_url: invoice.logoUrl || undefined,
      currency: invoice.currency || "USD",
      payment_details: invoice.paymentDetails as any,
      from_details: invoice.fromDetails as any,
      size: invoice.size || "a4",
      include_vat: invoice.includeVat ?? true,
      include_tax: invoice.includeTax ?? false,
      tax_rate: invoice.taxRate ? Number(invoice.taxRate) : undefined,
      date_format: invoice.dateFormat || "dd/MM/yyyy",
      delivery_type: invoice.deliveryType || "create",
      locale: invoice.locale || "en-US",
    },
    from_details: invoice.fromDetails as any,
    customer_details: invoice.customerDetails as any,
    customer_id: invoice.customerId || undefined,
    customer_name: invoice.customerName || undefined,
    payment_details: invoice.paymentDetails as any,
    note_details: invoice.noteDetails as any,
    due_date: invoice.dueDate || new Date(),
    issue_date: invoice.issueDate || new Date(),
    invoice_number: invoice.invoiceNumber || "",
    logo_url: invoice.logoUrl || undefined,
    vat: invoice.vatAmount ? Number(invoice.vatAmount) : undefined,
    tax: invoice.taxAmount ? Number(invoice.taxAmount) : undefined,
    amount: invoice.total ? Number(invoice.total) : undefined,
    line_items: lineItems.length > 0 ? lineItems : [{ name: "", quantity: 0, price: 0 }],
    token: invoice.token || undefined,
  };

  return result;
}

