export type ChannelMetadata =
	| {
			type: "dm";
			userIds: string[];
	  }
	| {
			type: "group";
	  }
	| {
			type: "custom";
			[key: string]: unknown;
	  };

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
	metadata: ChannelMetadata | null;
	unreadCount: number;
	lastMessageAt: Date | null;
	lastMessagePreview: string | null;
	members: ChannelMemberSummary[];
};

export type MessageAttachment = {
	url: string;
	name: string | null;
	size: number | null;
	mimeType: string | null;
};

export type MessageWithAuthor = {
	id: string;
	content: string | null;
	fileUrl: string | null;
	attachment: MessageAttachment | null;
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
