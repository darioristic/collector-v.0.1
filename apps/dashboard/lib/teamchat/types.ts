export type ChannelMemberSummary = {
	id: string;
	name: string;
	email: string;
	avatarUrl: string | null;
	status: string;
};

export type ChannelSummary = {
	id: string;
	name: string;
	isPrivate: boolean;
	metadata: {
		type: "dm" | "group" | "custom";
		userIds?: string[];
	} | null;
	unreadCount: number;
	lastMessageAt: Date | null;
	lastMessagePreview: string | null;
	members: ChannelMemberSummary[];
};

export type MessageWithAuthor = {
	id: string;
	content: string | null;
	fileUrl: string | null;
	attachment: {
		url: string;
		name: string | null;
		size: number | null;
		mimeType: string | null;
	} | null;
	senderId: string;
	senderName: string;
	senderEmail: string;
	senderAvatarUrl: string | null;
	channelId: string;
	createdAt: Date;
};

export type TeamChatBootstrap = {
	currentUser: ChannelMemberSummary;
	channels: ChannelSummary[];
	directMessageTargets: ChannelMemberSummary[];
};
