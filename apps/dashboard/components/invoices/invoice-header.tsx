import { InvoiceSearchFilter } from "./invoice-search-filter";
import { OpenInvoiceSheet } from "./open-invoice-sheet";

async function getCustomers() {
	try {
		const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
		const response = await fetch(`${API_URL}/api/accounts/companies`, {
			cache: "no-store",
		});

		if (!response.ok) {
			return { data: [] };
		}

		const data = await response.json();
		return { data: data.data || [] };
	} catch (error) {
		console.error("Failed to fetch customers:", error);
		return { data: [] };
	}
}

export async function InvoiceHeader() {
	const customers = await getCustomers();

	return (
		<div className="flex items-center justify-between">
			<InvoiceSearchFilter customers={customers?.data ?? []} />

			<div>
				<OpenInvoiceSheet />
			</div>
		</div>
	);
}
