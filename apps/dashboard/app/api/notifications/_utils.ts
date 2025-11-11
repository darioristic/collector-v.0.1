import { NextResponse } from "next/server";

import type { Notification } from "@/lib/db/schema/core";

const VALID_NOTIFICATION_TYPES = new Set([
	"info",
	"success",
	"warning",
	"error",
]);

const normalizeNotificationType = (type: Notification["type"]) => {
	const normalized = typeof type === "string" ? type.toLowerCase() : "info";
	return VALID_NOTIFICATION_TYPES.has(normalized) ? normalized : "info";
};

const normalizeDate = (value: Notification["createdAt"]) => {
	if (value instanceof Date) {
		return value.toISOString();
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime())
		? new Date().toISOString()
		: parsed.toISOString();
};

export const withNoStore = (response: NextResponse) => {
	response.headers.set("Cache-Control", "no-store");
	return response;
};

export const unauthorizedResponse = () =>
	withNoStore(
		NextResponse.json(
			{
				error: "Niste autorizovani.",
			},
			{ status: 401 },
		),
	);

export const serializeNotification = (notification: Notification) => ({
	id: notification.id,
	title: notification.title,
	message: notification.message,
	type: normalizeNotificationType(notification.type),
	link: notification.link ?? null,
	read: notification.read,
	recipientId: notification.recipientId,
	companyId: notification.companyId,
	createdAt: normalizeDate(notification.createdAt),
});
