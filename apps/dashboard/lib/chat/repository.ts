import { readFile } from "node:fs/promises";
import { and, asc, desc, eq, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/lib/db";
import {
	type ChatConversation,
	type ChatMessage,
	chatConversations,
	chatMessages,
} from "@/lib/db/schema/chat";
import { teamchatUsers } from "@/lib/db/schema/teamchat";
import { ensureTeamChatSchemaReady } from "@/lib/teamchat/repository";

let chatSchemaInitializationPromise: Promise<void> | null = null;

const ensureChatSchema = async (db: Awaited<ReturnType<typeof getDb>>) => {
	if (chatSchemaInitializationPromise) {
		await chatSchemaInitializationPromise;
		return;
	}

	chatSchemaInitializationPromise = (async () => {
		try {
			await db.execute(sql.raw('select 1 from "chat_conversations" limit 1;'));
			return;
		} catch (error) {
			console.warn("[chat] Schema check failed, applying migrations", error);
		}

		try {
			// Use absolute path from current working directory (apps/dashboard)
			const migrationPath = `${process.cwd()}/lib/db/migrations/0009_create_chat.sql`;
			const ddl = await readFile(migrationPath, "utf8");
			// Split by semicolon followed by whitespace and newlines
			const statements = ddl
				.split(/;\s*(?=[\r\n])/)
				.map((statement) => statement.trim())
				.filter(
					(statement) =>
						statement.trim().length > 0 && !statement.match(/^\s*$/),
				);

			for (const statement of statements) {
				const trimmed = statement.trim();
				if (trimmed.length > 0) {
					try {
						// Ensure statement ends with semicolon
						const sqlStatement = trimmed.endsWith(";")
							? trimmed
							: `${trimmed};`;
						await db.execute(sql.raw(sqlStatement));
					} catch (stmtError) {
						// Check if error is about already existing objects (CREATE TYPE IF NOT EXISTS, CREATE TABLE IF NOT EXISTS)
						const errorMessage =
							stmtError instanceof Error
								? stmtError.message
								: String(stmtError);
						if (
							errorMessage.includes("already exists") ||
							errorMessage.includes("duplicate") ||
							(errorMessage.includes("relation") &&
								errorMessage.includes("already"))
						) {
							// Ignore errors for objects that already exist
							console.warn(
								"[chat] Migration statement skipped (already exists):",
								trimmed.substring(0, 50),
							);
						} else {
							console.error("[chat] Migration statement error:", stmtError);
							console.error(
								"[chat] Failed statement:",
								trimmed.substring(0, 100),
							);
							// Don't throw - continue with other statements
						}
					}
				}
			}
		} catch (error) {
			console.error("[chat] Failed to apply migrations", error);
			// Don't throw - schema might already exist
		}
	})();

	await chatSchemaInitializationPromise;
};

export const ensureChatSchemaReady = async () => {
	await ensureTeamChatSchemaReady();
	const db = await getDb();
	await ensureChatSchema(db);
	return db;
};

const senderAlias = alias(teamchatUsers, "sender");
const user1Alias = alias(teamchatUsers, "user1");
const user2Alias = alias(teamchatUsers, "user2");

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

export const findOrCreateConversation = async ({
	companyId,
	currentUserId,
	targetUserId,
}: {
	companyId: string;
	currentUserId: string;
	targetUserId: string;
}): Promise<ChatConversationWithUsers> => {
	const db = await ensureChatSchemaReady();

	const userId1 = currentUserId < targetUserId ? currentUserId : targetUserId;
	const userId2 = currentUserId < targetUserId ? targetUserId : currentUserId;

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
		return {
			id: existing.id,
			userId1: existing.userId1,
			userId2: existing.userId2,
			companyId: existing.companyId,
			lastMessageAt: existing.lastMessageAt
				? existing.lastMessageAt.toISOString()
				: null,
			lastMessage: existing.lastMessage,
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

	return {
		id: conversationWithUsers.id,
		userId1: conversationWithUsers.userId1,
		userId2: conversationWithUsers.userId2,
		companyId: conversationWithUsers.companyId,
		lastMessageAt: conversationWithUsers.lastMessageAt
			? conversationWithUsers.lastMessageAt.toISOString()
			: null,
		lastMessage: conversationWithUsers.lastMessage,
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
};

export const getConversations = async ({
	companyId,
	userId,
}: {
	companyId: string;
	userId: string;
}): Promise<ChatConversationWithUsers[]> => {
	const db = await ensureChatSchemaReady();

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
					eq(chatConversations.userId1, userId),
					eq(chatConversations.userId2, userId),
				),
			),
		)
		.orderBy(
			desc(chatConversations.lastMessageAt),
			desc(chatConversations.updatedAt),
		);

	return rows.map((row) => ({
		id: row.id,
		userId1: row.userId1,
		userId2: row.userId2,
		companyId: row.companyId,
		lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
		lastMessage: row.lastMessage,
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
	const db = await ensureChatSchemaReady();

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
		userId,
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
}: {
	conversationId: string;
	senderId: string;
	content?: string | null;
	type?: "text" | "file" | "image" | "video" | "sound";
	fileUrl?: string | null;
	fileMetadata?: string | null;
}): Promise<ChatMessageWithSender> => {
	const db = await ensureChatSchemaReady();
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

	return {
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
};

export const markMessagesAsRead = async ({
	conversationId,
	userId,
}: {
	conversationId: string;
	userId: string;
}): Promise<void> => {
	const db = await ensureChatSchemaReady();
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
				eq(chatMessages.status, "sent"),
			),
		);
};

export const getConversationById = async ({
	conversationId,
	userId,
}: {
	conversationId: string;
	userId: string;
}): Promise<ChatConversationWithUsers | null> => {
	const db = await ensureChatSchemaReady();

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
					eq(chatConversations.userId1, userId),
					eq(chatConversations.userId2, userId),
				),
			),
		)
		.limit(1);

	if (!row) {
		return null;
	}

	return {
		id: row.id,
		userId1: row.userId1,
		userId2: row.userId2,
		companyId: row.companyId,
		lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
		lastMessage: row.lastMessage,
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
