import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:4000";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const response = await fetch(`${API_URL}/api/sales/invoices/${id}`, {
			headers: { "Content-Type": "application/json" },
			cache: "no-store",
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: "Unknown error" }));
			return NextResponse.json(error, { status: response.status });
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching invoice:", error);
		return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const response = await fetch(`${API_URL}/api/sales/invoices/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: "Unknown error" }));
			return NextResponse.json(error, { status: response.status });
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error updating invoice:", error);
		return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
	 const { id } = await params;
		const response = await fetch(`${API_URL}/api/sales/invoices/${id}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: "Unknown error" }));
			return NextResponse.json(error, { status: response.status });
		}

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error("Error deleting invoice:", error);
		return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
	}
}


