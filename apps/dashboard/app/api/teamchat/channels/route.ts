import { type NextRequest, NextResponse } from "next/server";

import { getCurrentAuth } from "@/lib/auth";
import {
	ensureTeamChatSchemaReady,
	listChannels,
	upsertDirectMessageChannel,
} from "@/lib/teamchat/repository";
import {
	channelListResponseSchema,
	createDirectMessageSchema,
	directChannelResponseSchema,
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

export async function GET(_request: NextRequest) {
	try {
		const auth = await getCurrentAuth();
		if (!auth || !auth.user || !auth.user.company) {
			return unauthorized();
		}

		await ensureTeamChatSchemaReady();

		try {
			const channels = await listChannels(auth.user.company.id, auth.user.id);
			const validated = channelListResponseSchema.parse({ channels });

			return withNoStore(NextResponse.json(validated));
		} catch (error) {
			console.error("[teamchat] GET channels error:", error);
			const message =
				error instanceof Error
					? error.message
					: "Preuzimanje kanala nije uspelo.";
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
		console.error("[teamchat] GET channels route error:", error);
		const message =
			error instanceof Error
				? error.message
				: "Preuzimanje kanala nije uspelo.";
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

		const parsed = createDirectMessageSchema.safeParse(json);
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
			const result = await upsertDirectMessageChannel(
				auth.user.company.id,
				auth.user.id,
				parsed.data.targetUserId,
			);
			const validated = directChannelResponseSchema.parse(result);

			return withNoStore(NextResponse.json(validated));
		} catch (error) {
			console.error("[teamchat] POST channels error:", error);
			const message =
				error instanceof Error
					? error.message
					: "Kreiranje kanala nije uspelo.";
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
		console.error("[teamchat] POST channels route error:", error);
		const message =
			error instanceof Error ? error.message : "Kreiranje kanala nije uspelo.";
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
