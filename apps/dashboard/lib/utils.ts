import { type ClassValue, clsx } from "clsx";
import type { Metadata } from "next";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function generateAvatarFallback(string: string) {
	const names = string.split(" ").filter((name: string) => name);
	const mapped = names.map((name: string) => name.charAt(0).toUpperCase());

	return mapped.join("");
}

export function generateMeta({
	title,
	description,
	canonical,
}: {
	title: string;
	description: string;
	canonical: string;
}): Metadata {
	return {
		title: title.includes(" - Collector Dashboard") ? title : `${title} - Collector Dashboard`,
		description: description,
		metadataBase: new URL(`https://shadcnuikit.com`),
		alternates: {
			canonical,
		},
		openGraph: {
			images: [`/images/seo.jpg`],
		},
	};
}

// a function to get the first letter of the first and last name of names
export const getInitials = (fullName: string) => {
	const nameParts = fullName.split(" ");
	const firstNameInitial = nameParts[0].charAt(0).toUpperCase();
	const lastNameInitial = nameParts[1].charAt(0).toUpperCase();
	return `${firstNameInitial}${lastNameInitial}`;
};

/**
 * Format a number with proper formatting (no currency symbol)
 */
export function formatNumber(
	amount: number,
): string {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

/**
 * Format a number as currency with proper formatting
 */
export function formatCurrency(
	amount: number,
	currency: string = "USD",
): string {
	const formatted = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
	// Ensure single space between currency and number
	// Replace multiple spaces with single space, and ensure space after currency symbol
	return formatted
		.replace(/\s+/g, " ") // Replace multiple spaces with single space
		.replace(/([A-Z]{3})(\d)/, "$1 $2") // Add space between currency code and number (e.g., RSD123 -> RSD 123)
		.replace(/([€$£¥])(\d)/, "$1 $2") // Add space between currency symbol and number (e.g., €123 -> € 123)
		.trim();
}

/**
 * Format a date string or Date object to DD.MM.YYYY format
 */
export function formatDate(date: string | Date | null | undefined): string {
	if (!date) return "—";
	
	const dateObj = typeof date === "string" ? new Date(date) : date;
	
	if (isNaN(dateObj.getTime())) return "—";
	
	const day = String(dateObj.getDate()).padStart(2, "0");
	const month = String(dateObj.getMonth() + 1).padStart(2, "0");
	const year = dateObj.getFullYear();
	
	return `${day}.${month}.${year}`;
}
