import { type NextRequest, NextResponse } from "next/server";
import { isUuid } from "@/lib/utils";

const API_URL = process.env.API_URL || "http://localhost:4000";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		if (!isUuid(id)) {
			return NextResponse.json(
				{ error: 'params/id must match format "uuid"' },
				{ status: 400 },
			);
		}
		const body = await request.json().catch(() => ({}));

		const response = await fetch(`${API_URL}/api/sales/invoices/${id}/send`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response
				.json()
				.catch(() => ({ error: "Unknown error" }));
			return NextResponse.json(error, { status: response.status });
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error sending invoice:", error);
		return NextResponse.json(
			{ error: "Failed to send invoice" },
			{ status: 500 },
		);
	}
}
