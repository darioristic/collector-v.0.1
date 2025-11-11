import { z } from "zod";

export const channelMetadataSchema = z.union([
	z.object({
		type: z.literal("dm"),
		userIds: z.array(z.string()).min(2),
	}),
	z.object({
		type: z.literal("group"),
	}),
	z
		.object({
			type: z.literal("custom"),
		})
		.catchall(z.unknown()),
]);

export const channelMemberSummarySchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email(),
	avatarUrl: z.string().nullable(),
	status: z.string(),
});

export const channelSummarySchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	isPrivate: z.boolean(),
	metadata: channelMetadataSchema.nullable().default(null),
	unreadCount: z.number().nonnegative(),
	lastMessageAt: z.coerce.date().nullable(),
	lastMessagePreview: z.string().nullable(),
	members: z.array(channelMemberSummarySchema),
});

export const messageAttachmentSchema = z.object({
	url: z.string().url(),
	name: z.string().nullable(),
	size: z.number().nullable(),
	mimeType: z.string().nullable(),
});

export const messageWithAuthorSchema = z.object({
	id: z.string().uuid(),
	content: z.string().nullable(),
	fileUrl: z.string().nullable(),
	attachment: messageAttachmentSchema.nullable(),
	senderId: z.string().uuid(),
	senderName: z.string(),
	senderEmail: z.string().email(),
	senderAvatarUrl: z.string().nullable(),
	channelId: z.string().uuid(),
	createdAt: z.coerce.date(),
});

export const bootstrapResponseSchema = z.object({
	currentUser: channelMemberSummarySchema,
	channels: z.array(channelSummarySchema),
	directMessageTargets: z.array(channelMemberSummarySchema),
});

export const createMessageSchema = z
	.object({
		channelId: z.string().uuid(),
		content: z
			.string()
			.trim()
			.max(5000)
			.optional()
			.transform((value) => (value && value.length > 0 ? value : null)),
		fileUrl: z.string().url().optional().nullable(),
	})
	.refine((payload) => payload.content !== null || payload.fileUrl, {
		message: "Poruka ne može biti prazna.",
	});

export const createDirectMessageSchema = z.object({
	targetUserId: z.string().uuid(),
});

export const channelListResponseSchema = z.object({
	channels: z.array(channelSummarySchema),
});

export const messagesResponseSchema = z.object({
	messages: z.array(messageWithAuthorSchema),
});

export const directChannelResponseSchema = z.object({
	channel: channelSummarySchema.optional(),
	channelId: z.string().uuid(),
});

export const messageResponseSchema = z.object({
	message: messageWithAuthorSchema,
});

export const directMessageTargetsResponseSchema = z.object({
	members: z.array(channelMemberSummarySchema),
});

export const uploadAttachmentResponseSchema = z.object({
	url: z.string().url(),
	name: z.string(),
	size: z.number(),
});
