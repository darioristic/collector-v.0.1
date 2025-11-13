/**
 * PDF export service for generating PDF documents
 * 
 * Requires: bun add pdfkit @types/pdfkit
 */

import type { Readable } from "stream";

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
	subtotal: number;
	tax: number;
	total: number;
	currency: string;
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

			// Header
			doc.fontSize(20).text("INVOICE", { align: "center" });
			doc.moveDown();

			// Invoice details
			doc.fontSize(fontSize);
			doc.text(`Invoice Number: ${data.invoiceNumber}`);
			doc.text(`Invoice Date: ${this.formatDate(data.invoiceDate)}`);
			doc.text(`Due Date: ${this.formatDate(data.dueDate)}`);
			doc.moveDown();

			// Company and billing info
			if (data.companyName) {
				doc.text(`Bill To: ${data.companyName}`);
				if (data.billingAddress) {
					doc.text(data.billingAddress, { indent: 20 });
				}
				doc.moveDown();
			}

			// Items table
			doc.fontSize(fontSize + 2).text("Items", { underline: true });
			doc.moveDown(0.5);
			doc.fontSize(fontSize);

			// Table header
			const tableTop = doc.y;
			doc.text("Description", 50, tableTop);
			doc.text("Qty", 300, tableTop);
			doc.text("Unit Price", 350, tableTop);
			doc.text("Total", 450, tableTop, { align: "right" });
			doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
			doc.moveDown();

			// Items
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
				align: "right",
				bold: true
			});

			// Notes
			if (data.notes) {
				doc.moveDown(2);
				doc.fontSize(fontSize);
				doc.text("Notes:", { underline: true });
				doc.text(data.notes, { indent: 20 });
			}

			doc.end();
			return doc as unknown as Readable;
		} catch (error) {
			// If pdfkit is not installed, throw helpful error
			if ((error as any)?.code === "MODULE_NOT_FOUND") {
				throw new Error(
					"PDFKit is not installed. Please run: bun add pdfkit @types/pdfkit"
				);
			}
			throw error;
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
				align: "right",
				bold: true
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
			if ((error as any)?.code === "MODULE_NOT_FOUND") {
				throw new Error("PDFKit is not installed. Please run: bun add pdfkit @types/pdfkit");
			}
			throw error;
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
			if ((error as any)?.code === "MODULE_NOT_FOUND") {
				throw new Error("PDFKit is not installed. Please run: bun add pdfkit @types/pdfkit");
			}
			throw error;
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
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency
		}).format(value);
	}
}

export const pdfService = new PDFService();

