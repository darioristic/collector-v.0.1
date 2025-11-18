/**
 * PDF rendering service using @react-pdf/renderer
 * Similar to react-email concept - using React components to generate PDFs
 */

import { Document, Page, pdf, renderToStream, Text } from "@react-pdf/renderer";
import { PdfTemplate } from "../../../../packages/templates/pdf/index.tsx";
import type {
	LineItem as PkgLineItem,
	Template,
	TemplateProps,
} from "../../../../packages/templates/types.ts";
import type { InvoicePDFProps } from "./types";

/**
 * Render invoice to PDF stream
 * @param props Invoice data and template configuration
 * @returns Readable stream of PDF data
 */
function mapToTemplateProps(props: InvoicePDFProps): TemplateProps {
	const t = props.template;
	const template: Template = {
		logo_url: t.logo_url,
		from_label: t.from_label,
		customer_label: t.customer_label,
		invoice_no_label: "Invoice No.",
		issue_date_label: "Issue Date",
		due_date_label: "Due Date",
		date_format: "yyyy-MM-dd",
		payment_label: t.payment_label,
		note_label: t.note_label,
		description_label: t.description_label,
		quantity_label: t.quantity_label,
		price_label: t.price_label,
		total_label: t.total_label,
		tax_label: t.tax_label ?? "Tax",
		vat_label: t.vat_label,
	};
	const line_items: PkgLineItem[] = (props.line_items || []).map((li) => ({
		name: li.name,
		quantity: li.quantity,
		price: li.price,
	}));
	return {
		invoice_number: props.invoice_number,
		issue_date: props.issue_date,
		due_date: props.due_date ?? "",
		template,
		line_items,
		customer_details: props.customer_details as unknown as JSON,
		payment_details: props.payment_details as unknown as JSON,
		from_details: props.from_details as unknown as JSON,
		note_details: props.note_details as unknown as JSON,
		currency: props.currency,
		amount: props.total ?? 0,
		customer_name: props.customer_name,
		vat: props.totalVat,
		tax: t.include_tax ? (t.tax_rate ?? 0) : undefined,
		width: 595,
		height: 842,
		size: "a4",
	};
}

export async function renderInvoiceToStream(
	props: InvoicePDFProps,
): Promise<ReadableStream<Uint8Array>> {
	const mapped = mapToTemplateProps(props);
	const document = await PdfTemplate(mapped);
	return (await renderToStream(
		document,
	)) as unknown as ReadableStream<Uint8Array>;
}

/**
 * Render invoice to a Node Buffer (more robust in Node/Next API routes)
 */
export async function renderInvoiceToBuffer(
	props: InvoicePDFProps,
): Promise<Uint8Array> {
	try {
		const mapped = mapToTemplateProps(props);
		const document = await PdfTemplate(mapped);
		const buffer = await pdf(document).toBuffer();
		return new Uint8Array(buffer);
	} catch (err) {
		console.error("renderInvoiceToBuffer error", err);
		throw err;
	}
}

export async function renderMinimalToBuffer(
	message: string,
): Promise<Uint8Array> {
	const doc = (
		<Document>
			<Page size="A4" style={{ padding: 20 }}>
				<Text style={{ fontSize: 12, color: "#000" }}>{message}</Text>
			</Page>
		</Document>
	);
	const buffer = await pdf(doc).toBuffer();
	return new Uint8Array(buffer);
}
