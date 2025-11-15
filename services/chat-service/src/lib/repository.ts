import { and, asc, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/index.js";
import {
	type ChatConversation,
	type ChatMessage,
	chatConversations,
	chatMessages,
} from "../db/schema/chat.js";
import { teamchatUsers } from "../db/schema/teamchat.js";
import type { CacheService } from "./cache.service.js";

const senderAlias = alias(teamchatUsers, "sender");
const user1Alias = alias(teamchatUsers, "user1");
const user2Alias = alias(teamchatUsers, "user2");

/**
 * Ensure users exist in teamchat_users table
 * This syncs users from the main users table to teamchat_users
 */
async function ensureTeamchatUsers(userIds: string[], companyId: string): Promise<void> {
	if (userIds.length === 0) {
		return;
	}

	try {
		// Check which users already exist in teamchat_users
		const existingUsers = await db
			.select({ id: teamchatUsers.id })
			.from(teamchatUsers)
			.where(
				and(
					eq(teamchatUsers.companyId, companyId),
					inArray(teamchatUsers.id, userIds)
				)
			);

		const existingIds = new Set(existingUsers.map((u) => u.id));
		const missingIds = userIds.filter((id) => !existingIds.has(id));

		if (missingIds.length === 0) {
			return;
		}

		// Fetch user data from main users table using raw SQL
		// Note: users table is from API schema, not chat service schema
        const usersData = await db.execute(sql`
            SELECT 
                id,
                email,
                name,
                default_company_id as "defaultCompanyId"
            FROM users
            WHERE id = ANY(${sql.raw(`ARRAY[${missingIds.map((id) => `'${id}'::uuid`).join(",")}]`)})
        `);

        const foundIds = new Set<string>(usersData.rows.map((r: any) => r.id));
        const stillMissing = missingIds.filter((id) => !foundIds.has(id));
        if (usersData.rows.length === 0 && stillMissing.length === 0) {
            console.warn(`[chat-service] No users found in users table for IDs: ${missingIds.join(", ")}`);
        }

		// Create teamchat_users entries
        for (const userData of usersData.rows as Array<{
            id: string;
            email: string;
            name: string;
            defaultCompanyId: string | null;
        }>) {
            const nameParts = (userData.name || userData.email.split("@")[0]).split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            await db
                .insert(teamchatUsers)
                .values({
                    id: userData.id,
                    firstName,
                    lastName,
                    email: userData.email,
                    companyId: companyId,
                    status: "offline",
                })
                .onConflictDoUpdate({
                    target: teamchatUsers.email,
                    set: {
                        firstName,
                        lastName,
                        companyId: companyId,
                        updatedAt: new Date(),
                    },
                });
        }

        // Fallback: create placeholder teamchat users for IDs not present in users table
        if (stillMissing.length > 0) {
            for (const id of stillMissing) {
                const placeholderEmail = `user-${id}@placeholder.local`;
                await db
                    .insert(teamchatUsers)
                    .values({
                        id,
                        firstName: "User",
                        lastName: "Unknown",
                        email: placeholderEmail,
                        companyId,
                        status: "offline",
                    })
                    .onConflictDoNothing();
            }
        }
	} catch (error) {
		console.error("[chat-service] Error ensuring teamchat users:", error);
		// Don't throw - allow conversation loading to continue even if user sync fails
	}
}

type ChatMessageWithSender = Omit<
	ChatMessage,
	"createdAt" | "updatedAt" | "readAt"
> & {
	createdAt: string;
	updatedAt: string;
	readAt: string | null;
	sender: {
		id: string;
		firstName: string;
		lastName: string;
		displayName: string | null;
		email: string;
		avatarUrl: string | null;
	};
};

type ChatConversationWithUsers = Omit<
	ChatConversation,
	"createdAt" | "updatedAt" | "lastMessageAt"
> & {
	createdAt: string;
	updatedAt: string;
	lastMessageAt: string | null;
	unreadCount: number;
	user1: {
		id: string;
		firstName: string;
		lastName: string;
		displayName: string | null;
		email: string;
		avatarUrl: string | null;
		status: string;
	};
	user2: {
		id: string;
		firstName: string;
		lastName: string;
		displayName: string | null;
		email: string;
		avatarUrl: string | null;
		status: string;
	};
};

// Cache keys
const CACHE_PREFIX = "chat:";
const getConversationCacheKey = (companyId: string, userId1: string, userId2: string) =>
	`${CACHE_PREFIX}conversation:${companyId}:${userId1 < userId2 ? userId1 : userId2}:${userId1 < userId2 ? userId2 : userId1}`;
const getConversationsListCacheKey = (companyId: string, userId: string) =>
	`${CACHE_PREFIX}conversations:${companyId}:${userId}`;
const getUserStatusCacheKey = (companyId: string, userId: string) =>
	`${CACHE_PREFIX}user:status:${companyId}:${userId}`;
const getChannelMembershipCacheKey = (companyId: string, userId: string) =>
	`${CACHE_PREFIX}channels:${companyId}:${userId}`;

// Global cache instance (will be set by server)
let globalCache: CacheService | null = null;

export const setCacheService = (cache: CacheService | null) => {
	globalCache = cache;
};

export const findOrCreateConversation = async ({
  companyId,
  currentUserId,
  targetUserId,
  cache,
}: {
  companyId: string;
  currentUserId: string;
  targetUserId: string;
  cache?: CacheService | null;
}): Promise<ChatConversationWithUsers> => {
  const cacheService = cache || globalCache;
  // Resolve teamchat user IDs for both users (maps users.id -> teamchat_users.id)
  const resolveTeamchatId = async (userId: string): Promise<string> => {
    // Try direct match by id
    const [byId] = await db
      .select({ id: teamchatUsers.id })
      .from(teamchatUsers)
      .where(and(eq(teamchatUsers.companyId, companyId), eq(teamchatUsers.id, userId)))
      .limit(1);
    if (byId) return byId.id;

    // Fetch user to get email/name
    const usersData = await db.execute(sql`
      SELECT id, email, name FROM users WHERE id = ${userId} LIMIT 1
    `);
    const user = usersData.rows[0] as { id: string; email: string; name: string } | undefined;
    if (!user) {
      // As last resort, create placeholder teamchat user with provided id
      const [created] = await db
        .insert(teamchatUsers)
        .values({
          id: userId,
          firstName: "User",
          lastName: "Unknown",
          email: `user-${userId}@placeholder.local`,
          companyId,
          status: "offline",
        })
        .onConflictDoNothing()
        .returning();
      return created ? created.id : userId;
    }

    const nameParts = (user.name || user.email.split("@")[0]).split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Try match by email to reuse existing teamchat user id
    const [byEmail] = await db
      .select({ id: teamchatUsers.id })
      .from(teamchatUsers)
      .where(and(eq(teamchatUsers.companyId, companyId), eq(teamchatUsers.email, user.email)))
      .limit(1);
    if (byEmail) return byEmail.id;

    // Create new teamchat user with the same id as users.id
    const [created] = await db
      .insert(teamchatUsers)
      .values({
        id: user.id,
        firstName,
        lastName,
        email: user.email,
        companyId,
        status: "offline",
      })
      .onConflictDoNothing()
      .returning();
    return created ? created.id : user.id;
  };

  const teamchatIdCurrent = await resolveTeamchatId(currentUserId);
  const teamchatIdTarget = await resolveTeamchatId(targetUserId);

  const userId1 = teamchatIdCurrent < teamchatIdTarget ? teamchatIdCurrent : teamchatIdTarget;
  const userId2 = teamchatIdCurrent < teamchatIdTarget ? teamchatIdTarget : teamchatIdCurrent;

	// Try cache first
	const cacheKey = getConversationCacheKey(companyId, userId1, userId2);
	if (cacheService) {
		const cached = await cacheService.get<ChatConversationWithUsers>(cacheKey);
		if (cached) {
			return cached;
		}
	}

	const [existing] = await db
		.select({
			id: chatConversations.id,
			userId1: chatConversations.userId1,
			userId2: chatConversations.userId2,
			companyId: chatConversations.companyId,
			lastMessageAt: chatConversations.lastMessageAt,
			lastMessage: chatConversations.lastMessage,
			createdAt: chatConversations.createdAt,
			updatedAt: chatConversations.updatedAt,
			user1Id: user1Alias.id,
			user1FirstName: user1Alias.firstName,
			user1LastName: user1Alias.lastName,
			user1DisplayName: user1Alias.displayName,
			user1Email: user1Alias.email,
			user1AvatarUrl: user1Alias.avatarUrl,
			user1Status: user1Alias.status,
			user2Id: user2Alias.id,
			user2FirstName: user2Alias.firstName,
			user2LastName: user2Alias.lastName,
			user2DisplayName: user2Alias.displayName,
			user2Email: user2Alias.email,
			user2AvatarUrl: user2Alias.avatarUrl,
			user2Status: user2Alias.status,
		})
		.from(chatConversations)
		.innerJoin(user1Alias, eq(chatConversations.userId1, user1Alias.id))
		.innerJoin(user2Alias, eq(chatConversations.userId2, user2Alias.id))
		.where(
			and(
				eq(chatConversations.companyId, companyId),
				eq(chatConversations.userId1, userId1),
				eq(chatConversations.userId2, userId2),
			),
		)
		.limit(1);

	if (existing) {
		// Get unread count for this conversation
		const [unreadResult] = await db
			.select({
				count: sql<number>`COUNT(*)::int`,
			})
			.from(chatMessages)
			.where(
				and(
					eq(chatMessages.conversationId, existing.id),
					ne(chatMessages.senderId, currentUserId),
					isNull(chatMessages.readAt),
				),
			);

		const unreadCount = Number(unreadResult?.count) || 0;

		const result = {
			id: existing.id,
			userId1: existing.userId1,
			userId2: existing.userId2,
			companyId: existing.companyId,
			lastMessageAt: existing.lastMessageAt
				? existing.lastMessageAt.toISOString()
				: null,
			lastMessage: existing.lastMessage,
			unreadCount,
			createdAt: existing.createdAt.toISOString(),
			updatedAt: existing.updatedAt.toISOString(),
			user1: {
				id: existing.user1Id,
				firstName: existing.user1FirstName,
				lastName: existing.user1LastName,
				displayName: existing.user1DisplayName,
				email: existing.user1Email,
				avatarUrl: existing.user1AvatarUrl,
				status: existing.user1Status,
			},
			user2: {
				id: existing.user2Id,
				firstName: existing.user2FirstName,
				lastName: existing.user2LastName,
				displayName: existing.user2DisplayName,
				email: existing.user2Email,
				avatarUrl: existing.user2AvatarUrl,
				status: existing.user2Status,
			},
		};

		// Cache result (TTL: 5 minutes)
		if (cacheService) {
			await cacheService.set(cacheKey, result, { ttl: 300 });
			// Also invalidate conversations list cache
			await cacheService.delete(
				getConversationsListCacheKey(companyId, currentUserId),
				getConversationsListCacheKey(companyId, targetUserId)
			);
		}

		return result;
	}

	const now = new Date();
  const [conversation] = await db
    .insert(chatConversations)
    .values({
      userId1,
      userId2,
      companyId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

	if (!conversation) {
		throw new Error("Kreiranje konverzacije nije uspelo.");
	}

	const [conversationWithUsers] = await db
		.select({
			id: chatConversations.id,
			userId1: chatConversations.userId1,
			userId2: chatConversations.userId2,
			companyId: chatConversations.companyId,
			lastMessageAt: chatConversations.lastMessageAt,
			lastMessage: chatConversations.lastMessage,
			createdAt: chatConversations.createdAt,
			updatedAt: chatConversations.updatedAt,
			user1Id: user1Alias.id,
			user1FirstName: user1Alias.firstName,
			user1LastName: user1Alias.lastName,
			user1DisplayName: user1Alias.displayName,
			user1Email: user1Alias.email,
			user1AvatarUrl: user1Alias.avatarUrl,
			user1Status: user1Alias.status,
			user2Id: user2Alias.id,
			user2FirstName: user2Alias.firstName,
			user2LastName: user2Alias.lastName,
			user2DisplayName: user2Alias.displayName,
			user2Email: user2Alias.email,
			user2AvatarUrl: user2Alias.avatarUrl,
			user2Status: user2Alias.status,
		})
		.from(chatConversations)
		.innerJoin(user1Alias, eq(chatConversations.userId1, user1Alias.id))
		.innerJoin(user2Alias, eq(chatConversations.userId2, user2Alias.id))
		.where(eq(chatConversations.id, conversation.id))
		.limit(1);

	if (!conversationWithUsers) {
		throw new Error("Preuzimanje konverzacije nije uspelo.");
	}

	// New conversation has no unread messages
	const unreadCount = 0;

	const result = {
		id: conversationWithUsers.id,
		userId1: conversationWithUsers.userId1,
		userId2: conversationWithUsers.userId2,
		companyId: conversationWithUsers.companyId,
		lastMessageAt: conversationWithUsers.lastMessageAt
			? conversationWithUsers.lastMessageAt.toISOString()
			: null,
		lastMessage: conversationWithUsers.lastMessage,
		unreadCount,
		createdAt: conversationWithUsers.createdAt.toISOString(),
		updatedAt: conversationWithUsers.updatedAt.toISOString(),
		user1: {
			id: conversationWithUsers.user1Id,
			firstName: conversationWithUsers.user1FirstName,
			lastName: conversationWithUsers.user1LastName,
			displayName: conversationWithUsers.user1DisplayName,
			email: conversationWithUsers.user1Email,
			avatarUrl: conversationWithUsers.user1AvatarUrl,
			status: conversationWithUsers.user1Status,
		},
		user2: {
			id: conversationWithUsers.user2Id,
			firstName: conversationWithUsers.user2FirstName,
			lastName: conversationWithUsers.user2LastName,
			displayName: conversationWithUsers.user2DisplayName,
			email: conversationWithUsers.user2Email,
			avatarUrl: conversationWithUsers.user2AvatarUrl,
			status: conversationWithUsers.user2Status,
		},
	};

	// Cache new conversation (TTL: 5 minutes)
	if (cacheService) {
		await cacheService.set(cacheKey, result, { ttl: 300 });
		// Invalidate conversations list cache
		await cacheService.delete(
			getConversationsListCacheKey(companyId, currentUserId),
			getConversationsListCacheKey(companyId, targetUserId)
		);
	}

	return result;
};

export const getConversations = async ({
  companyId,
  userId,
  cache,
}: {
  companyId: string;
  userId: string;
  cache?: CacheService | null;
}): Promise<ChatConversationWithUsers[]> => {
  const cacheService = cache || globalCache;
  // Resolve teamchat user id for the current user
  const resolveTeamchatId = async (id: string): Promise<string> => {
    const [byId] = await db
      .select({ id: teamchatUsers.id })
      .from(teamchatUsers)
      .where(and(eq(teamchatUsers.companyId, companyId), eq(teamchatUsers.id, id)))
      .limit(1);
    if (byId) return byId.id;
        const usersData = await db.execute(sql`SELECT id, email, name FROM users WHERE id = ${id} LIMIT 1`);
    const user = usersData.rows[0] as { id: string; email: string; name: string } | undefined;
    if (!user) return id;
    const [byEmail] = await db
      .select({ id: teamchatUsers.id })
      .from(teamchatUsers)
      .where(and(eq(teamchatUsers.companyId, companyId), eq(teamchatUsers.email, user.email)))
      .limit(1);
    return byEmail ? byEmail.id : id;
  };

  const teamchatUserId = await resolveTeamchatId(userId);
  const cacheKey = getConversationsListCacheKey(companyId, teamchatUserId);

	// Try cache first
	if (cacheService) {
		const cached = await cacheService.get<ChatConversationWithUsers[]>(cacheKey);
		if (cached) {
			return cached;
		}
	}
  // Ensure current user exists in teamchat_users (by id or email)
  await ensureTeamchatUsers([userId], companyId);

	// First, get all conversation IDs for this user
  const conversationIds = await db
    .select({ id: chatConversations.id, userId1: chatConversations.userId1, userId2: chatConversations.userId2 })
    .from(chatConversations)
    .where(
      and(
        eq(chatConversations.companyId, companyId),
        or(
          eq(chatConversations.userId1, teamchatUserId),
          eq(chatConversations.userId2, teamchatUserId),
        ),
      ),
    );

	// Collect all unique user IDs from conversations
	const allUserIds = new Set<string>();
	conversationIds.forEach((conv) => {
		allUserIds.add(conv.userId1);
		allUserIds.add(conv.userId2);
	});

	// Ensure all users in conversations exist in teamchat_users
	if (allUserIds.size > 0) {
		await ensureTeamchatUsers(Array.from(allUserIds), companyId);
	}

	const rows = await db
		.select({
			id: chatConversations.id,
			userId1: chatConversations.userId1,
			userId2: chatConversations.userId2,
			companyId: chatConversations.companyId,
			lastMessageAt: chatConversations.lastMessageAt,
			lastMessage: chatConversations.lastMessage,
			createdAt: chatConversations.createdAt,
			updatedAt: chatConversations.updatedAt,
			user1Id: user1Alias.id,
			user1FirstName: user1Alias.firstName,
			user1LastName: user1Alias.lastName,
			user1DisplayName: user1Alias.displayName,
			user1Email: user1Alias.email,
			user1AvatarUrl: user1Alias.avatarUrl,
			user1Status: user1Alias.status,
			user2Id: user2Alias.id,
			user2FirstName: user2Alias.firstName,
			user2LastName: user2Alias.lastName,
			user2DisplayName: user2Alias.displayName,
			user2Email: user2Alias.email,
			user2AvatarUrl: user2Alias.avatarUrl,
			user2Status: user2Alias.status,
		})
		.from(chatConversations)
		.innerJoin(user1Alias, eq(chatConversations.userId1, user1Alias.id))
		.innerJoin(user2Alias, eq(chatConversations.userId2, user2Alias.id))
		.where(
			and(
				eq(chatConversations.companyId, companyId),
				or(
					eq(chatConversations.userId1, teamchatUserId),
					eq(chatConversations.userId2, teamchatUserId),
				),
			),
		)
		.orderBy(
			desc(chatConversations.lastMessageAt),
			desc(chatConversations.updatedAt),
		);

	// Get unread counts for all conversations
	const conversationIdsList = rows.map((row) => row.id);
  const unreadCounts = conversationIdsList.length > 0
    ? await db
        .select({
          conversationId: chatMessages.conversationId,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(chatMessages)
        .where(
          and(
            inArray(chatMessages.conversationId, conversationIdsList),
            ne(chatMessages.senderId, teamchatUserId),
            isNull(chatMessages.readAt),
          ),
        )
        .groupBy(chatMessages.conversationId)
    : [];

	const unreadCountMap = new Map<string, number>();
	for (const item of unreadCounts) {
		unreadCountMap.set(item.conversationId, Number(item.count) || 0);
	}

	const result = rows.map((row) => ({
		id: row.id,
		userId1: row.userId1,
		userId2: row.userId2,
		companyId: row.companyId,
		lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
		lastMessage: row.lastMessage,
		unreadCount: unreadCountMap.get(row.id) || 0,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		user1: {
			id: row.user1Id,
			firstName: row.user1FirstName,
			lastName: row.user1LastName,
			displayName: row.user1DisplayName,
			email: row.user1Email,
			avatarUrl: row.user1AvatarUrl,
			status: row.user1Status,
		},
		user2: {
			id: row.user2Id,
			firstName: row.user2FirstName,
			lastName: row.user2LastName,
			displayName: row.user2DisplayName,
			email: row.user2Email,
			avatarUrl: row.user2AvatarUrl,
			status: row.user2Status,
		},
	}));

	// Cache result (TTL: 2 minutes - shorter because conversations change frequently)
	if (cacheService) {
		await cacheService.set(cacheKey, result, { ttl: 120 });
	}

	return result;
};

export const getConversationMessages = async ({
    conversationId,
    userId,
    limit = 50,
}: {
    conversationId: string;
    userId: string;
    limit?: number;
}): Promise<ChatMessageWithSender[]> => {
    // Resolve teamchat user id for the current user
    const resolveTeamchatId = async (id: string): Promise<string> => {
        const [byId] = await db
            .select({ id: teamchatUsers.id })
            .from(teamchatUsers)
            .where(eq(teamchatUsers.id, id))
            .limit(1);
        if (byId) return byId.id;
        const usersData = await db.execute(sql`SELECT id, email, name FROM users WHERE id = ${id} LIMIT 1`);
        const user = usersData.rows[0] as { id: string; email: string; name: string } | undefined;
        if (!user) return id;
        const [byEmail] = await db
            .select({ id: teamchatUsers.id })
            .from(teamchatUsers)
            .where(eq(teamchatUsers.email, user.email))
            .limit(1);
        return byEmail ? byEmail.id : id;
    };

    const teamchatUserId = await resolveTeamchatId(userId);
	const messages = await db
		.select({
			id: chatMessages.id,
			conversationId: chatMessages.conversationId,
			senderId: chatMessages.senderId,
			content: chatMessages.content,
			type: chatMessages.type,
			status: chatMessages.status,
			fileUrl: chatMessages.fileUrl,
			fileMetadata: chatMessages.fileMetadata,
			readAt: chatMessages.readAt,
			createdAt: chatMessages.createdAt,
			updatedAt: chatMessages.updatedAt,
			senderId2: senderAlias.id,
			senderFirstName: senderAlias.firstName,
			senderLastName: senderAlias.lastName,
			senderDisplayName: senderAlias.displayName,
			senderEmail: senderAlias.email,
			senderAvatarUrl: senderAlias.avatarUrl,
		})
		.from(chatMessages)
		.innerJoin(senderAlias, eq(chatMessages.senderId, senderAlias.id))
		.where(eq(chatMessages.conversationId, conversationId))
		.orderBy(asc(chatMessages.createdAt))
		.limit(limit);

	const result = messages.map((msg) => ({
		id: msg.id,
		conversationId: msg.conversationId,
		senderId: msg.senderId,
		content: msg.content,
		type: msg.type,
		status: msg.status,
		fileUrl: msg.fileUrl,
		fileMetadata: msg.fileMetadata,
		readAt: msg.readAt ? msg.readAt.toISOString() : null,
		createdAt: msg.createdAt.toISOString(),
		updatedAt: msg.updatedAt.toISOString(),
		sender: {
			id: msg.senderId2,
			firstName: msg.senderFirstName,
			lastName: msg.senderLastName,
			displayName: msg.senderDisplayName,
			email: msg.senderEmail,
			avatarUrl: msg.senderAvatarUrl,
		},
	}));

    await markMessagesAsRead({
        conversationId,
        userId: teamchatUserId,
    });

	return result;
};

export const createMessage = async ({
	conversationId,
	senderId,
	content,
	type = "text",
	fileUrl,
	fileMetadata,
	cache,
}: {
	conversationId: string;
	senderId: string;
	content?: string | null;
	type?: "text" | "file" | "image" | "video" | "sound";
	fileUrl?: string | null;
	fileMetadata?: string | null;
	cache?: CacheService | null;
}): Promise<ChatMessageWithSender> => {
	const cacheService = cache || globalCache;
	const now = new Date();

	const [message] = await db
		.insert(chatMessages)
		.values({
			conversationId,
			senderId,
			content,
			type,
			status: "sent",
			fileUrl,
			fileMetadata,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	if (!message) {
		throw new Error("Slanje poruke nije uspelo.");
	}

	await db
		.update(chatConversations)
		.set({
			lastMessageAt: now,
			lastMessage: content ?? (fileUrl ? "Attachment" : null),
			updatedAt: now,
		})
		.where(eq(chatConversations.id, conversationId));

	const [sender] = await db
		.select({
			id: teamchatUsers.id,
			firstName: teamchatUsers.firstName,
			lastName: teamchatUsers.lastName,
			displayName: teamchatUsers.displayName,
			email: teamchatUsers.email,
			avatarUrl: teamchatUsers.avatarUrl,
		})
		.from(teamchatUsers)
		.where(eq(teamchatUsers.id, senderId))
		.limit(1);

	if (!sender) {
		throw new Error("Korisnik nije pronađen.");
	}

	const result = {
		id: message.id,
		conversationId: message.conversationId,
		senderId: message.senderId,
		content: message.content,
		type: message.type,
		status: message.status,
		fileUrl: message.fileUrl,
		fileMetadata: message.fileMetadata,
		readAt: message.readAt ? message.readAt.toISOString() : null,
		createdAt: message.createdAt.toISOString(),
		updatedAt: message.updatedAt.toISOString(),
		sender: {
			id: sender.id,
			firstName: sender.firstName,
			lastName: sender.lastName,
			displayName: sender.displayName,
			email: sender.email,
			avatarUrl: sender.avatarUrl,
		},
	};

	// Invalidate conversation cache when new message is created
	if (cacheService) {
		// Get conversation to find both users
		const [conv] = await db
			.select({
				userId1: chatConversations.userId1,
				userId2: chatConversations.userId2,
				companyId: chatConversations.companyId,
			})
			.from(chatConversations)
			.where(eq(chatConversations.id, conversationId))
			.limit(1);

		if (conv) {
			const userId1 = conv.userId1 < conv.userId2 ? conv.userId1 : conv.userId2;
			const userId2 = conv.userId1 < conv.userId2 ? conv.userId2 : conv.userId1;
			await cacheService.delete(
				getConversationCacheKey(conv.companyId, userId1, userId2),
				getConversationsListCacheKey(conv.companyId, conv.userId1),
				getConversationsListCacheKey(conv.companyId, conv.userId2)
			);
		}
	}

	return result;
};

export const markMessagesAsRead = async ({
    conversationId,
    userId,
}: {
    conversationId: string;
    userId: string;
}): Promise<void> => {
    const now = new Date();

    await db
        .update(chatMessages)
        .set({
            status: "read",
            readAt: now,
            updatedAt: now,
        })
        .where(
            and(
                eq(chatMessages.conversationId, conversationId),
                ne(chatMessages.senderId, userId),
                isNull(chatMessages.readAt),
            ),
        );
};

export const invalidateConversationCaches = async ({
    companyId,
    userId1,
    userId2,
    cache,
}: {
    companyId: string;
    userId1: string;
    userId2: string;
    cache?: CacheService | null;
}): Promise<void> => {
    const cacheService = cache || globalCache;
    if (!cacheService) return;
    const a = userId1 < userId2 ? userId1 : userId2;
    const b = userId1 < userId2 ? userId2 : userId1;
    await cacheService.delete(
        `${CACHE_PREFIX}conversation:${companyId}:${a}:${b}`,
        `${CACHE_PREFIX}conversations:${companyId}:${userId1}`,
        `${CACHE_PREFIX}conversations:${companyId}:${userId2}`
    );
};

export const getConversationById = async ({
    conversationId,
    userId,
}: {
    conversationId: string;
    userId: string;
}): Promise<ChatConversationWithUsers | null> => {
    // Resolve teamchat user id for access checks
    const resolveTeamchatId = async (id: string): Promise<string> => {
        const [byId] = await db
            .select({ id: teamchatUsers.id })
            .from(teamchatUsers)
            .where(eq(teamchatUsers.id, id))
            .limit(1);
        if (byId) return byId.id;
        const usersData = await db.execute(sql`SELECT id, email, name FROM users WHERE id = ${id} LIMIT 1`);
        const user = usersData.rows[0] as { id: string; email: string; name: string } | undefined;
        if (!user) return id;
        const [byEmail] = await db
            .select({ id: teamchatUsers.id })
            .from(teamchatUsers)
            .where(eq(teamchatUsers.email, user.email))
            .limit(1);
        return byEmail ? byEmail.id : id;
    };

    const teamchatUserId = await resolveTeamchatId(userId);
	const [row] = await db
		.select({
			id: chatConversations.id,
			userId1: chatConversations.userId1,
			userId2: chatConversations.userId2,
			companyId: chatConversations.companyId,
			lastMessageAt: chatConversations.lastMessageAt,
			lastMessage: chatConversations.lastMessage,
			createdAt: chatConversations.createdAt,
			updatedAt: chatConversations.updatedAt,
			user1Id: user1Alias.id,
			user1FirstName: user1Alias.firstName,
			user1LastName: user1Alias.lastName,
			user1DisplayName: user1Alias.displayName,
			user1Email: user1Alias.email,
			user1AvatarUrl: user1Alias.avatarUrl,
			user1Status: user1Alias.status,
			user2Id: user2Alias.id,
			user2FirstName: user2Alias.firstName,
			user2LastName: user2Alias.lastName,
			user2DisplayName: user2Alias.displayName,
			user2Email: user2Alias.email,
			user2AvatarUrl: user2Alias.avatarUrl,
			user2Status: user2Alias.status,
		})
		.from(chatConversations)
		.innerJoin(user1Alias, eq(chatConversations.userId1, user1Alias.id))
		.innerJoin(user2Alias, eq(chatConversations.userId2, user2Alias.id))
        .where(
            and(
                eq(chatConversations.id, conversationId),
                or(
                    eq(chatConversations.userId1, teamchatUserId),
                    eq(chatConversations.userId2, teamchatUserId),
                ),
            ),
        )
		.limit(1);

	if (!row) {
		return null;
	}

	// Get unread count for this conversation
	const [unreadResult] = await db
		.select({
			count: sql<number>`COUNT(*)::int`,
		})
		.from(chatMessages)
        .where(
            and(
                eq(chatMessages.conversationId, row.id),
                ne(chatMessages.senderId, teamchatUserId),
                isNull(chatMessages.readAt),
            ),
        );

	const unreadCount = Number(unreadResult?.count) || 0;

	return {
		id: row.id,
		userId1: row.userId1,
		userId2: row.userId2,
		companyId: row.companyId,
		lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
		lastMessage: row.lastMessage,
		unreadCount,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		user1: {
			id: row.user1Id,
			firstName: row.user1FirstName,
			lastName: row.user1LastName,
			displayName: row.user1DisplayName,
			email: row.user1Email,
			avatarUrl: row.user1AvatarUrl,
			status: row.user1Status,
		},
		user2: {
			id: row.user2Id,
			firstName: row.user2FirstName,
			lastName: row.user2LastName,
			displayName: row.user2DisplayName,
			email: row.user2Email,
			avatarUrl: row.user2AvatarUrl,
			status: row.user2Status,
		},
	};
};

export type { ChatMessageWithSender, ChatConversationWithUsers };

