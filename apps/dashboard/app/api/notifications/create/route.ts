import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
	unauthorizedResponse,
	withNoStore,
} from "@/app/api/notifications/_utils";
import { getCurrentAuth } from "@/lib/auth";
import { createNotificationSchema } from "@/lib/validations/notifications";

const getNotificationServiceUrl = () => {
	return process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || "http://localhost:4002";
};

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

	const token = request.cookies.get("auth_session")?.value;

	try {
		const response = await fetch(`${getNotificationServiceUrl()}/api/notifications`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(token && {
					Authorization: `Bearer ${token}`,
				}),
			},
			body: JSON.stringify(parsed.data),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: "Failed to create notification" }));
			return withNoStore(
				NextResponse.json(
					{
						error: error.error || "Failed to create notification",
					},
					{ status: response.status },
				),
			);
		}

		const notification = await response.json();
		return withNoStore(
			NextResponse.json(
				{
					data: notification,
				},
				{ status: 201 },
			),
		);
	} catch (error) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Failed to create notification",
				},
				{ status: 500 },
			),
		);
	}
}
