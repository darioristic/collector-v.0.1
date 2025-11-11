import { z } from "zod";

export const notificationTypeEnum = z.enum([
	"info",
	"success",
	"warning",
	"error",
]);

export const createNotificationSchema = z
	.object({
		title: z.string().min(1, "Naslov je obavezan.").max(200),
		message: z.string().min(1, "Poruka je obavezna."),
		recipientId: z.string().uuid("Nevažeći recipientId."),
		type: notificationTypeEnum.optional(),
		link: z.string().trim().max(2048, "Link je predugačak.").optional(),
	})
	.strict();

export const markNotificationsReadSchema = z
	.object({
		ids: z
			.array(z.string().uuid("Nevažeći ID notifikacije."))
			.min(1, "Potrebno je proslediti makar jednu notifikaciju."),
	})
	.strict();

export const notificationPayloadSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	message: z.string(),
	type: notificationTypeEnum,
	link: z.string().nullable(),
	read: z.boolean(),
	recipientId: z.string().uuid(),
	companyId: z.string().uuid(),
	createdAt: z.string(),
});

export const notificationListResponseSchema = z.object({
	data: z.array(notificationPayloadSchema),
});

export const notificationUpdateResponseSchema = z.object({
	updatedIds: z.array(z.string().uuid()),
	unreadCount: z.number().nonnegative(),
});

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;
