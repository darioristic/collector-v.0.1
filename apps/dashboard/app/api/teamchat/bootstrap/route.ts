import { type NextRequest, NextResponse } from "next/server";

import { getCurrentAuth } from "@/lib/auth";
import {
	bootstrapTeamChat,
	ensureTeamChatSchemaReady,
} from "@/lib/teamchat/repository";
import { bootstrapResponseSchema } from "@/lib/validations/teamchat";

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

		await ensureTeamChatSchemaReady();

		try {
			const data = await bootstrapTeamChat(auth);
			const validated = bootstrapResponseSchema.parse(data);

			return withNoStore(NextResponse.json(validated));
		} catch (error) {
			console.error("[teamchat] GET bootstrap error:", error);
			const message =
				error instanceof Error
					? error.message
					: "Bootstrap nije uspeo.";
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
		console.error("[teamchat] GET bootstrap route error:", error);
		const message =
			error instanceof Error
				? error.message
				: "Bootstrap nije uspeo.";
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

