import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import {
	withNoStore,
	unauthorizedResponse,
	serializeNotification,
} from "@/app/api/notifications/_utils";
import { getDb } from "@/lib/db";
import { notifications } from "@/lib/db/schema/core";
import { getCurrentAuth } from "@/lib/auth";
import { notificationListResponseSchema } from "@/lib/validations/notifications";

const isMissingNotificationsTableError = (error: unknown) => {
	if (!error || typeof error !== "object") {
		return false;
	}

	const code = "code" in error ? (error as { code?: string }).code : undefined;
	if (code === "42P01") {
		return true;
	}

	const message =
		"message" in error ? (error as { message?: string }).message : undefined;

	return (
		typeof message === "string" &&
		message.toLowerCase().includes('relation "notifications" does not exist')
	);
};

const isUuid = (value: string | null | undefined): value is string =>
	typeof value === "string"
		? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
				value,
			)
		: false;

export async function GET(request: NextRequest) {
	const auth = await getCurrentAuth();

	if (!auth || !auth.user) {
		return unauthorizedResponse();
	}

	const rawCompanyId = auth.user.company?.id ?? auth.user.defaultCompanyId;

	if (!isUuid(rawCompanyId)) {
		console.warn(
			"[notifications] Nevalidan companyId za korisnika. Vraćam prazan rezultat.",
			{
				userId: auth.user.id,
				companyId: rawCompanyId,
			},
		);

		return withNoStore(
			NextResponse.json({
				data: [],
			}),
		);
	}

	const companyId = rawCompanyId;

	try {
		const db = await getDb();

		const limitParam = parseInt(
			request.nextUrl.searchParams.get("limit") ?? "25",
			10,
		);
		const limit = Number.isNaN(limitParam)
			? 25
			: Math.max(1, Math.min(limitParam, 100));

		const rows = await db
			.select()
			.from(notifications)
			.where(
				and(
					eq(notifications.companyId, companyId),
					eq(notifications.recipientId, auth.user.id),
				),
			)
			.orderBy(desc(notifications.createdAt))
			.limit(limit);

		const serialized = rows.map(serializeNotification);
		const payload = notificationListResponseSchema.safeParse({
			data: serialized,
		});

		if (!payload.success) {
			console.error("[notifications] Serialization failed", {
				error: payload.error.flatten(),
				count: serialized.length,
			});

			return withNoStore(NextResponse.json({ data: [] }));
		}

		return withNoStore(NextResponse.json(payload.data));
	} catch (error) {
		if (isMissingNotificationsTableError(error)) {
			console.warn(
				"[notifications] Tabela notifications ne postoji. Vraćam prazan rezultat.",
			);
			return withNoStore(
				NextResponse.json({
					data: [],
				}),
			);
		}

		console.error("[notifications] Failed to list notifications", error);

		return withNoStore(
			NextResponse.json(
				{
					error: "Došlo je do greške pri preuzimanju notifikacija.",
				},
				{ status: 500 },
			),
		);
	}
}
