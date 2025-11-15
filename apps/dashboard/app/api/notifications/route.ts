import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
	unauthorizedResponse,
	withNoStore,
} from "@/app/api/notifications/_utils";
import { getCurrentAuth } from "@/lib/auth";
import { notificationListResponseSchema } from "@/lib/validations/notifications";

const getNotificationServiceUrl = () => {
  return (
    process.env.NOTIFICATION_SERVICE_URL ||
    process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL ||
    "http://localhost:4002"
  );
};

export async function GET(request: NextRequest) {
	const auth = await getCurrentAuth();

	if (!auth || !auth.user) {
		return unauthorizedResponse();
	}

	const token = request.cookies.get("auth_session")?.value;
	const limit = request.nextUrl.searchParams.get("limit") || "25";

	try {
		const response = await fetch(
			`${getNotificationServiceUrl()}/api/notifications?limit=${limit}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					...(token && {
						Authorization: `Bearer ${token}`,
					}),
				},
				cache: "no-store",
			},
		);

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: "Failed to fetch notifications" }));
			return withNoStore(
				NextResponse.json(
					{
						error: error.error || "Došlo je do greške pri preuzimanju notifikacija.",
					},
					{ status: response.status },
				),
			);
		}

		const data = await response.json();
		// Transform response to match expected format
		const payload = notificationListResponseSchema.safeParse({
			data: data.notifications || [],
		});

		if (!payload.success) {
			console.error("[notifications] Serialization failed", {
				error: payload.error.flatten(),
			});
			return withNoStore(NextResponse.json({ data: [] }));
		}

		return withNoStore(NextResponse.json(payload.data));
    } catch (error) {
        console.error("[notifications] Failed to list notifications", error);
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
