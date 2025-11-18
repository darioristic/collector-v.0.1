/**
 * Summary component for PDF (totals, VAT, etc.)
 */

import { StyleSheet, Text, View } from "@react-pdf/renderer";
import React from "react";
import type { LineItem } from "./types";

const styles = StyleSheet.create({
	container: {
		marginTop: 20,
		marginBottom: 20,
		alignItems: "flex-end",
	},
	summaryBox: {
		width: 300,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 6,
		borderBottomWidth: 0.5,
		borderBottomColor: "#e5e5e5",
		fontSize: 11,
	},
	label: {
		color: "#878787",
	},
	value: {},
	totalRow: {
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: "#000",
	},
	totalLabel: {
		fontSize: 14,
		fontWeight: "bold",
	},
	totalValue: {
		fontSize: 20,
		fontWeight: "bold",
	},
	discountValue: {
		color: "#dc2626",
	},
});

interface SummaryProps {
	includeVAT?: boolean;
	includeTax?: boolean;
	taxRate?: number;
	currency: string;
	vatLabel: string;
	taxLabel?: string;
	totalLabel: string;
	lineItems: LineItem[];
	amountBeforeDiscount: number;
	discountTotal: number;
	subtotal: number;
	totalVat: number;
	total: number;
}

function formatCurrency(amount: number, currency: string): string {
	try {
		const formatted = new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
		return formatted.replace(/\s+/g, " ").trim();
	} catch {
		const fixed = amount.toFixed(2);
		return `${fixed} ${currency}`;
	}
}

// Calculate average VAT rate
function calculateAverageVatRate(
	lineItems: LineItem[],
	subtotal: number,
	includeVAT: boolean,
): number {
	if (!includeVAT || subtotal <= 0 || lineItems.length === 0) {
		return 0;
	}

	const itemsWithSubtotal = lineItems.filter(
		(item) => item.price > 0 && item.quantity > 0 && (item.vat || 0) > 0,
	);

	if (itemsWithSubtotal.length === 0) {
		return 0;
	}

	const weightedSum = itemsWithSubtotal.reduce((sum, item) => {
		const itemTotal = item.price * item.quantity;
		const discountAmount = itemTotal * ((item.discountRate || 0) / 100);
		const itemSubtotal = itemTotal - discountAmount;
		const vatRate = item.vat || 0;
		return sum + vatRate * itemSubtotal;
	}, 0);

	return weightedSum / subtotal;
}

export function Summary({
	includeVAT = false,
	includeTax = false,
	taxRate = 0,
	currency,
	vatLabel,
	taxLabel,
	totalLabel,
	lineItems,
	amountBeforeDiscount,
	discountTotal,
	subtotal,
	totalVat,
	total,
}: SummaryProps) {
	const averageVatRate = calculateAverageVatRate(
		lineItems,
		subtotal,
		includeVAT,
	);

	return (
		<View style={styles.container}>
			<View style={styles.summaryBox}>
				<View style={styles.row}>
					<Text style={styles.label}>Amount before discount:</Text>
					<Text style={styles.value}>
						{formatCurrency(amountBeforeDiscount, currency)}
					</Text>
				</View>

				{discountTotal > 0 && (
					<View style={styles.row}>
						<Text style={styles.label}>Discount:</Text>
						<Text style={[styles.value, styles.discountValue]}>
							-{formatCurrency(discountTotal, currency)}
						</Text>
					</View>
				)}

				<View style={styles.row}>
					<Text style={styles.label}>Subtotal:</Text>
					<Text style={styles.value}>{formatCurrency(subtotal, currency)}</Text>
				</View>

				{includeVAT && (
					<View style={styles.row}>
						<Text style={styles.label}>
							{vatLabel}
							{averageVatRate > 0 ? ` (${Math.round(averageVatRate)}%)` : ""}:
						</Text>
						<Text style={styles.value}>
							{formatCurrency(totalVat, currency)}
						</Text>
					</View>
				)}

				{includeTax && taxRate > 0 && taxLabel && (
					<View style={styles.row}>
						<Text style={styles.label}>{taxLabel}:</Text>
						<Text style={styles.value}>
							{formatCurrency((subtotal * taxRate) / 100, currency)}
						</Text>
					</View>
				)}

				<View style={[styles.row, styles.totalRow]}>
					<Text style={styles.totalLabel}>{totalLabel}</Text>
					<Text style={styles.totalValue}>
						{formatCurrency(total, currency)}
					</Text>
				</View>
			</View>
		</View>
	);
}
