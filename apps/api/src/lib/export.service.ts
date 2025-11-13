/**
 * Export service for generating CSV files from data
 */

export interface ExportOptions {
	headers?: string[];
	delimiter?: string;
	includeHeaders?: boolean;
}

export class ExportService {
	/**
	 * Convert array of objects to CSV string
	 */
	toCSV<T extends Record<string, unknown>>(
		data: T[],
		options: ExportOptions = {}
	): string {
		const {
			headers,
			delimiter = ",",
			includeHeaders = true
		} = options;

		if (data.length === 0) {
			return "";
		}

		// Determine headers
		const csvHeaders = headers ?? Object.keys(data[0] ?? {});

		// Escape CSV values
		const escapeCSV = (value: unknown): string => {
			if (value === null || value === undefined) {
				return "";
			}

			const stringValue = String(value);
			// If value contains delimiter, newline, or quote, wrap in quotes and escape quotes
			if (stringValue.includes(delimiter) || stringValue.includes("\n") || stringValue.includes('"')) {
				return `"${stringValue.replace(/"/g, '""')}"`;
			}

			return stringValue;
		};

		const lines: string[] = [];

		// Add header row
		if (includeHeaders) {
			lines.push(csvHeaders.map(escapeCSV).join(delimiter));
		}

		// Add data rows
		for (const row of data) {
			const values = csvHeaders.map((header) => {
				const value = row[header];
				// Handle nested objects/arrays
				if (typeof value === "object" && value !== null) {
					if (Array.isArray(value)) {
						return value.map(String).join("; ");
					}
					return JSON.stringify(value);
				}
				return value;
			});
			lines.push(values.map(escapeCSV).join(delimiter));
		}

		return lines.join("\n");
	}

	/**
	 * Format date for CSV export
	 */
	formatDate(date: string | Date | null | undefined): string {
		if (!date) {
			return "";
		}

		const d = typeof date === "string" ? new Date(date) : date;
		if (Number.isNaN(d.getTime())) {
			return "";
		}

		return d.toISOString().split("T")[0];
	}

	/**
	 * Format number for CSV export
	 */
	formatNumber(value: number | string | null | undefined, decimals = 2): string {
		if (value === null || value === undefined) {
			return "";
		}

		const num = typeof value === "string" ? Number.parseFloat(value) : value;
		if (Number.isNaN(num)) {
			return "";
		}

		return num.toFixed(decimals);
	}

	/**
	 * Format currency for CSV export
	 */
	formatCurrency(value: number | string | null | undefined, currency = "USD"): string {
		if (value === null || value === undefined) {
			return "";
		}

		const num = typeof value === "string" ? Number.parseFloat(value) : value;
		if (Number.isNaN(num)) {
			return "";
		}

		return `${currency} ${num.toFixed(2)}`;
	}
}

export const exportService = new ExportService();

