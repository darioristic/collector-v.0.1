/**
 * Invoice PDF Template using @react-pdf/renderer
 * This component structure mirrors the HTML template for consistency
 */

import React from "react";
import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import type { InvoicePDFProps } from "./types";
import { EditorContent } from "./editor-content";
import { LineItems } from "./line-items";
import { Meta } from "./meta";
import { Summary } from "./summary";

// Define styles
const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontFamily: "Helvetica",
		fontSize: 11,
	},
	container: {
		flex: 1,
		flexDirection: "column",
	},
	header: {
		marginBottom: 20,
	},
	logo: {
		width: 120,
		height: 40,
		marginBottom: 20,
	},
	section: {
		marginBottom: 20,
	},
	grid: {
		flexDirection: "row",
		marginBottom: 20,
	},
	gridColumn: {
		flex: 1,
		marginRight: 20,
	},
	label: {
		fontSize: 9,
		color: "#878787",
		marginBottom: 4,
		fontFamily: "Courier",
	},
	text: {
		fontSize: 11,
		fontFamily: "Courier",
		lineHeight: 1.4,
	},
	footer: {
		marginTop: "auto",
		paddingTop: 20,
		borderTopWidth: 0.5,
		borderTopColor: "#e5e5e5",
	},
});

export function InvoiceTemplate({
	invoice_number,
	issue_date,
	due_date,
	template,
	line_items,
	customer_details,
	from_details,
	payment_details,
	note_details,
	currency,
	customer_name: _customer_name,
	amountBeforeDiscount = 0,
	discountTotal = 0,
	subtotal = 0,
	totalVat = 0,
	total = 0,
}: InvoicePDFProps) {
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.container}>
					{/* Logo */}
					{template.logo_url && (
						<View style={styles.header}>
							<Image src={template.logo_url} style={styles.logo} />
						</View>
					)}

					{/* Meta Information */}
					<View style={styles.section}>
						<Meta
							template={template}
							invoiceNumber={invoice_number}
							issueDate={issue_date}
							dueDate={due_date}
						/>
					</View>

					{/* From and To */}
					<View style={styles.grid}>
						<View style={styles.gridColumn}>
							<Text style={styles.label}>{template.from_label}</Text>
							<EditorContent content={from_details} />
						</View>
						<View style={styles.gridColumn}>
							<Text style={styles.label}>{template.customer_label}</Text>
							<EditorContent content={customer_details} />
						</View>
					</View>

					{/* Line Items */}
					<View style={styles.section}>
						<LineItems
							lineItems={line_items}
							currency={currency}
							descriptionLabel={template.description_label}
							quantityLabel={template.quantity_label}
							priceLabel={template.price_label}
							totalLabel={template.total_label}
							includeVAT={template.include_vat}
						/>
					</View>

					{/* Summary */}
					<View style={styles.section}>
						<Summary
							includeVAT={template.include_vat}
							includeTax={template.include_tax}
							taxRate={template.tax_rate}
							currency={currency}
							vatLabel={template.vat_label}
							taxLabel={template.tax_label}
							totalLabel={template.total_label}
							lineItems={line_items}
							amountBeforeDiscount={amountBeforeDiscount}
							discountTotal={discountTotal}
							subtotal={subtotal}
							totalVat={totalVat}
							total={total}
						/>
					</View>

					{/* Notes and Payment Details */}
					<View style={styles.footer}>
						{note_details && (
							<View style={styles.section}>
								<Text style={styles.label}>{template.note_label}</Text>
								<EditorContent content={note_details} />
							</View>
						)}
						<View style={styles.section}>
							<EditorContent content={payment_details} />
						</View>
					</View>
				</View>
			</Page>
		</Document>
	);
}

