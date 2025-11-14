import type { FastifyReply, FastifyRequest } from "fastify";
import { InvoicesService } from "./invoices.service";
import { QuotesService } from "./quotes.service";
import { pdfService, type InvoicePDFData, type QuotePDFData } from "../../lib/pdf.service";

type ExportInvoicePDFParams = FastifyRequest<{
	Params: { id: string };
}>;

type ExportQuotePDFParams = FastifyRequest<{
	Params: { id: string };
}>;

export const exportInvoicePDFHandler = async (
	request: ExportInvoicePDFParams,
	reply: FastifyReply
) => {
	const service = new InvoicesService(request.db, request.cache);
	const invoice = await service.getById(request.params.id);

	if (!invoice) {
		return reply.status(404).send({ error: "Invoice not found" });
	}

	// Transform invoice data to PDF format
	const pdfData: InvoicePDFData = {
		invoiceNumber: invoice.invoiceNumber,
		invoiceDate: invoice.issuedAt,
		dueDate: invoice.dueDate ?? invoice.issuedAt,
		items: (invoice.items || []).map((item) => ({
			description: item.description ?? "",
			quantity: item.quantity,
			unitPrice: Number(item.unitPrice),
			total: Number(item.totalInclVat)
		})),
		subtotal: Number(invoice.subtotal),
		tax: Number(invoice.totalVat),
		total: Number(invoice.total),
		currency: invoice.currency,
		notes: invoice.notes ?? undefined
	};

	try {
		const pdfStream = await pdfService.generateInvoicePDF(pdfData, {
			title: `Invoice ${invoice.invoiceNumber}`
		});

		reply.header("Content-Type", "application/pdf");
		reply.header(
			"Content-Disposition",
			`attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
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

