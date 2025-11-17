import type { Invoice } from "@crm/types";
import { fetchInvoice } from "@/src/queries/invoices";
import { isUuid } from "@/lib/utils";
import { HtmlTemplate } from "@/components/invoices/templates";
import { redirect } from "next/navigation";

export default async function InvoiceHtmlPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) {
    redirect(`/invoices/${id}`);
  }
  const invoice: Invoice = await fetchInvoice(id);

  const sanitizeEditorDoc = (input: unknown) => {
    if (!input || typeof input !== "object") {
      return { type: "doc", content: [] } as const;
    }
    const d = input as { content?: unknown };
    const contentArr = Array.isArray(d.content) ? d.content : [];
    const sanitizedNodes = contentArr
      .filter((n) => n && typeof n === "object")
      .map((n: { type?: string; content?: Array<{ type?: string; text?: string; marks?: unknown[]; attrs?: Record<string, unknown> }> }) => {
        const nodeType = typeof n.type === "string" ? n.type : "paragraph";
        const inlineArr = Array.isArray(n.content) ? n.content : [];
        const sanitizedInline = inlineArr
          .filter((ic) => ic && typeof ic === "object")
          .map((ic) => ({
            type: typeof ic.type === "string" ? ic.type : "text",
            text: typeof ic.text === "string" ? ic.text : undefined,
            marks: Array.isArray(ic.marks)
              ? ic.marks.filter((m) => m && typeof m === "object")
              : undefined,
            attrs: ic.attrs && typeof ic.attrs === "object" ? ic.attrs : undefined,
          }));
        return { type: nodeType, content: sanitizedInline } as const;
      });
    return { type: "doc", content: sanitizedNodes } as const;
  };

  const docToString = (input: unknown): string => {
    try {
      const d = input as { content?: Array<{ content?: Array<{ text?: string }> }> };
      const paras = Array.isArray(d?.content) ? d.content : [];
      return paras
        .map((p) => (Array.isArray(p?.content) ? p!.content!.map((n) => n.text ?? "").join("") : ""))
        .join("\n");
    } catch {
      return typeof input === "string" ? input : "";
    }
  };

  const template = {
    logo_url: undefined,
    from_label: "From",
    customer_label: "Bill To",
    description_label: "Description",
    quantity_label: "Quantity",
    price_label: "Price",
    total_label: "Total",
    vat_label: "VAT",
    payment_label: "Payment Details",
    note_label: "Note",
    include_vat: true,
    include_tax: false,
  } as const;

  const lineItems = (invoice.items || []).map((item) => ({
    name: item.description || "Product / Service",
    price: Number(item.unitPrice),
    quantity: Number(item.quantity),
    vat: item.vatRate ? Number(item.vatRate) : undefined,
    unit: item.unit || undefined,
    discountRate: item.discountRate ? Number(item.discountRate) : undefined,
  }));

  const fromDetails = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Your Company" }] },
      { type: "paragraph", content: [{ type: "text", text: "info@yourcompany.com" }] },
      { type: "paragraph", content: [{ type: "text", text: "+381 60 000 0000" }] },
      { type: "paragraph", content: [{ type: "text", text: "Address line" }] },
      { type: "paragraph", content: [{ type: "text", text: "VAT ID: —" }] },
    ],
  } as const;

  const customerDetails = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: invoice.customerName || "" }] },
      { type: "paragraph", content: [{ type: "text", text: invoice.customerEmail || "" }] },
      { type: "paragraph", content: [{ type: "text", text: invoice.billingAddress || "" }] },
      { type: "paragraph", content: [{ type: "text", text: "VAT ID: —" }] },
    ],
  } as const;

  const paymentDetails = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Bank: — | Account number: — | IBAN: —" }] },
    ],
  } as const;

  const notePlain =
    invoice.notes && typeof invoice.notes === "object"
      ? docToString(invoice.notes)
      : invoice.notes
      ? String(invoice.notes)
      : "";
  const noteDetails = notePlain
    ? sanitizeEditorDoc({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: notePlain }] },
        ],
      })
    : undefined;

  return (
    <div className="w-full h-screen">
      <HtmlTemplate
        invoice_number={invoice.invoiceNumber}
        issue_date={invoice.issuedAt}
        due_date={invoice.dueDate ?? null}
        template={template}
        line_items={lineItems}
        customer_details={customerDetails}
        from_details={fromDetails}
        payment_details={paymentDetails}
        note_details={noteDetails as import("@/components/invoices/templates/types").EditorDoc | undefined}
        currency={invoice.currency}
        customer_name={invoice.customerName}
        width={595}
        height={"100%"}
        interactive={false}
        amountBeforeDiscount={Number(invoice.amountBeforeDiscount) || 0}
        discountTotal={Number(invoice.discountTotal) || 0}
        subtotal={Number(invoice.subtotal) || 0}
        totalVat={Number(invoice.totalVat) || 0}
        total={Number(invoice.total) || 0}
      />
    </div>
  );
}
