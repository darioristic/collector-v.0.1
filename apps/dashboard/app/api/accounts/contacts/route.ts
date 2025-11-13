import { type NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.COLLECTOR_API_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
	try {
		const url = `${API_BASE_URL}/api/accounts/contacts`;

		// Prosleđujemo cookies i headers iz originalnog zahteva
		const headers: HeadersInit = {
			"Content-Type": "application/json",
		};

		// Prosleđujemo cookie header ako postoji
		const cookie = request.headers.get("cookie");
		if (cookie) {
			headers["Cookie"] = cookie;
		}

		// Prosleđujemo authorization header ako postoji
		const authorization = request.headers.get("authorization");
		if (authorization) {
			headers["Authorization"] = authorization;
		}

		const response = await fetch(url, {
			method: "GET",
			headers,
			cache: "no-store",
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => "Unknown error");
			console.error(`[accounts/contacts] API error:`, {
				status: response.status,
				statusText: response.statusText,
				error: errorText,
			});
			return NextResponse.json(
				{ error: errorText || "Failed to fetch contacts" },
				{ status: response.status },
			);
		}

		const data = await response.json();
		return NextResponse.json(data, {
			headers: {
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error(`[accounts/contacts] Error fetching contacts:`, error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Internal server error",
			},
			{ status: 500 },
		);
	}
}

