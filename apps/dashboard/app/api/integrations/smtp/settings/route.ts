import { type NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.COLLECTOR_API_URL || process.env.API_URL || "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = `${API_BASE_URL}/api/integrations/smtp/settings`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || (data && data.ok === false)) {
      const message =
        (data && (data.error || data.message)) || "Failed to save SMTP settings";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(data ?? { ok: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


