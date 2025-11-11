import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
	withNoStore,
	unauthorizedResponse,
	serializeNotification,
} from "@/app/api/notifications/_utils";
import { getDb } from "@/lib/db";
import { notifications } from "@/lib/db/schema/core";
import { emitNotification } from "@/lib/socket";
import { getCurrentAuth } from "@/lib/auth";
import { createNotificationSchema } from "@/lib/validations/notifications";

export async function POST(request: NextRequest) {
	const auth = await getCurrentAuth();

	if (!auth || !auth.user || !auth.user.company) {
		return unauthorizedResponse();
	}

	const json = await request.json().catch(() => null);
	const parsed = createNotificationSchema.safeParse(json);

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

	const db = await getDb();
	const now = new Date();
	const { title, message, recipientId, type, link } = parsed.data;

	const [notification] = await db
		.insert(notifications)
		.values({
			title,
			message,
			type: type ?? "info",
			link: link && link.length > 0 ? link : null,
			recipientId,
			companyId: auth.user.company.id,
			read: false,
			createdAt: now,
		})
		.returning();

	const serialized = serializeNotification(notification);

	emitNotification(recipientId, "notification:new", serialized);

	return withNoStore(
		NextResponse.json(
			{
				data: serialized,
			},
			{ status: 201 },
		),
	);
}
