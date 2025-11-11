import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { and, count, eq, inArray } from "drizzle-orm";

import {
	withNoStore,
	unauthorizedResponse,
} from "@/app/api/notifications/_utils";
import { getDb } from "@/lib/db";
import { notifications } from "@/lib/db/schema/core";
import { emitNotification } from "@/lib/socket";
import { getCurrentAuth } from "@/lib/auth";
import {
	markNotificationsReadSchema,
	notificationUpdateResponseSchema,
} from "@/lib/validations/notifications";

export async function PATCH(request: NextRequest) {
	const auth = await getCurrentAuth();

	if (!auth || !auth.user || !auth.user.company) {
		return unauthorizedResponse();
	}

	const json = await request.json().catch(() => null);
	const parsed = markNotificationsReadSchema.safeParse(json);

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
	const ids = parsed.data.ids;

	const updated = await db
		.update(notifications)
		.set({
			read: true,
		})
		.where(
			and(
				eq(notifications.companyId, auth.user.company.id),
				eq(notifications.recipientId, auth.user.id),
				inArray(notifications.id, ids),
				eq(notifications.read, false),
			),
		)
		.returning();

	const [{ unreadCount }] = await db
		.select({
			unreadCount: count(notifications.id),
		})
		.from(notifications)
		.where(
			and(
				eq(notifications.companyId, auth.user.company.id),
				eq(notifications.recipientId, auth.user.id),
				eq(notifications.read, false),
			),
		);

	const updatedIds = updated.map((item) => item.id);

	const unreadRaw = unreadCount ?? 0;
	const unreadTotal =
		typeof unreadRaw === "number" ? unreadRaw : Number(unreadRaw);

	const payload = notificationUpdateResponseSchema.parse({
		updatedIds,
		unreadCount: unreadTotal,
	});

	if (payload.updatedIds.length > 0) {
		emitNotification(auth.user.id, "notification:read", payload);
	}

	return withNoStore(NextResponse.json(payload));
}
