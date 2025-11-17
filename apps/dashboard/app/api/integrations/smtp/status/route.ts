import { type NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.COLLECTOR_API_URL || process.env.API_URL || "http://localhost:4000";

export async function GET(_request: NextRequest) {
  try {
    const url = `${API_BASE_URL}/api/integrations/smtp/status`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        (data && (data.error || data.message)) || "Failed to fetch SMTP status";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(data ?? {}, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


