import { type NextRequest, NextResponse } from "next/server";

import { getCurrentAuth } from "@/lib/auth";
import {
	ensureTeamChatSchemaReady,
	listDirectMessageTargets,
} from "@/lib/teamchat/repository";
import { directMessageTargetsResponseSchema } from "@/lib/validations/teamchat";

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
			const members = await listDirectMessageTargets(
				auth.user.company.id,
				auth.user.id,
			);
			const validated = directMessageTargetsResponseSchema.parse({ members });

			return withNoStore(NextResponse.json(validated));
		} catch (error) {
			console.error("[teamchat] GET direct-messages error:", error);
			const message =
				error instanceof Error
					? error.message
					: "Preuzimanje direktnih poruka nije uspelo.";
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
		console.error("[teamchat] GET direct-messages route error:", error);
		const message =
			error instanceof Error
				? error.message
				: "Preuzimanje direktnih poruka nije uspelo.";
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
