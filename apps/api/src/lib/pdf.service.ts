/**
 * PDF export service for generating PDF documents
 * 
 * Requires: bun add pdfkit @types/pdfkit
 */

import type { Readable } from "stream";
import path from "path";
import { fileURLToPath } from "url";

export interface PDFOptions {
	title?: string;
	author?: string;
	subject?: string;
	margin?: number;
	fontSize?: number;
}

export interface InvoicePDFData {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    companyName?: string;
    companyAddress?: string;
    billingAddress?: string;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    amountBeforeDiscount?: number;
    discountTotal?: number;
    subtotal: number;
    totalVat?: number;
    tax?: number;
    total: number;
    currency: string;
    template?: {
        from_label: string;
        customer_label: string;
        description_label: string;
        quantity_label: string;
        price_label: string;
        total_label: string;
        vat_label: string;
        tax_label?: string;
        payment_label: string;
        note_label: string;
        include_vat?: boolean;
        include_tax?: boolean;
        tax_rate?: number;
        logo_url?: string;
    };
    fromDetails?: string;
    customerDetails?: string;
    paymentDetails?: string;
    notes?: string;
}

export interface QuotePDFData {
	quoteNumber: string;
	quoteDate: string;
	validUntil: string;
	companyName?: string;
	companyAddress?: string;
	billingAddress?: string;
	items: Array<{
		description: string;
		quantity: number;
		unitPrice: number;
		total: number;
	}>;
	subtotal: number;
	tax: number;
	total: number;
	currency: string;
	notes?: string;
}

export interface ProjectReportPDFData {
	projectName: string;
	description?: string;
	status: string;
	ownerName?: string;
	startDate?: string;
	endDate?: string;
	totalTasks: number;
	completedTasks: number;
	budget?: {
		total: number;
		spent: number;
		remaining: number;
		currency: string;
	};
	tasks?: Array<{
		title: string;
		status: string;
		assignee?: string;
		dueDate?: string;
	}>;
}

interface ModuleNotFoundError extends Error {
  code?: string;
}

function isModuleNotFoundError(error: unknown): error is ModuleNotFoundError {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

export class PDFService {
	/**
	 * Generate PDF for invoice
	 * Returns a readable stream
	 */
	async generateInvoicePDF(data: InvoicePDFData, options: PDFOptions = {}): Promise<Readable> {
		try {
			// Dynamic import to avoid requiring pdfkit at build time
			const PDFDocument = (await import("pdfkit")).default;
			const doc = new PDFDocument({
				margin: options.margin ?? 50,
				info: {
					Title: options.title ?? `Invoice ${data.invoiceNumber}`,
					Author: options.author ?? "Collector Dashboard",
					Subject: options.subject ?? "Invoice"
				}
			});

			const fontSize = options.fontSize ?? 12;

			try {
				const currentDir = path.dirname(fileURLToPath(new URL(import.meta.url)));
				const fontBase = path.resolve(
					currentDir,
					"../../dashboard/public/geist-font-1.5.1/fonts/GeistMono/ttf"
				);
				doc.registerFont("GeistMonoRegular", path.join(fontBase, "GeistMono-Regular.ttf"));
				doc.registerFont("GeistMonoBold", path.join(fontBase, "GeistMono-Bold.ttf"));
				doc.font("GeistMonoRegular");
			} catch {
				void 0;
			}

			// Header
			doc.fontSize(20).text("INVOICE", { align: "center" });
			doc.moveDown();

			doc.fontSize(fontSize);
			const labelColor = "#878787";
			const leftX = 50;
			const rightX = 330;
			const colWidth = 220;
			doc.fillColor(labelColor).text("Invoice No:", leftX, doc.y, { continued: true, width: colWidth });
			doc.fillColor("black").text(` ${data.invoiceNumber}`);
			doc.fillColor(labelColor).text("Issue Date:", leftX, doc.y, { continued: true, width: colWidth });
			doc.fillColor("black").text(` ${this.formatDate(data.invoiceDate)}`);
			if (data.dueDate) {
				doc.fillColor(labelColor).text("Due Date:", leftX, doc.y, { continued: true, width: colWidth });
				doc.fillColor("black").text(` ${this.formatDate(data.dueDate)}`);
			}
			doc.moveDown();

			doc.fontSize(fontSize);
			doc.fillColor(labelColor).text(`${data.template?.from_label ?? "From"}`, leftX, doc.y);
			doc.fillColor("black").text(data.fromDetails ?? "—", leftX, doc.y, { width: colWidth });

			doc.fillColor(labelColor).text(`${data.template?.customer_label ?? "Bill To"}`, rightX, doc.y);
			doc.fillColor("black").text(
				data.customerDetails ?? (data.companyName ? `${data.companyName}\n${data.billingAddress ?? ""}` : "—"),
				rightX,
				doc.y,
				{ width: colWidth }
			);
			doc.moveDown();

			doc.fontSize(fontSize + 2).text("Items", { underline: true });
			doc.moveDown(0.5);
			doc.fontSize(fontSize);

			const tableTop = doc.y;
			doc.text(data.template?.description_label ?? "Description", 50, tableTop);
			doc.text(data.template?.quantity_label ?? "Qty", 300, tableTop);
			doc.text(data.template?.price_label ?? "Unit Price", 350, tableTop);
			doc.text(data.template?.total_label ?? "Total", 450, tableTop, { align: "right" });
			doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
			doc.moveDown();

			for (const item of data.items) {
				doc.text(item.description, 50);
				doc.text(item.quantity.toString(), 300);
				doc.text(this.formatCurrency(item.unitPrice, data.currency), 350);
				doc.text(this.formatCurrency(item.total, data.currency), 450, undefined, { align: "right" });
				doc.moveDown();
			}

			doc.moveDown();
			doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
			doc.moveDown();

			const rightBlockX = 300;
			const labelW = 150;
			const valueW = 100;
			doc.fontSize(fontSize);
			doc.fillColor(labelColor).text("Amount before discount:", rightBlockX, doc.y, { width: labelW });
			doc.fillColor("black").text(this.formatCurrency(data.amountBeforeDiscount ?? 0, data.currency), rightBlockX + labelW, doc.y, { width: valueW, align: "right" });
			doc.fillColor(labelColor).text("Discount:", rightBlockX, doc.y, { width: labelW });
			doc.fillColor("black").text(`${data.discountTotal && data.discountTotal > 0 ? "-" : ""}${this.formatCurrency(data.discountTotal ?? 0, data.currency)}`, rightBlockX + labelW, doc.y, { width: valueW, align: "right" });
			doc.fillColor(labelColor).text("Subtotal:", rightBlockX, doc.y, { width: labelW });
			doc.fillColor("black").text(this.formatCurrency(data.subtotal, data.currency), rightBlockX + labelW, doc.y, { width: valueW, align: "right" });
            if (data.template?.include_vat && (data.totalVat ?? 0) > 0) {
                doc.fillColor(labelColor).text(`${data.template.vat_label}:`, rightBlockX, doc.y, { width: labelW });
                doc.fillColor("black").text(this.formatCurrency(data.totalVat ?? 0, data.currency), rightBlockX + labelW, doc.y, { width: valueW, align: "right" });
            }
            if (data.template?.include_tax && (data.tax ?? 0) > 0 && data.template?.tax_label) {
                doc.fillColor(labelColor).text(`${data.template.tax_label}:`, rightBlockX, doc.y, { width: labelW });
                doc.fillColor("black").text(this.formatCurrency(data.tax ?? 0, data.currency), rightBlockX + labelW, doc.y, { width: valueW, align: "right" });
            }
			doc.moveDown(0.5);
			doc.moveTo(rightBlockX, doc.y).lineTo(550, doc.y).stroke();
			doc.fillColor("black").fontSize(fontSize + 2).text(`${data.template?.total_label ?? "Total"}: ${this.formatCurrency(data.total, data.currency)}`, rightBlockX, undefined, { align: "right" });

			doc.moveDown(2);
			doc.fontSize(fontSize);
			doc.fillColor(labelColor).text(`${data.template?.note_label ?? "Note"}`);
			doc.fillColor("black").text(data.notes ?? "—");
			doc.moveDown();
			doc.fillColor(labelColor).text(`${data.template?.payment_label ?? "Payment Details"}`);
			doc.fillColor("black").text(data.paymentDetails ?? "—");

			doc.end();
			return doc as unknown as Readable;
		} catch (error) {
			// If pdfkit is not installed, throw helpful error
			if (isModuleNotFoundError(error) && error.code === "MODULE_NOT_FOUND") {
				throw new Error(
					"PDFKit is not installed. Please run: bun add pdfkit @types/pdfkit"
				);
			}
			throw error instanceof Error ? error : new Error("PDF generation failed");
		}
	}

	/**
	 * Generate PDF for quote
	 */
	async generateQuotePDF(data: QuotePDFData, options: PDFOptions = {}): Promise<Readable> {
		try {
			const PDFDocument = (await import("pdfkit")).default;
			const doc = new PDFDocument({
				margin: options.margin ?? 50,
				info: {
					Title: options.title ?? `Quote ${data.quoteNumber}`,
					Author: options.author ?? "Collector Dashboard",
					Subject: options.subject ?? "Quote"
				}
			});

			const fontSize = options.fontSize ?? 12;

			// Header
			doc.fontSize(20).text("QUOTE", { align: "center" });
			doc.moveDown();

			// Quote details
			doc.fontSize(fontSize);
			doc.text(`Quote Number: ${data.quoteNumber}`);
			doc.text(`Quote Date: ${this.formatDate(data.quoteDate)}`);
			doc.text(`Valid Until: ${this.formatDate(data.validUntil)}`);
			doc.moveDown();

			// Company info
			if (data.companyName) {
				doc.text(`Quote To: ${data.companyName}`);
				if (data.billingAddress) {
					doc.text(data.billingAddress, { indent: 20 });
				}
				doc.moveDown();
			}

			// Items table (similar to invoice)
			doc.fontSize(fontSize + 2).text("Items", { underline: true });
			doc.moveDown(0.5);
			doc.fontSize(fontSize);

			const tableTop = doc.y;
			doc.text("Description", 50, tableTop);
			doc.text("Qty", 300, tableTop);
			doc.text("Unit Price", 350, tableTop);
			doc.text("Total", 450, tableTop, { align: "right" });
			doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
			doc.moveDown();

			for (const item of data.items) {
				doc.text(item.description, 50);
				doc.text(item.quantity.toString(), 300);
				doc.text(this.formatCurrency(item.unitPrice, data.currency), 350);
				doc.text(this.formatCurrency(item.total, data.currency), 450, undefined, { align: "right" });
				doc.moveDown();
			}

			doc.moveDown();
			doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
			doc.moveDown();

			// Totals
			doc.text(`Subtotal: ${this.formatCurrency(data.subtotal, data.currency)}`, 400, undefined, {
				align: "right"
			});
			doc.text(`Tax: ${this.formatCurrency(data.tax, data.currency)}`, 400, undefined, { align: "right" });
			doc.moveDown();
			doc.fontSize(fontSize + 2);
			doc.text(`Total: ${this.formatCurrency(data.total, data.currency)}`, 400, undefined, {
				align: "right"
			});

			if (data.notes) {
				doc.moveDown(2);
				doc.fontSize(fontSize);
				doc.text("Notes:", { underline: true });
				doc.text(data.notes, { indent: 20 });
			}

			doc.end();
			return doc as unknown as Readable;
		} catch (error) {
			if (isModuleNotFoundError(error) && error.code === "MODULE_NOT_FOUND") {
				throw new Error("PDFKit is not installed. Please run: bun add pdfkit @types/pdfkit");
			}
			throw error instanceof Error ? error : new Error("PDF generation failed");
		}
	}

	/**
	 * Generate PDF for project report
	 */
	async generateProjectReportPDF(
		data: ProjectReportPDFData,
		options: PDFOptions = {}
	): Promise<Readable> {
		try {
			const PDFDocument = (await import("pdfkit")).default;
			const doc = new PDFDocument({
				margin: options.margin ?? 50,
				info: {
					Title: options.title ?? `Project Report: ${data.projectName}`,
					Author: options.author ?? "Collector Dashboard",
					Subject: options.subject ?? "Project Report"
				}
			});

			const fontSize = options.fontSize ?? 12;

			// Header
			doc.fontSize(20).text("PROJECT REPORT", { align: "center" });
			doc.moveDown();

			// Project details
			doc.fontSize(fontSize + 4).text(data.projectName, { underline: true });
			doc.moveDown();

			doc.fontSize(fontSize);
			if (data.description) {
				doc.text(`Description: ${data.description}`);
			}
			doc.text(`Status: ${data.status}`);
			if (data.ownerName) {
				doc.text(`Owner: ${data.ownerName}`);
			}
			if (data.startDate) {
				doc.text(`Start Date: ${this.formatDate(data.startDate)}`);
			}
			if (data.endDate) {
				doc.text(`End Date: ${this.formatDate(data.endDate)}`);
			}
			doc.moveDown();

			// Task statistics
			doc.fontSize(fontSize + 2).text("Task Statistics", { underline: true });
			doc.moveDown(0.5);
			doc.fontSize(fontSize);
			doc.text(`Total Tasks: ${data.totalTasks}`);
			doc.text(`Completed Tasks: ${data.completedTasks}`);
			const completionRate =
				data.totalTasks > 0 ? ((data.completedTasks / data.totalTasks) * 100).toFixed(1) : "0";
			doc.text(`Completion Rate: ${completionRate}%`);
			doc.moveDown();

			// Budget
			if (data.budget) {
				doc.fontSize(fontSize + 2).text("Budget", { underline: true });
				doc.moveDown(0.5);
				doc.fontSize(fontSize);
				doc.text(`Total Budget: ${this.formatCurrency(data.budget.total, data.budget.currency)}`);
				doc.text(`Spent: ${this.formatCurrency(data.budget.spent, data.budget.currency)}`);
				doc.text(
					`Remaining: ${this.formatCurrency(data.budget.remaining, data.budget.currency)}`
				);
				doc.moveDown();
			}

			// Tasks list
			if (data.tasks && data.tasks.length > 0) {
				doc.fontSize(fontSize + 2).text("Tasks", { underline: true });
				doc.moveDown(0.5);
				doc.fontSize(fontSize);

				for (const task of data.tasks) {
					doc.text(`• ${task.title} (${task.status})`);
					if (task.assignee) {
						doc.text(`  Assigned to: ${task.assignee}`, { indent: 20 });
					}
					if (task.dueDate) {
						doc.text(`  Due: ${this.formatDate(task.dueDate)}`, { indent: 20 });
					}
					doc.moveDown(0.5);
				}
			}

			doc.end();
			return doc as unknown as Readable;
		} catch (error) {
			if (isModuleNotFoundError(error) && error.code === "MODULE_NOT_FOUND") {
				throw new Error("PDFKit is not installed. Please run: bun add pdfkit @types/pdfkit");
			}
			throw error instanceof Error ? error : new Error("PDF generation failed");
		}
	}

	private formatDate(date: string | Date | null | undefined): string {
		if (!date) {
			return "";
		}

		const d = typeof date === "string" ? new Date(date) : date;
		if (Number.isNaN(d.getTime())) {
			return "";
		}

		return d.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric"
		});
	}

	private formatCurrency(value: number, currency = "USD"): string {
		try {
			const formatted = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(value);
			return formatted
				.replace(/\s+/g, " ")
				.replace(/([A-Z]{3})(\d)/, "$1 $2")
				.replace(/([€$£¥])(\d)/, "$1 $2")
				.trim();
		} catch {
			const fixed = Number.isFinite(value) ? value.toFixed(2) : "0.00";
			return `${fixed} ${currency}`;
		}
	}
}

export const pdfService = new PDFService();
