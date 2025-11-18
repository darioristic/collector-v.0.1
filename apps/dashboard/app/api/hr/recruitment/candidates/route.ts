import { type NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.COLLECTOR_API_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams.toString();
		const url = `${API_BASE_URL}/api/hr/recruitment/candidates${searchParams ? `?${searchParams}` : ""}`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			const error = await response.text();
			return NextResponse.json(
				{ error: error || "Failed to fetch candidates" },
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
		console.error("Error fetching candidates:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const url = `${API_BASE_URL}/api/hr/recruitment/candidates`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			return NextResponse.json(
				{ error: error || "Failed to create candidate" },
				{ status: response.status },
			);
		}

		const data = await response.json();
		return NextResponse.json(data, {
			status: 201,
			headers: {
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("Error creating candidate:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
