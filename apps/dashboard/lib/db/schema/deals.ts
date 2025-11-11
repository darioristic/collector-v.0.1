import {
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const dealStageEnum = pgEnum("deal_stage", [
  "Lead",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
]);

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    owner: text("owner").notNull(),
    stage: dealStageEnum("stage").notNull(),
    value: doublePrecision("value").default(0).notNull(),
    closeDate: timestamp("close_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    stageIdx: index("deals_stage_idx").on(table.stage),
    ownerIdx: index("deals_owner_idx").on(table.owner),
    createdIdx: index("deals_created_idx").on(table.createdAt),
  }),
);

export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;

