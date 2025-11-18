import { type NextRequest, NextResponse } from "next/server";
import { isUuid } from "@/lib/utils";

const API_URL = process.env.API_URL || "http://localhost:4000";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	if (!isUuid(id)) {
		return NextResponse.json(
			{ error: 'params/id must match format "uuid"' },
			{ status: 400 },
		);
	}
	const upstream = await fetch(`${API_URL}/api/sales/invoices/${id}/pdf`, {
		method: "GET",
	});

	if (!upstream.ok) {
		const text = await upstream.text().catch(() => "Failed to download PDF");
		return new Response(text, { status: upstream.status });
	}

	// Stream/forward the PDF with appropriate headers
	const headers = new Headers(upstream.headers);
	// Ensure a sensible filename
	if (!headers.has("Content-Disposition")) {
		headers.set(
			"Content-Disposition",
			`attachment; filename="invoice-${id}.pdf"`,
		);
	}
	// Some backends may not set content type explicitly
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "application/pdf");
	}

	return new Response(upstream.body, {
		status: upstream.status,
		headers,
	});
}
