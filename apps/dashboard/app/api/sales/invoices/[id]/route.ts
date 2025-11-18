import { type NextRequest, NextResponse } from "next/server";
import { backendErrorResponse, createJsonError } from "@/app/api/auth/_utils";
import { isUuid } from "@/lib/utils";

const API_URL = process.env.API_URL || "http://localhost:4000";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		if (!isUuid(id)) {
			return createJsonError(
				400,
				"Bad Request",
				'params/id must match format "uuid"',
			);
		}

		const headers: HeadersInit = {
			Accept: "application/json",
		};
		const cookie = request.headers.get("cookie");
		if (cookie) headers["Cookie"] = cookie;
		const authorization = request.headers.get("authorization");
		if (authorization) headers["Authorization"] = authorization;

		const response = await fetch(`${API_URL}/api/sales/invoices/${id}`, {
			headers,
			cache: "no-store",
		});

		if (!response.ok) {
			let payload: { error?: string; message?: string } | null = null;
			try {
				payload = await response.json();
			} catch {
				payload = null;
			}
			return backendErrorResponse(
				response,
				payload,
				"Failed to fetch invoice",
				"Upstream invoice API error",
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		const message =
			error instanceof Error
				? error.message.toLowerCase()
				: String(error).toLowerCase();
		if (
			message.includes("failed to fetch") ||
			message.includes("networkerror") ||
			message.includes("econnrefused") ||
			message.includes("connection refused")
		) {
			return createJsonError(
				503,
				"Service Unavailable",
				"Servis faktura nije dostupan.",
			);
		}
		return createJsonError(
			500,
			"Internal Server Error",
			"Došlo je do greške pri preuzimanju računa.",
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		if (!isUuid(id)) {
			return createJsonError(
				400,
				"Bad Request",
				'params/id must match format "uuid"',
			);
		}

		const body = await request.json();
		const headers: HeadersInit = {
			"Content-Type": "application/json",
			Accept: "application/json",
		};
		const cookie = request.headers.get("cookie");
		if (cookie) headers["Cookie"] = cookie;
		const authorization = request.headers.get("authorization");
		if (authorization) headers["Authorization"] = authorization;

		const response = await fetch(`${API_URL}/api/sales/invoices/${id}`, {
			method: "PATCH",
			headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			let payload: { error?: string; message?: string } | null = null;
			try {
				payload = await response.json();
			} catch {
				payload = null;
			}
			return backendErrorResponse(
				response,
				payload,
				"Failed to update invoice",
				"Upstream invoice API error",
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		const message =
			error instanceof Error
				? error.message.toLowerCase()
				: String(error).toLowerCase();
		if (
			message.includes("failed to fetch") ||
			message.includes("networkerror") ||
			message.includes("econnrefused") ||
			message.includes("connection refused")
		) {
			return createJsonError(
				503,
				"Service Unavailable",
				"Servis faktura nije dostupan.",
			);
		}
		return createJsonError(
			500,
			"Internal Server Error",
			"Došlo je do greške pri ažuriranju računa.",
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const { id } = params;
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(id)) {
			return createJsonError(
				400,
				"Bad Request",
				'params/id must match format "uuid"',
			);
		}

		const headers: HeadersInit = {
			Accept: "application/json",
		};
		const cookie = request.headers.get("cookie");
		if (cookie) headers["Cookie"] = cookie;
		const authorization = request.headers.get("authorization");
		if (authorization) headers["Authorization"] = authorization;

		const response = await fetch(`${API_URL}/api/sales/invoices/${id}`, {
			method: "DELETE",
			headers,
		});

		if (!response.ok) {
			let payload: { error?: string; message?: string } | null = null;
			try {
				payload = await response.json();
			} catch {
				payload = null;
			}
			return backendErrorResponse(
				response,
				payload,
				"Failed to delete invoice",
				"Upstream invoice API error",
			);
		}

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		const message =
			error instanceof Error
				? error.message.toLowerCase()
				: String(error).toLowerCase();
		if (
			message.includes("failed to fetch") ||
			message.includes("networkerror") ||
			message.includes("econnrefused") ||
			message.includes("connection refused")
		) {
			return createJsonError(
				503,
				"Service Unavailable",
				"Servis faktura nije dostupan.",
			);
		}
		return createJsonError(
			500,
			"Internal Server Error",
			"Došlo je do greške pri brisanju računa.",
		);
	}
}
