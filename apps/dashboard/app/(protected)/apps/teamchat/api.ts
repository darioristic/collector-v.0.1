import type {
	ChannelMemberSummary,
	ChannelSummary,
	MessageWithAuthor,
} from "@/lib/teamchat/types";
import {
	channelListResponseSchema,
	createDirectMessageSchema,
	createMessageSchema,
	directChannelResponseSchema,
	directMessageTargetsResponseSchema,
	messageResponseSchema,
	messagesResponseSchema,
	uploadAttachmentResponseSchema,
} from "@/lib/validations/teamchat";

const jsonHeaders = {
	"Content-Type": "application/json",
	Accept: "application/json",
} as const;

const handleResponse = async <T>(
	response: Response,
	schema: { parse: (input: unknown) => T },
) => {
	if (!response.ok) {
		let message = "Došlo je do greške.";
		try {
			const payload = (await response.json()) as { error?: string };
			if (payload?.error) {
				message = payload.error;
			}
		} catch {
			// ignore
		}
		throw new Error(message);
	}

	const payload = await response.json();
	return schema.parse(payload);
};

export const fetchChannels = async (): Promise<ChannelSummary[]> => {
	const response = await fetch("/api/teamchat/channels", {
		method: "GET",
		headers: jsonHeaders,
		cache: "no-store",
	});

	const payload = await handleResponse(response, channelListResponseSchema);
	return payload.channels.map((channel) => ({
		...channel,
		metadata:
			channel.metadata !== undefined ? (channel.metadata ?? null) : null,
	}));
};

export const fetchDirectMessageTargets = async (): Promise<
	ChannelMemberSummary[]
> => {
	const response = await fetch("/api/teamchat/direct-messages", {
		method: "GET",
		headers: jsonHeaders,
		cache: "no-store",
	});

	const payload = await handleResponse(
		response,
		directMessageTargetsResponseSchema,
	);
	return payload.members;
};

export const fetchMessages = async (
	channelId: string,
): Promise<MessageWithAuthor[]> => {
	const response = await fetch(
		`/api/teamchat/messages?channelId=${channelId}`,
		{
			method: "GET",
			headers: jsonHeaders,
			cache: "no-store",
		},
	);

	const payload = await handleResponse(response, messagesResponseSchema);
	return payload.messages;
};

export const sendMessage = async (payload: {
	channelId: string;
	content: string | null;
	fileUrl: string | null;
}): Promise<MessageWithAuthor> => {
	const body = createMessageSchema.parse(payload);

	const response = await fetch("/api/teamchat/messages", {
		method: "POST",
		headers: jsonHeaders,
		body: JSON.stringify(body),
	});

	const parsed = await handleResponse(response, messageResponseSchema);
	return parsed.message;
};

export const ensureDirectChannel = async (
	targetUserId: string,
): Promise<string> => {
	const body = createDirectMessageSchema.parse({ targetUserId });
	const response = await fetch("/api/teamchat/channels", {
		method: "POST",
		headers: jsonHeaders,
		body: JSON.stringify(body),
	});

	const payload = await handleResponse(response, directChannelResponseSchema);
	return payload.channelId;
};

export const uploadAttachment = async (file: File) => {
	const formData = new FormData();
	formData.append("file", file);

	const response = await fetch("/api/teamchat/upload", {
		method: "POST",
		body: formData,
		cache: "no-store",
	});

	return handleResponse(response, uploadAttachmentResponseSchema);
};
