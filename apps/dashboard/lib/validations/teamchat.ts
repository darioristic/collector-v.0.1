import { z } from "zod";

export const channelMemberSummarySchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email: z.string().email(),
	avatarUrl: z.string().nullable(),
	status: z.string(),
});

export const channelMetadataSchema = z
	.object({
		type: z.enum(["dm", "group", "custom"]),
		userIds: z.array(z.string().uuid()).optional(),
	})
	.nullable();

export const channelSummarySchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	isPrivate: z.boolean(),
	metadata: channelMetadataSchema,
	unreadCount: z.number().nonnegative(),
	lastMessageAt: z.date().nullable(),
	lastMessagePreview: z.string().nullable(),
	members: z.array(channelMemberSummarySchema),
});

export const bootstrapResponseSchema = z.object({
	currentUser: channelMemberSummarySchema,
	channels: z.array(channelSummarySchema),
	directMessageTargets: z.array(channelMemberSummarySchema),
});

export const messageWithAuthorSchema = z.object({
	id: z.string().uuid(),
	content: z.string().nullable(),
	fileUrl: z.string().nullable(),
	attachment: z
		.object({
			url: z.string(),
			name: z.string().nullable(),
			size: z.number().nullable(),
			mimeType: z.string().nullable(),
		})
		.nullable(),
	senderId: z.string().uuid(),
	senderName: z.string(),
	senderEmail: z.string().email(),
	senderAvatarUrl: z.string().nullable(),
	channelId: z.string().uuid(),
	createdAt: z.date(),
});

// Additional response schemas
export const channelListResponseSchema = z.object({
	channels: z.array(channelSummarySchema),
});

export const directChannelResponseSchema = z.object({
	channel: channelSummarySchema,
});

export const directMessageTargetsResponseSchema = z.object({
	targets: z.array(channelMemberSummarySchema),
});

export const messageResponseSchema = z.object({
	message: messageWithAuthorSchema,
});

export const messagesResponseSchema = z.object({
	messages: z.array(messageWithAuthorSchema),
});

export const uploadAttachmentResponseSchema = z.object({
	url: z.string(),
	name: z.string(),
	size: z.number(),
	mimeType: z.string(),
});

// Request schemas
export const createDirectMessageSchema = z.object({
	targetUserId: z.string().uuid(),
});

export const createMessageSchema = z.object({
	content: z.string().min(1),
	channelId: z.string().uuid(),
	fileUrl: z.string().optional(),
});
