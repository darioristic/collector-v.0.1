import { NextRequest, NextResponse } from "next/server";
import { renderInvoiceToStream } from "@/lib/invoice-pdf/renderer";
import type { InvoicePDFProps } from "@/lib/invoice-pdf/types";
import { fetchInvoice } from "@/src/queries/invoices";

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as { invoiceId?: string; props?: InvoicePDFProps };

		if (body.invoiceId) {
			// Fetch invoice by ID
			const invoice = await fetchInvoice(body.invoiceId);

			if (!invoice) {
				return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
			}

			// Transform invoice to PDF props (similar to pdf-export.controller.ts)
			const defaultTemplate = {
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
			};

			const lineItems = (invoice.items || []).map((item) => ({
				name: item.description || "Product / Service",
				price: Number(item.unitPrice),
				quantity: Number(item.quantity),
				vat: item.vatRate ? Number(item.vatRate) : undefined,
				unit: item.unit || undefined,
				discountRate: item.discountRate ? Number(item.discountRate) : undefined,
			}));

			const createEditorContent = (text: string | null | undefined): JSON | undefined => {
				if (!text) {
					return { type: "doc", content: [] } as JSON;
				}
				return {
					type: "doc",
					content: [
						{
							type: "paragraph",
							content: [{ type: "text", text: text }],
						},
					],
				} as JSON;
			};

			const fromDetails = createEditorContent(
				`Your Company\ninfo@yourcompany.com\n+381 60 000 0000\nAddress line\nVAT ID: —`
			);

			const customerDetails = createEditorContent(
				`${invoice.customerName}\n${invoice.customerEmail || ""}\n${invoice.billingAddress || ""}\nVAT ID: —`
			);

			const paymentDetails = createEditorContent("Bank: — | Account number: — | IBAN: —");

			const noteDetails = invoice.notes
				? typeof invoice.notes === "object"
					? (invoice.notes as JSON)
					: createEditorContent(String(invoice.notes))
				: undefined;

			const pdfProps: InvoicePDFProps = {
				invoice_number: invoice.invoiceNumber,
				issue_date: invoice.issuedAt,
				due_date: invoice.dueDate ?? null,
				template: defaultTemplate,
				line_items: lineItems,
				customer_details: customerDetails,
				from_details: fromDetails,
				payment_details: paymentDetails,
				note_details: noteDetails,
				currency: invoice.currency,
				customer_name: invoice.customerName,
				amountBeforeDiscount: Number(invoice.amountBeforeDiscount),
				discountTotal: Number(invoice.discountTotal),
				subtotal: Number(invoice.subtotal),
				totalVat: Number(invoice.totalVat),
				total: Number(invoice.total),
			};

			const stream = await renderInvoiceToStream(pdfProps);
			const blob = await new Response(stream).blob();

			return new NextResponse(blob, {
				headers: {
					"Content-Type": "application/pdf",
					"Cache-Control": "no-store, max-age=0",
					"Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
				},
			});
		} else if (body.props) {
			// Use provided props directly
			const stream = await renderInvoiceToStream(body.props);
			const blob = await new Response(stream).blob();

			return new NextResponse(blob, {
				headers: {
					"Content-Type": "application/pdf",
					"Cache-Control": "no-store, max-age=0",
				},
			});
		} else {
			return NextResponse.json(
				{ error: "Either invoiceId or props must be provided" },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error("PDF generation error:", error);
		return NextResponse.json(
			{
				error: "PDF generation failed",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

