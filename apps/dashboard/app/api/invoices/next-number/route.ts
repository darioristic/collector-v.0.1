import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/db/schema/invoices";
import { desc, sql } from "drizzle-orm";
import { getCurrentAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const auth = await getCurrentAuth();
		if (!auth?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const db = await getDb();
		
		// Get the latest invoice number for the user's company
		// This is a simplified version - you may want to implement a more sophisticated numbering system
		const latestInvoice = await db
			.select({
				invoiceNumber: invoices.invoiceNumber,
			})
			.from(invoices)
			.orderBy(desc(invoices.createdAt))
			.limit(1);

		let nextNumber: string;
		if (latestInvoice.length > 0 && latestInvoice[0]?.invoiceNumber) {
			// Extract number from invoice number (assuming format like INV-001, INV-002, etc.)
			const match = latestInvoice[0].invoiceNumber.match(/(\d+)$/);
			if (match) {
				const num = parseInt(match[1], 10);
				nextNumber = `INV-${String(num + 1).padStart(3, "0")}`;
			} else {
				// Fallback: use timestamp
				nextNumber = `INV-${Date.now()}`;
			}
		} else {
			// First invoice
			nextNumber = "INV-001";
		}

		return NextResponse.json({ number: nextNumber });
	} catch (error) {
		console.error("Failed to generate invoice number:", error);
		// Fallback to timestamp-based number
		return NextResponse.json({ number: `INV-${Date.now()}` });
	}
}

