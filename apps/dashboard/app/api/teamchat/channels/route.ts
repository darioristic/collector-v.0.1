import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCurrentAuth } from "@/lib/auth";
import {
	listChannels,
	upsertDirectMessageChannel,
} from "@/lib/teamchat/repository";
import { createDirectMessageSchema } from "@/lib/validations/teamchat";

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

export async function GET() {
	const auth = await getCurrentAuth();
	if (!auth || !auth.user || !auth.user.company) {
		return unauthorized();
	}

	const channels = await listChannels({
		companyId: auth.user.company.id,
		userId: auth.user.id,
	});

	return withNoStore(
		NextResponse.json({
			channels,
		}),
	);
}

export async function POST(request: NextRequest) {
	const auth = await getCurrentAuth();
	if (!auth || !auth.user || !auth.user.company) {
		return unauthorized();
	}

	const json = await request.json().catch(() => null);
	const parsed = createDirectMessageSchema.safeParse(json);

	if (!parsed.success) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Nevalidni podaci.",
				},
				{ status: 400 },
			),
		);
	}

	if (parsed.data.targetUserId === auth.user.id) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Ne možete započeti razgovor sami sa sobom.",
				},
				{ status: 400 },
			),
		);
	}

	const channel = await upsertDirectMessageChannel({
		companyId: auth.user.company.id,
		currentUserId: auth.user.id,
		targetUserId: parsed.data.targetUserId,
	});

	const channels = await listChannels({
		companyId: auth.user.company.id,
		userId: auth.user.id,
	});

	const channelSummary = channels.find((item) => item.id === channel.id);

	return withNoStore(
		NextResponse.json({
			channel: channelSummary ?? null,
			channelId: channel.id,
		}),
	);
}
