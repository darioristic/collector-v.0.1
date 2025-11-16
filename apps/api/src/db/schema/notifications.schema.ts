import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

import { companies } from "./auth.schema";
import { users } from "./settings.schema";

export const notificationType = pgEnum("notification_type", ["info", "success", "warning", "error"]);

export const notificationPreferenceType = pgEnum("notification_preference_type", [
  "invoice",
  "payment",
  "transaction",
  "daily_summary",
  "quote",
  "deal",
  "project",
  "task",
  "system"
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: notificationType("type").default("info").notNull(),
    link: text("link"),
    read: boolean("read").default(false).notNull(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    recipientIdx: index("notifications_recipient_idx").on(table.recipientId),
    companyIdx: index("notifications_company_idx").on(table.companyId),
    readIdx: index("notifications_read_idx").on(table.read),
    createdIdx: index("notifications_created_at_idx").on(table.createdAt)
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id]
  }),
  company: one(companies, {
    fields: [notifications.companyId],
    references: [companies.id]
  })
}));

export const userNotificationPreferences = pgTable(
  "user_notification_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: notificationPreferenceType("notification_type").notNull(),
    emailEnabled: boolean("email_enabled").default(true).notNull(),
    inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    userTypeIdx: index("user_notification_preferences_user_type_idx").on(
      table.userId,
      table.notificationType
    ),
    userIdx: index("user_notification_preferences_user_idx").on(table.userId)
  })
);

export const userNotificationPreferencesRelations = relations(
  userNotificationPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userNotificationPreferences.userId],
      references: [users.id]
    })
  })
);


