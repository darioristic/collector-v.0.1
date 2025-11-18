import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
	unauthorizedResponse,
	withNoStore,
} from "@/app/api/notifications/_utils";
import { getCurrentAuth } from "@/lib/auth";
import {
	markNotificationsReadSchema,
	notificationUpdateResponseSchema,
} from "@/lib/validations/notifications";

import { getApiUrl } from "@/src/lib/fetch-utils";

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

	try {
		const response = await fetch(getApiUrl("notifications/mark-read"), {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				"x-user-id": auth.user.id,
				"x-user-email": auth.user.email || "",
				"x-user-name": auth.user.name || "",
				"x-user-role": auth.user.company?.role || "",
				"x-company-id": auth.user.company?.id || "",
			},
			body: JSON.stringify({ ids: parsed.data.ids }),
		});

		if (!response.ok) {
			const error = await response
				.json()
				.catch(() => ({ error: "Failed to mark as read" }));
			return withNoStore(
				NextResponse.json(
					{
						error: error.error || "Failed to mark as read",
					},
					{ status: response.status },
				),
			);
		}

		const payload = await response.json();
		const validated = notificationUpdateResponseSchema.parse(payload);

		return withNoStore(NextResponse.json(validated));
	} catch (error) {
		console.error("[notifications] Failed to mark as read", error);
		return withNoStore(
			NextResponse.json(
				{
					error: "Servis notifikacija nije dostupan.",
				},
				{ status: 503 },
			),
		);
	}
}
