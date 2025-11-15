import type { FastifyReply, FastifyRequest } from "fastify";
import { InvoicesService } from "./invoices.service";
import { QuotesService } from "./quotes.service";
import { pdfService, type InvoicePDFData, type QuotePDFData } from "../../lib/pdf.service";
import { renderInvoiceToStream } from "../../lib/invoice-pdf/renderer";
import type { InvoicePDFProps } from "../../lib/invoice-pdf/types";

type ExportInvoicePDFParams = FastifyRequest<{
	Params: { id: string };
}>;

type ExportQuotePDFParams = FastifyRequest<{
	Params: { id: string };
}>;

// Helper function to create editor content from text
function createEditorContent(text: string | null | undefined): JSON | undefined {
	if (!text) {
		return {
			type: "doc",
			content: [],
		} as JSON;
	}
	return {
		type: "doc",
		content: [
			{
				type: "paragraph",
				content: [
					{
						type: "text",
						text: text,
					},
				],
			},
		],
	} as JSON;
}

export const exportInvoicePDFHandler = async (
	request: ExportInvoicePDFParams,
	reply: FastifyReply
) => {
	const service = new InvoicesService(request.db, request.cache);
	const invoice = await service.getById(request.params.id);

	if (!invoice) {
		return reply.status(404).send({ error: "Invoice not found" });
	}

	// Default template configuration
	const defaultTemplate = {
		logo_url: undefined, // Can be configured later
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

	// Map line items
	const lineItems = (invoice.items || []).map((item) => ({
		name: item.description || "Product / Service",
		price: Number(item.unitPrice),
		quantity: Number(item.quantity),
		vat: item.vatRate ? Number(item.vatRate) : undefined,
		unit: item.unit || undefined,
		discountRate: item.discountRate ? Number(item.discountRate) : undefined,
	}));

	// Create editor content for various fields
	const fromDetails = createEditorContent(
		`Your Company\ninfo@yourcompany.com\n+381 60 000 0000\nAddress line\nVAT ID: —`
	);

	const customerDetails = createEditorContent(
		`${invoice.customerName}\n${invoice.customerEmail || ""}\n${invoice.billingAddress || ""}\nVAT ID: —`
	);

	const paymentDetails = createEditorContent("Bank: — | Account number: — | IBAN: —");

	// Handle notes - can be JSON (Tiptap format) or string (backward compatibility)
	const noteDetails = invoice.notes
		? (typeof invoice.notes === "object"
			? (invoice.notes as JSON)
			: createEditorContent(String(invoice.notes)))
		: undefined;

	// Transform invoice data to PDF props format
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

	try {
		const pdfStream = await renderInvoiceToStream(pdfProps);

		reply.header("Content-Type", "application/pdf");
		reply.header(
			"Content-Disposition",
			`attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
		);

		// Convert ReadableStream to Node.js Readable stream
		const reader = pdfStream.getReader();
		const nodeStream = new (await import("stream")).Readable({
			async read() {
				const { done, value } = await reader.read();
				if (done) {
					this.push(null);
				} else {
					this.push(Buffer.from(value));
				}
			},
		});

		return reply.send(nodeStream);
	} catch (error) {
		console.error("PDF generation error:", error);
		return reply.status(500).send({
			error: "PDF generation failed",
			message: error instanceof Error ? error.message : "Unknown error"
		});
	}
};

export const exportQuotePDFHandler = async (
	request: ExportQuotePDFParams,
	reply: FastifyReply
) => {
	const service = new QuotesService(request.db, request.cache);
	const id = Number.parseInt(request.params.id, 10);

	if (Number.isNaN(id)) {
		return reply.status(400).send({ error: "Invalid quote ID" });
	}

	const quote = await service.getById(id);

	if (!quote) {
		return reply.status(404).send({ error: "Quote not found" });
	}

	// Transform quote data to PDF format
	const pdfData: QuotePDFData = {
		quoteNumber: quote.quoteNumber,
		quoteDate: quote.issueDate,
		validUntil: quote.expiryDate ?? quote.issueDate,
		items: (quote.items ?? []).map((item) => ({
			description: item.description ?? "",
			quantity: item.quantity,
			unitPrice: Number(item.unitPrice),
			total: Number(item.total)
		})),
		subtotal: Number(quote.subtotal),
		tax: Number(quote.tax),
		total: Number(quote.total),
		currency: quote.currency,
		notes: quote.notes ?? undefined
	};

	try {
		const pdfStream = await pdfService.generateQuotePDF(pdfData, {
			title: `Quote ${quote.quoteNumber}`
		});

		reply.header("Content-Type", "application/pdf");
		reply.header(
			"Content-Disposition",
			`attachment; filename="quote-${quote.quoteNumber}.pdf"`
		);

		return reply.send(pdfStream);
	} catch (error) {
		if ((error as Error).message.includes("PDFKit is not installed")) {
			return reply.status(503).send({
				error: "PDF export is not available",
				message: "Please install pdfkit: bun add pdfkit @types/pdfkit"
			});
		}
		throw error;
	}
};

