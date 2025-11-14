import { relations } from "drizzle-orm";
import {
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { companies } from "./core";
import { teamchatUsers } from "./teamchat";

export const chatMessageTypeEnum = pgEnum("chat_message_type", [
	"text",
	"file",
	"image",
	"video",
	"sound",
]);

export const chatMessageStatusEnum = pgEnum("chat_message_status", [
	"sent",
	"delivered",
	"read",
]);

export const chatConversations = pgTable(
	"chat_conversations",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId1: uuid("user_id_1")
			.notNull()
			.references(() => teamchatUsers.id, { onDelete: "cascade" }),
		userId2: uuid("user_id_2")
			.notNull()
			.references(() => teamchatUsers.id, { onDelete: "cascade" }),
		companyId: uuid("company_id")
			.notNull()
			.references(() => companies.id, { onDelete: "cascade" }),
		lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
		lastMessage: text("last_message"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		chatConversationsUsersUnique: uniqueIndex(
			"chat_conversations_users_unique",
		).on(table.userId1, table.userId2, table.companyId),
		chatConversationsUser1Idx: index("chat_conversations_user1_idx").on(
			table.userId1,
		),
		chatConversationsUser2Idx: index("chat_conversations_user2_idx").on(
			table.userId2,
		),
		chatConversationsCompanyIdx: index("chat_conversations_company_idx").on(
			table.companyId,
		),
	}),
);

export type ChatConversation = typeof chatConversations.$inferSelect;
export type NewChatConversation = typeof chatConversations.$inferInsert;

export const chatMessages = pgTable(
	"chat_messages",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		conversationId: uuid("conversation_id")
			.notNull()
			.references(() => chatConversations.id, { onDelete: "cascade" }),
		senderId: uuid("sender_id")
			.notNull()
			.references(() => teamchatUsers.id, { onDelete: "cascade" }),
		content: text("content"),
		type: chatMessageTypeEnum("type").default("text").notNull(),
		status: chatMessageStatusEnum("status").default("sent").notNull(),
		fileUrl: text("file_url"),
		fileMetadata: text("file_metadata"),
		readAt: timestamp("read_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		chatMessagesConversationIdx: index("chat_messages_conversation_idx").on(
			table.conversationId,
		),
		chatMessagesSenderIdx: index("chat_messages_sender_idx").on(table.senderId),
		chatMessagesCreatedAtIdx: index("chat_messages_created_at_idx").on(
			table.createdAt,
		),
	}),
);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export const chatConversationsRelations = relations(
	chatConversations,
	({ one, many }) => ({
		user1: one(teamchatUsers, {
			fields: [chatConversations.userId1],
			references: [teamchatUsers.id],
		}),
		user2: one(teamchatUsers, {
			fields: [chatConversations.userId2],
			references: [teamchatUsers.id],
		}),
		company: one(companies, {
			fields: [chatConversations.companyId],
			references: [companies.id],
		}),
		messages: many(chatMessages),
	}),
);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
	conversation: one(chatConversations, {
		fields: [chatMessages.conversationId],
		references: [chatConversations.id],
	}),
	sender: one(teamchatUsers, {
		fields: [chatMessages.senderId],
		references: [teamchatUsers.id],
	}),
}));
