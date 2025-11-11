import { NextResponse, type NextRequest } from "next/server";

import { settingsSchema } from "@/lib/validations/settings";

const withNoStore = (response: NextResponse) => {
  response.headers.set("Cache-Control", "no-store");
  return response;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);

  if (!json || typeof json !== "object") {
    return withNoStore(
      NextResponse.json(
        {
          error: "Nevalidan payload."
        },
        { status: 400 }
      )
    );
  }

  const parsed = settingsSchema.safeParse(json);

  if (!parsed.success) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Nevalidni podaci.",
          details: parsed.error.flatten()
        },
        { status: 400 }
      )
    );
  }

  const payload = parsed.data;

  try {
    await sleep(600);
    console.log("[settings] Saving user settings", payload);
    return withNoStore(
      NextResponse.json({
        success: true
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nepoznata greška.";

    return withNoStore(
      NextResponse.json(
        {
          error: "Čuvanje podešavanja nije uspelo.",
          details: message
        },
        { status: 500 }
      )
    );
  }
}

