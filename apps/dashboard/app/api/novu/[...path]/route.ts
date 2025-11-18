import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCurrentAuth } from "@/lib/auth";

const NOVU_API_URL = "https://api.novu.co";

/**
 * Proxy route for Novu API requests
 * This solves CORS issues by proxying requests through Next.js API
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } },
) {
	const auth = await getCurrentAuth();

	if (!auth || !auth.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

    const path = params.path.join("/");
	const searchParams = request.nextUrl.searchParams.toString();
	const url = `${NOVU_API_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;

	try {
		// Forward all headers from the original request
		const headers = new Headers();
		request.headers.forEach((value, key) => {
			// Skip Next.js specific headers
			const lowerKey = key.toLowerCase();
			if (
				lowerKey !== "host" &&
				lowerKey !== "connection" &&
				lowerKey !== "content-length"
			) {
				headers.set(key, value);
			}
		});
		headers.set("Content-Type", "application/json");

		// Add Novu API key if available (for server-side requests)
		if (process.env.NOVU_API_KEY) {
			headers.set("Authorization", `ApiKey ${process.env.NOVU_API_KEY}`);
		}

		const response = await fetch(url, {
			method: "GET",
			headers,
			cache: "no-store",
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => "Unknown error");
			console.error("[novu-proxy] Novu API error (GET)", {
				path,
				url,
				status: response.status,
				statusText: response.statusText,
				error: errorText,
			});
			return NextResponse.json(
				{
					error: "Novu API error",
					message: errorText,
				},
				{ status: response.status },
			);
		}

		const data = await response.json();

		return NextResponse.json(data, {
			status: response.status,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("[novu-proxy] Failed to proxy GET request", {
			path,
			url,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		return NextResponse.json(
			{
				error: "Failed to proxy Novu request",
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } },
) {
	const auth = await getCurrentAuth();

	if (!auth || !auth.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

    const path = params.path.join("/");
	const url = `${NOVU_API_URL}/${path}`;
	const body = await request.json().catch(() => ({}));

	try {
		// Forward all headers from the original request
		const headers = new Headers();
		request.headers.forEach((value, key) => {
			// Skip Next.js specific headers
			const lowerKey = key.toLowerCase();
			if (
				lowerKey !== "host" &&
				lowerKey !== "connection" &&
				lowerKey !== "content-length"
			) {
				headers.set(key, value);
			}
		});
		headers.set("Content-Type", "application/json");

		// Add Novu API key if available
		if (process.env.NOVU_API_KEY) {
			headers.set("Authorization", `ApiKey ${process.env.NOVU_API_KEY}`);
		}

		const response = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
			cache: "no-store",
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => "Unknown error");
			console.error("[novu-proxy] Novu API error", {
				path,
				url,
				status: response.status,
				statusText: response.statusText,
				error: errorText,
			});
			return NextResponse.json(
				{
					error: "Novu API error",
					message: errorText,
				},
				{ status: response.status },
			);
		}

		const data = await response.json();

		return NextResponse.json(data, {
			status: response.status,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("[novu-proxy] Failed to proxy POST request", {
			path,
			url,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		return NextResponse.json(
			{
				error: "Failed to proxy Novu request",
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { path: string[] } },
) {
	const auth = await getCurrentAuth();

	if (!auth || !auth.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

    const path = params.path.join("/");
	const url = `${NOVU_API_URL}/${path}`;
	const body = await request.json().catch(() => ({}));

	try {
		// Forward all headers from the original request
		const headers = new Headers();
		request.headers.forEach((value, key) => {
			// Skip Next.js specific headers
			const lowerKey = key.toLowerCase();
			if (
				lowerKey !== "host" &&
				lowerKey !== "connection" &&
				lowerKey !== "content-length"
			) {
				headers.set(key, value);
			}
		});
		headers.set("Content-Type", "application/json");

		// Add Novu API key if available
		if (process.env.NOVU_API_KEY) {
			headers.set("Authorization", `ApiKey ${process.env.NOVU_API_KEY}`);
		}

		const response = await fetch(url, {
			method: "PUT",
			headers,
			body: JSON.stringify(body),
			cache: "no-store",
		});

		const data = await response.json();

		return NextResponse.json(data, {
			status: response.status,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("[novu-proxy] Failed to proxy request", {
			path,
			error,
		});
		return NextResponse.json(
			{ error: "Failed to proxy Novu request" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { path: string[] } },
) {
	const auth = await getCurrentAuth();

	if (!auth || !auth.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

    const path = params.path.join("/");
	const searchParams = request.nextUrl.searchParams.toString();
	const url = `${NOVU_API_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;

	try {
		// Forward all headers from the original request
		const headers = new Headers();
		request.headers.forEach((value, key) => {
			// Skip Next.js specific headers
			const lowerKey = key.toLowerCase();
			if (
				lowerKey !== "host" &&
				lowerKey !== "connection" &&
				lowerKey !== "content-length"
			) {
				headers.set(key, value);
			}
		});
		headers.set("Content-Type", "application/json");

		// Add Novu API key if available
		if (process.env.NOVU_API_KEY) {
			headers.set("Authorization", `ApiKey ${process.env.NOVU_API_KEY}`);
		}

		const response = await fetch(url, {
			method: "DELETE",
			headers,
			cache: "no-store",
		});

		const data = await response.json().catch(() => ({}));

		return NextResponse.json(data, {
			status: response.status,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("[novu-proxy] Failed to proxy request", {
			path,
			error,
		});
		return NextResponse.json(
			{ error: "Failed to proxy Novu request" },
			{ status: 500 },
		);
	}
}
