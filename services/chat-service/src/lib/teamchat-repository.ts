import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { companies } from "../db/schema/core.js";
import {
	type TeamChatChannel,
	teamchatChannelMembers,
	teamchatChannels,
	teamchatMessages,
	teamchatUsers,
} from "../db/schema/teamchat.js";
import type { CacheService } from "./cache.service.js";

// Cache keys
const CACHE_PREFIX = "chat:teamchat:";
const getChannelsListCacheKey = (companyId: string, userId: string) =>
	`${CACHE_PREFIX}channels:${companyId}:${userId}`;
const getChannelMessagesCacheKey = (channelId: string, limit: number) =>
	`${CACHE_PREFIX}messages:${channelId}:${limit}`;
const getDirectMessageTargetsCacheKey = (companyId: string, userId: string) =>
	`${CACHE_PREFIX}dm:targets:${companyId}:${userId}`;

// Global cache instance (will be set by server)
let globalCache: CacheService | null = null;

export const setCacheService = (cache: CacheService | null) => {
	globalCache = cache;
};

const parseMetadata = (
	metadata: string | null,
): {
	type: "dm" | "group" | "custom";
	userIds?: string[];
} | null => {
	if (!metadata) return null;
	try {
		const parsed = JSON.parse(metadata);
		return parsed;
	} catch {
		return null;
	}
};

const formatMetadata = (
	metadata: { type: "dm" | "group" | "custom"; userIds?: string[] } | null,
): string | null => {
	if (!metadata) return null;
	return JSON.stringify(metadata);
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
	attachment: null;
	senderId: string;
	senderName: string;
	senderEmail: string;
	senderAvatarUrl: string | null;
	channelId: string;
	createdAt: Date;
};

const buildChannelSummary = (
	channel: TeamChatChannel & {
		members: Array<{
			id: string;
			firstName: string;
			lastName: string;
			displayName: string | null;
			email: string;
			avatarUrl: string | null;
			status: string;
		}>;
		lastMessage?: {
			content: string | null;
			createdAt: Date;
		} | null;
		unreadCount?: number;
	}): ChannelSummary => {
	const metadata = parseMetadata(channel.metadata);
	const memberSummaries: ChannelMemberSummary[] = channel.members.map((m) => ({
		id: m.id,
		name:
			m.displayName ||
			[m.firstName, m.lastName].filter(Boolean).join(" ") ||
			m.email,
		email: m.email,
		avatarUrl: m.avatarUrl,
		status: m.status,
	}));

	return {
		id: channel.id,
		name: channel.name,
		isPrivate: channel.isPrivate,
		metadata: metadata as ChannelSummary["metadata"],
		unreadCount: channel.unreadCount || 0,
		lastMessageAt: channel.lastMessage?.createdAt || null,
		lastMessagePreview: channel.lastMessage?.content || null,
		members: memberSummaries,
	};
};

export const listChannels = async (
	companyId: string,
	userId: string,
	cache?: CacheService | null,
): Promise<ChannelSummary[]> => {
	const cacheService = cache || globalCache;
	const cacheKey = getChannelsListCacheKey(companyId, userId);

	// Try cache first
	if (cacheService) {
		const cached = await cacheService.get<ChannelSummary[]>(cacheKey);
		if (cached) {
			return cached;
		}
	}

	const userChannels = await db
		.select({
			channel: teamchatChannels,
			member: teamchatUsers,
		})
		.from(teamchatChannelMembers)
		.innerJoin(
			teamchatChannels,
			eq(teamchatChannelMembers.channelId, teamchatChannels.id),
		)
		.innerJoin(
			teamchatUsers,
			eq(teamchatChannelMembers.userId, teamchatUsers.id),
		)
		.where(
			and(
				eq(teamchatChannels.companyId, companyId),
				eq(teamchatChannelMembers.userId, userId),
			),
		);

	// Group by channel
	const channelMap = new Map<
		string,
		TeamChatChannel & {
			members: Array<{
				id: string;
				firstName: string;
				lastName: string;
				displayName: string | null;
				email: string;
				avatarUrl: string | null;
				status: string;
			}>;
		}
	>();

	for (const row of userChannels) {
		const channelId = row.channel.id;
		if (!channelMap.has(channelId)) {
			channelMap.set(channelId, {
				...row.channel,
				members: [],
			});
		}
		const channel = channelMap.get(channelId);
		if (!channel) continue;
		channel.members.push({
			id: row.member.id,
			firstName: row.member.firstName,
			lastName: row.member.lastName,
			displayName: row.member.displayName,
			email: row.member.email,
			avatarUrl: row.member.avatarUrl,
			status: row.member.status,
		});
	}

	// Get last messages and unread counts
	const channelIds = Array.from(channelMap.keys());
	if (channelIds.length === 0) {
		return [];
	}

	const lastMessages = await db
		.select({
			channelId: teamchatMessages.channelId,
			content: teamchatMessages.content,
			createdAt: teamchatMessages.createdAt,
		})
		.from(teamchatMessages)
		.where(inArray(teamchatMessages.channelId, channelIds))
		.orderBy(desc(teamchatMessages.createdAt));

	const lastMessageMap = new Map<
		string,
		{ content: string | null; createdAt: Date }
	>();
	for (const msg of lastMessages) {
		if (!lastMessageMap.has(msg.channelId)) {
			lastMessageMap.set(msg.channelId, {
				content: msg.content,
				createdAt: msg.createdAt,
			});
		}
	}

	// Get unread counts (simplified - count messages after lastReadAt)
	const unreadCounts = await db
		.select({
			channelId: teamchatChannelMembers.channelId,
			count: sql<number>`count(*)`,
		})
		.from(teamchatChannelMembers)
		.leftJoin(
			teamchatMessages,
			and(
				eq(teamchatMessages.channelId, teamchatChannelMembers.channelId),
				sql`${teamchatMessages.createdAt} > COALESCE(${teamchatChannelMembers.lastReadAt}, '1970-01-01'::timestamp)`,
			),
		)
		.where(
			and(
				inArray(teamchatChannelMembers.channelId, channelIds),
				eq(teamchatChannelMembers.userId, userId),
			),
		)
		.groupBy(teamchatChannelMembers.channelId);

	const unreadCountMap = new Map<string, number>();
	for (const row of unreadCounts) {
		unreadCountMap.set(row.channelId, Number(row.count) || 0);
	}

	// Build channel summaries
	const summaries: ChannelSummary[] = [];
	for (const channel of channelMap.values()) {
		summaries.push({
			...buildChannelSummary({
				...channel,
				lastMessage: lastMessageMap.get(channel.id) || null,
				unreadCount: unreadCountMap.get(channel.id) || 0,
			}),
		});
	}

	const sortedSummaries = summaries.sort((a, b) => {
		if (a.lastMessageAt && b.lastMessageAt) {
			return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
		}
		if (a.lastMessageAt) return -1;
		if (b.lastMessageAt) return 1;
		return 0;
	});

	// Cache result (TTL: 2 minutes - channels change frequently)
	if (cacheService) {
		await (cacheService as CacheService).set(cacheKey, sortedSummaries, { ttl: 120 });
	}

	return sortedSummaries;
};

export const listDirectMessageTargets = async (
	companyId: string,
	userId: string,
	cache?: CacheService | null,
): Promise<ChannelMemberSummary[]> => {
	const cacheService = cache || globalCache;
	const cacheKey = getDirectMessageTargetsCacheKey(companyId, userId);

	// Try cache first
	if (cacheService) {
		const cached = await cacheService.get<ChannelMemberSummary[]>(cacheKey);
		if (cached) {
			return cached;
		}
	}

	const users = await db
		.select()
		.from(teamchatUsers)
		.where(
			and(eq(teamchatUsers.companyId, companyId), ne(teamchatUsers.id, userId)),
		);

	const result = users.map((u) => ({
		id: u.id,
		name:
			u.displayName ||
			[u.firstName, u.lastName].filter(Boolean).join(" ") ||
			u.email,
		email: u.email,
		avatarUrl: u.avatarUrl,
		status: u.status,
	}));

	// Cache result (TTL: 5 minutes - users don't change frequently)
	if (cacheService) {
		await cacheService.set(cacheKey, result, { ttl: 300 });
	}

	return result;
};

export const getChannelMessages = async (
	channelId: string,
	userId: string,
	limit = 50,
	cache?: CacheService | null,
): Promise<MessageWithAuthor[]> => {
	const cacheService = cache || globalCache;
	const cacheKey = getChannelMessagesCacheKey(channelId, limit);

	// Try cache first (but only if user has access - we'll verify below)
	if (cacheService) {
		const cached = await cacheService.get<MessageWithAuthor[]>(cacheKey);
		if (cached) {
			// Still verify access before returning cached messages
			const [membership] = await db
				.select()
				.from(teamchatChannelMembers)
				.where(
					and(
						eq(teamchatChannelMembers.channelId, channelId),
						eq(teamchatChannelMembers.userId, userId),
					),
				)
				.limit(1);
			if (membership) {
				return cached;
			}
		}
	}

	// Verify user has access to channel
	const [membership] = await db
		.select()
		.from(teamchatChannelMembers)
		.where(
			and(
				eq(teamchatChannelMembers.channelId, channelId),
				eq(teamchatChannelMembers.userId, userId),
			),
		)
		.limit(1);

	if (!membership) {
		throw new Error("Access denied");
	}

	const messages = await db
		.select({
			message: teamchatMessages,
			sender: teamchatUsers,
		})
		.from(teamchatMessages)
		.innerJoin(teamchatUsers, eq(teamchatMessages.senderId, teamchatUsers.id))
		.where(eq(teamchatMessages.channelId, channelId))
		.orderBy(desc(teamchatMessages.createdAt))
		.limit(limit);

	const result = messages.reverse().map((row) => ({
		id: row.message.id,
		content: row.message.content,
		fileUrl: row.message.fileUrl,
		attachment: null,
		senderId: row.sender.id,
		senderName:
			row.sender.displayName ||
			[row.sender.firstName, row.sender.lastName].filter(Boolean).join(" ") ||
			row.sender.email,
		senderEmail: row.sender.email,
		senderAvatarUrl: row.sender.avatarUrl,
		channelId: row.message.channelId,
		createdAt: row.message.createdAt,
	}));

	// Cache result (TTL: 1 minute - messages change frequently)
	if (cacheService) {
		await cacheService.set(cacheKey, result, { ttl: 60 });
	}

	return result;
};

export const createMessage = async (
	channelId: string,
	senderId: string,
	content: string | null,
	fileUrl: string | null,
	cache?: CacheService | null,
): Promise<MessageWithAuthor> => {
	const cacheService = cache || globalCache;
	// Verify user has access to channel
	const [membership] = await db
		.select()
		.from(teamchatChannelMembers)
		.where(
			and(
				eq(teamchatChannelMembers.channelId, channelId),
				eq(teamchatChannelMembers.userId, senderId),
			),
		)
		.limit(1);

	if (!membership) {
		throw new Error("Access denied");
	}

	// Create message
	const [message] = await db
		.insert(teamchatMessages)
		.values({
			channelId,
			senderId,
			content,
			fileUrl,
		})
		.returning();

	if (!message) {
		throw new Error("Failed to create message");
	}

	// Update channel updatedAt
	await db
		.update(teamchatChannels)
		.set({ updatedAt: new Date() })
		.where(eq(teamchatChannels.id, channelId));

	// Get sender
	const [sender] = await db
		.select()
		.from(teamchatUsers)
		.where(eq(teamchatUsers.id, senderId))
		.limit(1);

	if (!sender) {
		throw new Error("Sender not found");
	}

	const messageWithAuthor: MessageWithAuthor = {
		id: message.id,
		content: message.content,
		fileUrl: message.fileUrl,
		attachment: null,
		senderId: sender.id,
		senderName:
			sender.displayName ||
			[sender.firstName, sender.lastName].filter(Boolean).join(" ") ||
			sender.email,
		senderEmail: sender.email,
		senderAvatarUrl: sender.avatarUrl,
		channelId: message.channelId,
		createdAt: message.createdAt,
	};

		// Invalidate cache for channel messages and channels list
		if (cacheService) {
			// Get channel info to invalidate user-specific channel lists
			const [channel] = await db
				.select({ companyId: teamchatChannels.companyId })
				.from(teamchatChannels)
				.where(eq(teamchatChannels.id, channelId))
				.limit(1);

			if (channel) {
				// Get all members to invalidate their channel lists
				const members = await db
					.select({ userId: teamchatChannelMembers.userId })
					.from(teamchatChannelMembers)
					.where(eq(teamchatChannelMembers.channelId, channelId));

				// Invalidate channel messages cache (all limits)
				await cacheService.deletePattern(`${CACHE_PREFIX}messages:${channelId}:*`);

				// Invalidate channels list for all members (batch delete)
				if (members.length > 0) {
					const cacheKeys = members.map((member) =>
						getChannelsListCacheKey(channel.companyId, member.userId)
					);
					await cacheService.deleteBatch(cacheKeys);
				}
			}
		}

	return messageWithAuthor;
};

export const upsertDirectMessageChannel = async (
	companyId: string,
	currentUserId: string,
	targetUserId: string,
): Promise<{ channelId: string; channel?: ChannelSummary }> => {
	// Find existing DM channel
	const existingChannels = await db
		.select({
			channel: teamchatChannels,
		})
		.from(teamchatChannels)
		.where(
			and(
				eq(teamchatChannels.companyId, companyId),
				eq(teamchatChannels.isPrivate, true),
				sql`${teamchatChannels.metadata}::jsonb->>'type' = 'dm'`,
				sql`${teamchatChannels.metadata}::jsonb->'userIds' @> ${JSON.stringify([currentUserId, targetUserId])}`,
			),
		)
		.limit(1);

	if (existingChannels.length > 0) {
		const channel = existingChannels[0].channel;
		return { channelId: channel.id };
	}

	// Create new DM channel
	const metadata = formatMetadata({
		type: "dm",
		userIds: [currentUserId, targetUserId],
	});

	const [channel] = await db
		.insert(teamchatChannels)
		.values({
			name: `DM: ${currentUserId}-${targetUserId}`,
			isPrivate: true,
			companyId,
			metadata,
		})
		.returning();

	if (!channel) {
		throw new Error("Failed to create channel");
	}

	// Add members
	await db.insert(teamchatChannelMembers).values([
		{ channelId: channel.id, userId: currentUserId },
		{ channelId: channel.id, userId: targetUserId },
	]);

	// Get channel summary
	const channels = await listChannels(companyId, currentUserId);
	const channelSummary = channels.find((c) => c.id === channel.id);

	return {
		channelId: channel.id,
		channel: channelSummary,
	};
};

