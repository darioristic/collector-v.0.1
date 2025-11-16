import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const qs = searchParams.toString();
		const url = `${API_URL}/api/sales/invoices${qs ? `?${qs}` : ""}`;

		const response = await fetch(url, {
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
		console.error("Error listing invoices:", error);
		return NextResponse.json({ error: "Failed to list invoices" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const response = await fetch(`${API_URL}/api/sales/invoices`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: "Unknown error" }));
			return NextResponse.json(error, { status: response.status });
		}

		const data = await response.json();
		return NextResponse.json(data, { status: 201 });
	} catch (error) {
		console.error("Error creating invoice:", error);
		return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
	}
}


