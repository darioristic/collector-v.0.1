import { type NextRequest, NextResponse } from "next/server";
import {
	renderInvoiceToBuffer,
	renderInvoiceToStream,
} from "@/lib/invoice-pdf/renderer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type {
	EditorDoc,
	EditorInlineContent,
	EditorNode,
	InvoicePDFProps,
} from "@/lib/invoice-pdf/types";
import { isUuid } from "@/lib/utils";
import { fetchInvoice } from "@/src/queries/invoices";

function sanitizeEditorDoc(input: unknown): EditorDoc {
	if (!input || typeof input !== "object") {
		return { type: "doc", content: [] };
	}
	const d = input as { content?: unknown };
	const contentArr = Array.isArray(d.content) ? d.content : [];
	const sanitizedNodes = contentArr
		.filter((n) => n && typeof n === "object")
		.map((n: EditorNode) => {
			const nodeType = typeof n.type === "string" ? n.type : "paragraph";
			const inlineArr = Array.isArray(n.content) ? n.content : [];
			const sanitizedInline = inlineArr
				.filter((ic) => ic && typeof ic === "object")
				.map((ic: EditorInlineContent) => ({
					type: typeof ic.type === "string" ? ic.type : "text",
					text: typeof ic.text === "string" ? ic.text : undefined,
					marks: Array.isArray(ic.marks)
						? ic.marks.filter((m: unknown) => m && typeof m === "object")
						: undefined,
					attrs:
						ic.attrs && typeof ic.attrs === "object" ? ic.attrs : undefined,
				}));
			return { type: nodeType, content: sanitizedInline };
		});
	return { type: "doc", content: sanitizedNodes };
}

function docToString(input: unknown): string {
	try {
		const d = input as {
			content?: Array<{ content?: Array<{ text?: string }> }>;
		};
		const paras = Array.isArray(d?.content) ? d.content : [];
		return paras
			.map((p) =>
				Array.isArray(p?.content)
					? p!.content!.map((n) => n.text ?? "").join("")
					: "",
			)
			.join("\n");
	} catch {
		return typeof input === "string" ? input : "";
	}
}

function hardMinimalPdf(): Uint8Array {
	const base64 =
		"JVBERi0xLjQKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHMgWzMgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdPj4KZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDYwIDAwMDAwIG4gCjAwMDAwMDAxMjAgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxNjYKJSVFT0YK";
	return new Uint8Array(Buffer.from(base64, "base64"));
}

async function softA4Pdf(title?: string): Promise<Uint8Array | null> {
	try {
		// @ts-expect-error runtime optional dependency
		const PDFDocument = (await import("pdfkit")).default;
		const doc = new PDFDocument({ size: "A4", margin: 40 });
		const chunks: Buffer[] = [];
		return await new Promise<Uint8Array>((resolve) => {
			doc.on("data", (chunk: Buffer) => chunks.push(chunk));
			doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
			doc.fontSize(14).text(title || "Invoice PDF", { align: "left" });
			doc.moveDown();
			doc.fontSize(10).text("This is a minimal A4 PDF fallback.");
			doc.end();
		});
	} catch {
		return null;
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as {
			invoiceId?: string;
			props?: InvoicePDFProps;
		};

		if (body.invoiceId) {
			// Fetch invoice by ID
			const invoice = await fetchInvoice(body.invoiceId);

			if (!invoice) {
				return NextResponse.json(
					{ error: "Invoice not found" },
					{ status: 404 },
				);
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

			const createEditorContent = (
				text: string | null | undefined,
			): EditorDoc | undefined => {
				if (!text) {
					return { type: "doc", content: [] };
				}
				const doc: EditorDoc = {
					type: "doc",
					content: [
						{
							type: "paragraph",
							content: [{ type: "text", text: text }],
						},
					],
				};
				return doc;
			};

			const fromDetails = createEditorContent(
				`Your Company\ninfo@yourcompany.com\n+381 60 000 0000\nAddress line\nVAT ID: —`,
			);

			const customerDetails = createEditorContent(
				`${invoice.customerName}\n${invoice.customerEmail || ""}\n${invoice.billingAddress || ""}\nVAT ID: —`,
			);

			const paymentDetails = createEditorContent(
				"Bank: — | Account number: — | IBAN: —",
			);

			const notePlain =
				invoice.notes && typeof invoice.notes === "object"
					? docToString(invoice.notes)
					: invoice.notes
						? String(invoice.notes)
						: "";
			const noteDetails = sanitizeEditorDoc(createEditorContent(notePlain));

			const pdfProps: InvoicePDFProps = {
				invoice_number: invoice.invoiceNumber,
				issue_date: invoice.issuedAt,
				due_date: invoice.dueDate ?? null,
				template: defaultTemplate,
				line_items: lineItems,
				customer_details: sanitizeEditorDoc(customerDetails),
				from_details: sanitizeEditorDoc(fromDetails),
				payment_details: sanitizeEditorDoc(paymentDetails),
				note_details: noteDetails,
				currency: invoice.currency,
				customer_name: invoice.customerName,
				amountBeforeDiscount: Number(invoice.amountBeforeDiscount),
				discountTotal: Number(invoice.discountTotal),
				subtotal: Number(invoice.subtotal),
				totalVat: Number(invoice.totalVat),
				total: Number(invoice.total),
			};

			{
				const preview = new URL(req.url).searchParams.get("preview") === "true";
				const headers: Record<string, string> = {
					"Content-Type": "application/pdf",
					"Cache-Control": "no-store, max-age=0",
					"X-PDF-Mode": "full",
				};
				if (!preview) {
					headers["Content-Disposition"] =
						`attachment; filename="${invoice.invoiceNumber}.pdf"`;
				}
				try {
					const stream = await renderInvoiceToStream(pdfProps);
					return new Response(stream, { headers });
				} catch (e) {
					try {
						const safeProps: InvoicePDFProps = {
							...pdfProps,
							note_details: undefined,
							payment_details: undefined,
						};
						const buffer = await renderInvoiceToBuffer(safeProps);
						return new Response(buffer, { headers });
					} catch (ee) {
						const buffer = hardMinimalPdf();
						return new Response(buffer, { headers });
					}
				}
			}
		} else if (body.props) {
			// Use provided props directly
			{
				const headers: Record<string, string> = {
					"Content-Type": "application/pdf",
					"Cache-Control": "no-store, max-age=0",
					"X-PDF-Mode": "full",
				};
				try {
					const stream = await renderInvoiceToStream(body.props);
					return new Response(stream, { headers });
				} catch (e) {
					try {
						const safeProps: InvoicePDFProps = {
							...body.props,
							note_details: undefined,
							payment_details: undefined,
						};
						const buffer = await renderInvoiceToBuffer(safeProps);
						return new Response(buffer, { headers });
					} catch (ee) {
						const buffer = hardMinimalPdf();
						return new Response(buffer, { headers });
					}
				}
			}
		} else {
			return NextResponse.json(
				{ error: "Either invoiceId or props must be provided" },
				{ status: 400 },
			);
		}
	} catch (error) {
		console.error("PDF generation error:", error);
		const buffer = hardMinimalPdf();
		return new Response(buffer, {
			headers: {
				"Content-Type": "application/pdf",
				"Cache-Control": "no-store, max-age=0",
			},
		});
	}
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get("id") || searchParams.get("invoiceId");
		if (!id) {
			return NextResponse.json(
				{ error: "Missing invoice id" },
				{ status: 400 },
			);
		}
		// Try upstream API PDF first for reliability
		const API_URL = process.env.API_URL || "http://localhost:4000";
		try {
			const upstream = await fetch(`${API_URL}/api/sales/invoices/${id}/pdf`, {
				method: "GET",
			});
			if (upstream.ok && upstream.body) {
				const headers = new Headers(upstream.headers);
				if (!headers.has("Content-Type"))
					headers.set("Content-Type", "application/pdf");
				if (!headers.has("Cache-Control"))
					headers.set("Cache-Control", "no-store, max-age=0");
				return new Response(upstream.body, {
					status: upstream.status,
					headers,
				});
			}
		} catch (e) {
			console.error("Upstream invoice PDF fetch failed", e);
		}
		if (!isUuid(id)) {
			return NextResponse.json(
				{ error: "Invalid invoice id format" },
				{ status: 400 },
			);
		}
		const invoice = await fetchInvoice(id);
		if (!invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}
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
		const createEditorContent = (text?: string): EditorDoc => {
			const t = text ?? "";
			const lines = t.split("\n");
			return {
				type: "doc",
				content: lines.map((line) => ({
					type: "paragraph",
					content: line ? [{ type: "text", text: line }] : [],
				})),
			};
		};
		const fromDetails = createEditorContent(
			"Your Company\ninfo@yourcompany.com\n+381 60 000 0000\nAddress line\nVAT ID: —",
		);
		const customerDetails = createEditorContent(
			`${invoice.customerName}\n${invoice.customerEmail || ""}\n${invoice.billingAddress || ""}\nVAT ID: —`,
		);
		const paymentDetails = createEditorContent(
			"Bank: — | Account number: — | IBAN: —",
		);
		const notePlain =
			invoice.notes && typeof invoice.notes === "object"
				? docToString(invoice.notes)
				: invoice.notes
					? String(invoice.notes)
					: "";
		const noteDetails = sanitizeEditorDoc(createEditorContent(notePlain));
		const pdfProps: InvoicePDFProps = {
			invoice_number: invoice.invoiceNumber,
			issue_date: invoice.issuedAt,
			due_date: invoice.dueDate ?? null,
			template: defaultTemplate,
			line_items: lineItems,
			customer_details: sanitizeEditorDoc(customerDetails),
			from_details: sanitizeEditorDoc(fromDetails),
			payment_details: sanitizeEditorDoc(paymentDetails),
			note_details: noteDetails,
			currency: invoice.currency,
			customer_name: invoice.customerName,
			amountBeforeDiscount: Number(invoice.amountBeforeDiscount),
			discountTotal: Number(invoice.discountTotal),
			subtotal: Number(invoice.subtotal),
			totalVat: Number(invoice.totalVat),
			total: Number(invoice.total),
		};
		const preview = new URL(req.url).searchParams.get("preview") === "true";
		const headers: Record<string, string> = {
			"Content-Type": "application/pdf",
			"Cache-Control": "no-store, max-age=0",
			"X-PDF-Mode": "full",
		};
		if (!preview) {
			headers["Content-Disposition"] =
				`attachment; filename="${invoice.invoiceNumber}.pdf"`;
		}
		try {
			const stream = await renderInvoiceToStream(pdfProps);
			return new Response(stream, { headers });
		} catch (e) {
			console.error("PDF stream render failed (GET)", e);
			try {
				const safeProps: InvoicePDFProps = {
					...pdfProps,
					note_details: undefined,
					payment_details: undefined,
				};
				const buffer = await renderInvoiceToBuffer(safeProps);
				return new Response(buffer, { headers });
			} catch (ee) {
				console.error("PDF buffer render failed with safe props (GET)", ee);
				const { renderMinimalToBuffer } = await import(
					"@/lib/invoice-pdf/renderer"
				);
				const msg =
					`PDF error: ${String(e ?? "unknown")} | ${String(ee ?? "unknown")}`.slice(
						0,
						160,
					);
				const buffer = await renderMinimalToBuffer(msg);
				return new Response(buffer, { headers });
			}
		}
	} catch (error) {
		console.error("PDF GET generation error (outer):", error);
		const title =
			typeof error === "object" && error ? "Invoice PDF Error" : undefined;
		const soft = await softA4Pdf(title);
		const buffer = soft ?? hardMinimalPdf();
		return new Response(buffer, {
			headers: {
				"Content-Type": "application/pdf",
				"Cache-Control": "no-store, max-age=0",
			},
		});
	}
}
