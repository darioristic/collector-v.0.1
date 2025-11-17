import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

const CHAT_SERVICE_URL =
  process.env.CHAT_SERVICE_URL || process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4001";

const withNoStore = (response: NextResponse) => {
  response.headers.set("Cache-Control", "no-store");
  return response;
};

const unauthorized = () =>
  withNoStore(
    NextResponse.json(
      {
        error: "Niste autorizovani.",
      },
      { status: 401 },
    ),
  );

export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return unauthorized();
    }
    const conversationId = params?.id;
    if (!conversationId) {
      return withNoStore(
        NextResponse.json(
          { error: "Nedostaje ID konverzacije." },
          { status: 400 },
        ),
      );
    }

    const response = await fetch(
      `${CHAT_SERVICE_URL}/api/conversations/${conversationId}/messages/read`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Označavanje poruka kao pročitanih nije uspelo." }));
      return withNoStore(
        NextResponse.json(
          {
            error: error.error || "Označavanje poruka kao pročitanih nije uspelo.",
          },
          { status: response.status },
        ),
      );
    }

    const data = await response.json().catch(() => ({ success: true }));
    return withNoStore(NextResponse.json(data));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return withNoStore(
      NextResponse.json(
        {
          error: "Označavanje poruka kao pročitanih nije uspelo.",
          details: errorMessage,
        },
        { status: 500 },
      ),
    );
  }
}
