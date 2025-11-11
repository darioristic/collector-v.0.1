import { NextRequest, NextResponse } from "next/server";

import { getCurrentAuth } from "@/lib/auth";
import { createMessage, getChannelMessages } from "@/lib/teamchat/repository";
import { getSocketServer } from "@/lib/teamchat/socket-server";
import { createMessageSchema } from "@/lib/validations/teamchat";

const withNoStore = (response: NextResponse) => {
  response.headers.set("Cache-Control", "no-store");
  return response;
};

const unauthorized = () =>
  withNoStore(
    NextResponse.json(
      {
        error: "Niste autorizovani."
      },
      { status: 401 }
    )
  );

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.user || !auth.user.company) {
    return unauthorized();
  }

  const channelId = request.nextUrl.searchParams.get("channelId");
  if (!channelId) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Parametar channelId je obavezan."
        },
        { status: 400 }
      )
    );
  }

  try {
    const messages = await getChannelMessages({
      companyId: auth.user.company.id,
      channelId,
      userId: auth.user.id
    });

    return withNoStore(
      NextResponse.json({
        messages
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preuzimanje poruka nije uspelo.";
    return withNoStore(
      NextResponse.json(
        {
          error: message
        },
        { status: 400 }
      )
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.user || !auth.user.company) {
    return unauthorized();
  }

  const json = await request.json().catch(() => null);
  const parsed = createMessageSchema.safeParse(json);

  if (!parsed.success) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Nevalidni podaci."
        },
        { status: 400 }
      )
    );
  }

  try {
    const message = await createMessage({
      companyId: auth.user.company.id,
      channelId: parsed.data.channelId,
      userId: auth.user.id,
      content: parsed.data.content ?? null,
      fileUrl: parsed.data.fileUrl ?? null
    });

    const io = getSocketServer();
    if (io) {
      io.to(message.channelId).emit("message:new", {
        channelId: message.channelId,
        message
      });
      io.emit("channel:updated", {
        channelId: message.channelId
      });
    }

    return withNoStore(
      NextResponse.json({
        message
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Slanje poruke nije uspelo.";
    return withNoStore(
      NextResponse.json(
        {
          error: message
        },
        { status: 400 }
      )
    );
  }
}


