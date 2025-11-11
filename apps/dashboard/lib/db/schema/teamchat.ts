import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { companies as baseCompanies } from "./core";

export const companies = baseCompanies;

export type Company = typeof companies.$inferSelect;

export const users = pgTable(
	"users",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		firstName: text("first_name").notNull(),
		lastName: text("last_name").notNull(),
		displayName: text("display_name"),
		email: text("email").notNull(),
		role: text("role").default("MEMBER").notNull(),
		status: text("status").default("offline").notNull(),
		avatarUrl: text("avatar_url"),
		companyId: uuid("company_id")
			.notNull()
			.references(() => companies.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		usersEmailUnique: uniqueIndex("users_email_unique").on(table.email),
		usersCompanyIdx: index("users_company_idx").on(table.companyId),
		usersStatusIdx: index("users_status_idx").on(table.status),
	}),
);

export type User = typeof users.$inferSelect;

export const channels = pgTable(
	"channels",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: text("name").notNull(),
		isPrivate: boolean("is_private").default(false).notNull(),
		metadata: text("metadata"),
		companyId: uuid("company_id")
			.notNull()
			.references(() => companies.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		channelsCompanyIdx: index("channels_company_idx").on(table.companyId),
		channelsNameIdx: index("channels_name_idx").on(table.name),
	}),
);

export type Channel = typeof channels.$inferSelect;

export const channelMembers = pgTable(
	"channel_members",
	{
		channelId: uuid("channel_id")
			.notNull()
			.references(() => channels.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		joinedAt: timestamp("joined_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		lastReadAt: timestamp("last_read_at", { withTimezone: true }),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.channelId, table.userId],
			name: "channel_members_pk",
		}),
		channelIdx: index("channel_members_channel_idx").on(table.channelId),
		userIdx: index("channel_members_user_idx").on(table.userId),
	}),
);

export type ChannelMember = typeof channelMembers.$inferSelect;

export const messages = pgTable(
	"messages",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		content: text("content"),
		fileUrl: text("file_url"),
		senderId: uuid("sender_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		channelId: uuid("channel_id")
			.notNull()
			.references(() => channels.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		messagesChannelIdx: index("messages_channel_idx").on(table.channelId),
		messagesSenderIdx: index("messages_sender_idx").on(table.senderId),
	}),
);

export type Message = typeof messages.$inferSelect;

export const companiesRelations = relations(companies, ({ many }) => ({
	users: many(users),
	channels: many(channels),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
	company: one(companies, {
		fields: [users.companyId],
		references: [companies.id],
	}),
	memberships: many(channelMembers),
	messages: many(messages),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
	company: one(companies, {
		fields: [channels.companyId],
		references: [companies.id],
	}),
	members: many(channelMembers),
	messages: many(messages),
}));

export const channelMembersRelations = relations(channelMembers, ({ one }) => ({
	channel: one(channels, {
		fields: [channelMembers.channelId],
		references: [channels.id],
	}),
	user: one(users, {
		fields: [channelMembers.userId],
		references: [users.id],
	}),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
	sender: one(users, {
		fields: [messages.senderId],
		references: [users.id],
	}),
	channel: one(channels, {
		fields: [messages.channelId],
		references: [channels.id],
	}),
}));
