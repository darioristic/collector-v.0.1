import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:4000";

export async function POST(
	request: NextRequest,
	{ params }: { params: { token: string } },
) {
	try {
		const { token } = params;

		// Forward request to backend API
		const response = await fetch(
			`${API_URL}/api/sales/invoices/token/${token}/track`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			const error = await response
				.json()
				.catch(() => ({ error: "Unknown error" }));
			return NextResponse.json(error, { status: response.status });
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error tracking invoice view:", error);
		return NextResponse.json(
			{ error: "Failed to track view" },
			{ status: 500 },
		);
	}
}
