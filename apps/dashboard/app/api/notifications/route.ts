import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
	unauthorizedResponse,
	withNoStore,
} from "@/app/api/notifications/_utils";
import { getCurrentAuth } from "@/lib/auth";
import { notificationListResponseSchema } from "@/lib/validations/notifications";

import { getApiUrl } from "@/src/lib/fetch-utils";

export async function GET(request: NextRequest) {
	const auth = await getCurrentAuth();

	if (!auth || !auth.user) {
		return unauthorizedResponse();
	}

	const limit = request.nextUrl.searchParams.get("limit") || "25";
	const offset = request.nextUrl.searchParams.get("offset") || "0";
	const unreadOnly = request.nextUrl.searchParams.get("unreadOnly") === "true";

	try {
		const searchParams = new URLSearchParams({
			limit,
			offset,
			...(unreadOnly && { unreadOnly: "true" }),
		});

		const apiUrl = getApiUrl(`notifications?${searchParams.toString()}`);
		
		const response = await fetch(apiUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"x-user-id": auth.user.id,
				"x-user-email": auth.user.email || "",
				"x-user-name": auth.user.name || "",
				"x-user-role": auth.user.role || "",
				"x-company-id": auth.user.company?.id || "",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: "Failed to fetch notifications" }));
			console.error("[notifications] API error", {
				status: response.status,
				url: apiUrl,
				error,
			});
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
