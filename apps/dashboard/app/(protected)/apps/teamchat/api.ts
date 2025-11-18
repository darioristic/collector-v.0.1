import type { z } from "zod";

import type {
	ChannelMemberSummary,
	ChannelSummary,
	MessageWithAuthor,
} from "@/lib/teamchat/types";
import {
	bootstrapResponseSchema,
	channelListResponseSchema,
	type createDirectMessageSchema,
	type createMessageSchema,
	directChannelResponseSchema,
	directMessageTargetsResponseSchema,
	messageResponseSchema,
	messagesResponseSchema,
	uploadAttachmentResponseSchema,
} from "@/lib/validations/teamchat";

const getChatServiceUrl = () => {
	return process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4001";
};

const getAuthHeaders = () => {
	if (typeof window === "undefined" || !document) {
		return {
			"Content-Type": "application/json",
		};
	}

	const token = document.cookie
		.split("; ")
		.find((row) => row.startsWith("auth_session="))
		?.split("=")[1];

	return {
		"Content-Type": "application/json",
		...(token && {
			Authorization: `Bearer ${token}`,
			"x-session-token": token,
		}),
	};
};

export type BootstrapResponse = z.infer<typeof bootstrapResponseSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type CreateDirectMessageInput = z.infer<
	typeof createDirectMessageSchema
>;

export const bootstrapTeamChat = async (): Promise<BootstrapResponse> => {
	const response = await fetch(
		`${getChatServiceUrl()}/api/teamchat/bootstrap`,
		{
			method: "GET",
			headers: getAuthHeaders(),
			cache: "no-store",
		},
	);

	if (!response.ok) {
		const error = (await response.json().catch(() => ({
			error: "Bootstrap failed.",
		}))) as { error?: string };
		throw new Error(error.error || "Bootstrap failed.");
	}

	const data = (await response.json()) as unknown;
	return bootstrapResponseSchema.parse(data);
};

export const fetchChannels = async (): Promise<ChannelSummary[]> => {
	const response = await fetch(`${getChatServiceUrl()}/api/channels`, {
		method: "GET",
		headers: getAuthHeaders(),
		cache: "no-store",
	});

	if (!response.ok) {
		const error = (await response.json().catch(() => ({
			error: "Failed to fetch channels.",
		}))) as { error?: string };
		throw new Error(error.error || "Failed to fetch channels.");
	}

	const data = (await response.json()) as unknown;
	return channelListResponseSchema.parse(data).channels;
};

export const createDirectMessageChannel = async (
	targetUserId: string,
): Promise<{ channelId: string; channel?: ChannelSummary }> => {
	const response = await fetch(`${getChatServiceUrl()}/api/channels`, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify({ targetUserId }),
		cache: "no-store",
	});

	if (!response.ok) {
		const error = (await response.json().catch(() => ({
			error: "Failed to create channel.",
		}))) as { error?: string };
		throw new Error(error.error || "Failed to create channel.");
	}

	const data = (await response.json()) as unknown;
	const parsed = directChannelResponseSchema.parse(data);
	// Return the parsed response with channelId extracted from channel.id
	return {
		channelId: parsed.channel.id,
		channel: parsed.channel,
	};
};

export const fetchMessages = async (
	channelId: string,
	limit = 50,
): Promise<MessageWithAuthor[]> => {
	const url = new URL(`${getChatServiceUrl()}/api/messages`);
	url.searchParams.set("channelId", channelId);
	url.searchParams.set("limit", limit.toString());

	const response = await fetch(url.toString(), {
		method: "GET",
		headers: getAuthHeaders(),
		cache: "no-store",
	});

	if (!response.ok) {
		const error = (await response.json().catch(() => ({
			error: "Failed to fetch messages.",
		}))) as { error?: string };
		throw new Error(error.error || "Failed to fetch messages.");
	}

	const parsed = (await response.json()) as unknown;
	return messagesResponseSchema.parse(parsed).messages;
};

export const sendMessage = async (
	input: CreateMessageInput,
): Promise<MessageWithAuthor> => {
	const response = await fetch(`${getChatServiceUrl()}/api/messages`, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify(input),
		cache: "no-store",
	});

	if (!response.ok) {
		const error = (await response.json().catch(() => ({
			error: "Failed to send message.",
		}))) as { error?: string };
		throw new Error(error.error || "Failed to send message.");
	}

	const data = (await response.json()) as unknown;
	return messageResponseSchema.parse(data).message;
};

export const fetchDirectMessageTargets = async (): Promise<
	ChannelMemberSummary[]
> => {
	const response = await fetch(
		`${getChatServiceUrl()}/api/teamchat/direct-messages`,
		{
			method: "GET",
			headers: getAuthHeaders(),
			cache: "no-store",
		},
	);

	if (!response.ok) {
		const error = (await response.json().catch(() => ({
			error: "Failed to fetch direct message targets.",
		}))) as { error?: string };
		throw new Error(error.error || "Failed to fetch direct message targets.");
	}

	const data = (await response.json()) as unknown;
	return directMessageTargetsResponseSchema.parse(data).targets;
};

export const uploadAttachment = async (
	file: File,
): Promise<{ url: string; name: string; size: number }> => {
	const formData = new FormData();
	formData.append("file", file);

	const token = document.cookie
		.split("; ")
		.find((row) => row.startsWith("auth_session="))
		?.split("=")[1];

	const headers: HeadersInit = {};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
		headers["x-session-token"] = token;
	}

	const response = await fetch("/api/teamchat/upload", {
		method: "POST",
		headers,
		body: formData,
	});

	if (!response.ok) {
		const error = (await response.json().catch(() => ({
			error: "Failed to upload file.",
		}))) as { error?: string };
		throw new Error(error.error || "Failed to upload file.");
	}

	const data = (await response.json()) as unknown;
	return uploadAttachmentResponseSchema.parse(data);
};

export const fetchChatHealth = async (): Promise<boolean> => {
	const response = await fetch(`${getChatServiceUrl()}/health`, {
		method: "GET",
		headers: { "Content-Type": "application/json" },
		cache: "no-store",
	});
	if (!response.ok) {
		return false;
	}
	const payload = (await response.json().catch(() => ({}))) as {
		status?: string;
	};
	return payload.status === "ok";
};
