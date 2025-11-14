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

const getNotificationServiceUrl = () => {
	return process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || "http://localhost:4002";
};

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

	const token = request.cookies.get("auth_session")?.value;

	try {
		const response = await fetch(`${getNotificationServiceUrl()}/api/notifications/mark-read`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				...(token && {
					Authorization: `Bearer ${token}`,
				}),
			},
			body: JSON.stringify({ ids: parsed.data.ids }),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: "Failed to mark as read" }));
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
  } catch (_error) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Failed to mark as read",
				},
				{ status: 500 },
			),
		);
	}
}
