import { type NextRequest, NextResponse } from "next/server";

import { getCurrentAuth } from "@/lib/auth";
import {
	createMessage,
	ensureTeamChatSchemaReady,
	getChannelMessages,
} from "@/lib/teamchat/repository";
import {
	createMessageSchema,
	messageResponseSchema,
	messagesResponseSchema,
} from "@/lib/validations/teamchat";

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

export async function GET(request: NextRequest) {
	try {
		const auth = await getCurrentAuth();
		if (!auth || !auth.user || !auth.user.company) {
			return unauthorized();
		}

		const { searchParams } = new URL(request.url);
		const channelId = searchParams.get("channelId");
		const limit = parseInt(searchParams.get("limit") || "50", 10);

		if (!channelId) {
			return withNoStore(
				NextResponse.json(
					{
						error: "channelId je obavezan.",
					},
					{ status: 400 },
				),
			);
		}

		await ensureTeamChatSchemaReady();

		try {
			const messages = await getChannelMessages(channelId, auth.user.id, limit);
			const validated = messagesResponseSchema.parse({ messages });

			return withNoStore(NextResponse.json(validated));
		} catch (error) {
			console.error("[teamchat] GET messages error:", error);
			const message =
				error instanceof Error
					? error.message
					: "Preuzimanje poruka nije uspelo.";
			return withNoStore(
				NextResponse.json(
					{
						error: message,
					},
					{ status: 500 },
				),
			);
		}
	} catch (error) {
		console.error("[teamchat] GET messages route error:", error);
		const message =
			error instanceof Error
				? error.message
				: "Preuzimanje poruka nije uspelo.";
		return withNoStore(
			NextResponse.json(
				{
					error: message,
				},
				{ status: 500 },
			),
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const auth = await getCurrentAuth();
		if (!auth || !auth.user || !auth.user.company) {
			return unauthorized();
		}

		const json = await request.json().catch(() => null);
		if (!json || typeof json !== "object") {
			return withNoStore(
				NextResponse.json(
					{
						error: "Nevalidni podaci.",
					},
					{ status: 400 },
				),
			);
		}

		const parsed = createMessageSchema.safeParse(json);
		if (!parsed.success) {
			return withNoStore(
				NextResponse.json(
					{
						error: "Nevalidni podaci.",
						details: parsed.error.flatten(),
					},
					{ status: 400 },
				),
			);
		}

		await ensureTeamChatSchemaReady();

		try {
			const message = await createMessage(
				parsed.data.channelId,
				auth.user.id,
				parsed.data.content,
				parsed.data.fileUrl || null,
			);
			const validated = messageResponseSchema.parse({ message });

			return withNoStore(NextResponse.json(validated));
		} catch (error) {
			console.error("[teamchat] POST messages error:", error);
			const message =
				error instanceof Error ? error.message : "Slanje poruke nije uspelo.";
			return withNoStore(
				NextResponse.json(
					{
						error: message,
					},
					{ status: 500 },
				),
			);
		}
	} catch (error) {
		console.error("[teamchat] POST messages route error:", error);
		const message =
			error instanceof Error ? error.message : "Slanje poruke nije uspelo.";
		return withNoStore(
			NextResponse.json(
				{
					error: message,
				},
				{ status: 500 },
			),
		);
	}
}
