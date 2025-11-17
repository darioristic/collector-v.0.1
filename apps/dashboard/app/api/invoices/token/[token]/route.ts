import { NextRequest, NextResponse } from "next/server";
import { createJsonError, backendErrorResponse } from "@/app/api/auth/_utils";

const API_URL = process.env.API_URL || "http://localhost:4000";

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } },
) {
    try {
        const { token } = params;

        const headers: HeadersInit = {
            Accept: "application/json",
        };
        const cookie = request.headers.get("cookie");
        if (cookie) headers["Cookie"] = cookie;
        const authorization = request.headers.get("authorization");
        if (authorization) headers["Authorization"] = authorization;

        const response = await fetch(`${API_URL}/api/sales/invoices/token/${token}`,
            { headers });

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
            error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        if (
            message.includes("failed to fetch") ||
            message.includes("networkerror") ||
            message.includes("econnrefused") ||
            message.includes("connection refused")
        ) {
            return createJsonError(503, "Service Unavailable", "Servis faktura nije dostupan.");
        }
        return createJsonError(500, "Internal Server Error", "Došlo je do greške pri preuzimanju računa.");
    }
}
