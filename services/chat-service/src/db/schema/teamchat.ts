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

import { companies } from "./core";

export const companiesRelations = relations(companies, ({ many }) => ({
	users: many(teamchatUsers),
	channels: many(teamchatChannels),
}));

export const teamchatUsers = pgTable(
	"teamchat_users",
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
		teamchatUsersEmailUnique: uniqueIndex("teamchat_users_email_unique").on(
			table.email,
		),
		teamchatUsersCompanyIdx: index("teamchat_users_company_idx").on(
			table.companyId,
		),
		teamchatUsersStatusIdx: index("teamchat_users_status_idx").on(table.status),
	}),
);

export type TeamChatUser = typeof teamchatUsers.$inferSelect;

export const teamchatChannels = pgTable(
	"teamchat_channels",
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
		teamchatChannelsCompanyIdx: index("teamchat_channels_company_idx").on(
			table.companyId,
		),
		teamchatChannelsNameIdx: index("teamchat_channels_name_idx").on(table.name),
	}),
);

export type TeamChatChannel = typeof teamchatChannels.$inferSelect;

export const teamchatChannelMembers = pgTable(
	"teamchat_channel_members",
	{
		channelId: uuid("channel_id")
			.notNull()
			.references(() => teamchatChannels.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => teamchatUsers.id, { onDelete: "cascade", onUpdate: "cascade" }),
		joinedAt: timestamp("joined_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		lastReadAt: timestamp("last_read_at", { withTimezone: true }),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.channelId, table.userId],
			name: "teamchat_channel_members_pk",
		}),
		teamchatChannelIdx: index("teamchat_channel_members_channel_idx").on(
			table.channelId,
		),
		teamchatUserIdx: index("teamchat_channel_members_user_idx").on(
			table.userId,
		),
	}),
);

export type TeamChatChannelMember = typeof teamchatChannelMembers.$inferSelect;

export const teamchatMessages = pgTable(
	"teamchat_messages",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		content: text("content"),
		fileUrl: text("file_url"),
		senderId: uuid("sender_id")
			.notNull()
			.references(() => teamchatUsers.id, { onDelete: "cascade", onUpdate: "cascade" }),
		channelId: uuid("channel_id")
			.notNull()
			.references(() => teamchatChannels.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		teamchatMessagesChannelIdx: index("teamchat_messages_channel_idx").on(
			table.channelId,
		),
		teamchatMessagesSenderIdx: index("teamchat_messages_sender_idx").on(
			table.senderId,
		),
	}),
);

export type TeamChatMessage = typeof teamchatMessages.$inferSelect;

export const teamchatUsersRelations = relations(
	teamchatUsers,
	({ one, many }) => ({
		company: one(companies, {
			fields: [teamchatUsers.companyId],
			references: [companies.id],
		}),
		memberships: many(teamchatChannelMembers),
		messages: many(teamchatMessages),
	}),
);

export const teamchatChannelsRelations = relations(
	teamchatChannels,
	({ one, many }) => ({
		company: one(companies, {
			fields: [teamchatChannels.companyId],
			references: [companies.id],
		}),
		members: many(teamchatChannelMembers),
		messages: many(teamchatMessages),
	}),
);

export const teamchatChannelMembersRelations = relations(
	teamchatChannelMembers,
	({ one }) => ({
		channel: one(teamchatChannels, {
			fields: [teamchatChannelMembers.channelId],
			references: [teamchatChannels.id],
		}),
		user: one(teamchatUsers, {
			fields: [teamchatChannelMembers.userId],
			references: [teamchatUsers.id],
		}),
	}),
);

export const teamchatMessagesRelations = relations(teamchatMessages, ({ one }) => ({
	sender: one(teamchatUsers, {
		fields: [teamchatMessages.senderId],
		references: [teamchatUsers.id],
	}),
	channel: one(teamchatChannels, {
		fields: [teamchatMessages.channelId],
		references: [teamchatChannels.id],
	}),
}));

