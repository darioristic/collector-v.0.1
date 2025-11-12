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


