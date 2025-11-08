import { relations } from "drizzle-orm";
import {
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts.schema";
import { users } from "./settings.schema";

export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "qualified", "won", "lost"]);
export const opportunityStageEnum = pgEnum("opportunity_stage", [
  "qualification",
  "proposal",
  "negotiation",
  "closedWon",
  "closedLost"
]);
export const activityTypeEnum = pgEnum("activity_type", ["call", "email", "meeting", "task"]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    status: leadStatusEnum("status").default("new").notNull(),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    emailUnique: uniqueIndex("leads_email_key").on(table.email),
    accountIdx: index("leads_account_idx").on(table.accountId),
    ownerIdx: index("leads_owner_idx").on(table.ownerId)
  })
);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    stage: opportunityStageEnum("stage").default("qualification").notNull(),
    value: numeric("value", { precision: 12, scale: 2 }).default("0").notNull(),
    probability: numeric("probability", { precision: 5, scale: 2 }).default("0").notNull(),
    closeDate: timestamp("close_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    accountIdx: index("opportunities_account_idx").on(table.accountId),
    ownerIdx: index("opportunities_owner_idx").on(table.ownerId),
    stageIdx: index("opportunities_stage_idx").on(table.stage)
  })
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: activityTypeEnum("type").default("call").notNull(),
    subject: text("subject").notNull(),
    notes: text("notes"),
    date: timestamp("date", { withTimezone: true }).notNull(),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    relatedTo: text("related_to").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    ownerIdx: index("activities_owner_idx").on(table.ownerId),
    relatedIdx: index("activities_related_idx").on(table.relatedTo)
  })
);

export const crmNotes = pgTable(
  "crm_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    leadIdx: index("crm_notes_lead_idx").on(table.leadId),
    opportunityIdx: index("crm_notes_opportunity_idx").on(table.opportunityId)
  })
);

export const leadsRelations = relations(leads, ({ many, one }) => ({
  account: one(accounts, {
    fields: [leads.accountId],
    references: [accounts.id]
  }),
  owner: one(users, {
    fields: [leads.ownerId],
    references: [users.id]
  }),
  opportunities: many(opportunities),
  activities: many(activities),
  notes: many(crmNotes)
}));

export const opportunitiesRelations = relations(opportunities, ({ many, one }) => ({
  lead: one(leads, {
    fields: [opportunities.leadId],
    references: [leads.id]
  }),
  account: one(accounts, {
    fields: [opportunities.accountId],
    references: [accounts.id]
  }),
  owner: one(users, {
    fields: [opportunities.ownerId],
    references: [users.id]
  }),
  activities: many(activities),
  notes: many(crmNotes)
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  owner: one(users, {
    fields: [activities.ownerId],
    references: [users.id]
  })
}));

export const crmNotesRelations = relations(crmNotes, ({ one }) => ({
  author: one(users, {
    fields: [crmNotes.authorId],
    references: [users.id]
  }),
  lead: one(leads, {
    fields: [crmNotes.leadId],
    references: [leads.id]
  }),
  opportunity: one(opportunities, {
    fields: [crmNotes.opportunityId],
    references: [opportunities.id]
  })
}));


