/**
 * Line items table component for PDF
 */

import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import type { LineItem } from "./types";

const styles = StyleSheet.create({
	table: {
		marginTop: 20,
		marginBottom: 20,
	},
	header: {
		flexDirection: "row",
		borderBottomWidth: 0.5,
		borderBottomColor: "#e5e5e5",
		paddingBottom: 8,
		marginBottom: 8,
	},
	headerCell: {
		fontSize: 9,
		color: "#878787",
	},
	row: {
		flexDirection: "row",
		paddingVertical: 4,
		borderBottomWidth: 0.5,
		borderBottomColor: "#e5e5e5",
	},
	cell: {
		fontSize: 11,
	},
	cellRight: {
		textAlign: "right",
	},
	description: {
		flex: 2,
	},
  quantity: {
    width: 56,
  },
  unit: {
    width: 60,
  },
  price: {
    width: 80,
  },
  discPercent: {
    width: 60,
  },
  vatPercent: {
    width: 60,
  },
  total: {
    width: 100,
  },
});

interface LineItemsProps {
	lineItems: LineItem[];
	currency: string;
	descriptionLabel: string;
	quantityLabel: string;
	priceLabel: string;
	totalLabel: string;
	includeVAT?: boolean;
}

function formatNumber(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function LineItems({
	lineItems,
	currency: _currency,
	descriptionLabel,
	quantityLabel,
	priceLabel,
	totalLabel,
	includeVAT = false,
}: LineItemsProps) {
	return (
		<View style={styles.table}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={[styles.headerCell, styles.description]}>{descriptionLabel}</Text>
				<Text style={[styles.headerCell, styles.quantity, styles.cellRight]}>{quantityLabel}</Text>
				<Text style={[styles.headerCell, styles.unit, styles.cellRight]}>Unit</Text>
				<Text style={[styles.headerCell, styles.price, styles.cellRight]}>{priceLabel}</Text>
				{includeVAT && (
					<>
						<Text style={[styles.headerCell, styles.discPercent, styles.cellRight]}>Disc %</Text>
						<Text style={[styles.headerCell, styles.vatPercent, styles.cellRight]}>VAT %</Text>
					</>
				)}
				<Text style={[styles.headerCell, styles.total, styles.cellRight]}>{totalLabel}</Text>
			</View>

			{/* Rows */}
			{lineItems.map((item, index) => {
				const itemSubtotal = item.price * item.quantity;
				const discountAmount = itemSubtotal * ((item.discountRate || 0) / 100);
				const itemAfterDiscount = itemSubtotal - discountAmount;
				const vatAmount = itemAfterDiscount * ((item.vat || 0) / 100);
				const itemTotal = includeVAT ? itemAfterDiscount + vatAmount : itemAfterDiscount;

				return (
					<View key={`item-${index}`} style={styles.row}>
						<Text style={[styles.cell, styles.description]}>{item.name}</Text>
						<Text style={[styles.cell, styles.quantity, styles.cellRight]}>{item.quantity}</Text>
						<Text style={[styles.cell, styles.unit, styles.cellRight]}>{item.unit || "—"}</Text>
						<Text style={[styles.cell, styles.price, styles.cellRight]}>
							{formatNumber(item.price)}
						</Text>
						{includeVAT && (
							<>
								<Text style={[styles.cell, styles.discPercent, styles.cellRight]}>
									{item.discountRate ? `${item.discountRate}%` : "—"}
								</Text>
								<Text style={[styles.cell, styles.vatPercent, styles.cellRight]}>
									{item.vat ? `${item.vat}%` : "—"}
								</Text>
							</>
						)}
						<Text style={[styles.cell, styles.total, styles.cellRight]}>
							{formatNumber(itemTotal)}
						</Text>
					</View>
				);
			})}
		</View>
	);
}
