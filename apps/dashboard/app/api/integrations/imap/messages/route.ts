import { type NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.COLLECTOR_API_URL || process.env.API_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
  try {
    const qs = request.nextUrl.searchParams.toString();
    const url = `${API_BASE_URL}/api/integrations/imap/messages${qs ? `?${qs}` : ""}`;
    const response = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" }, cache: "no-store" });
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: error || "Failed to fetch messages" }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

