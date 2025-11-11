import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./core";

export const teamMemberStatusEnum = pgEnum("team_member_status", ["online", "offline", "idle", "invited"]);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 100 }).notNull(),
    status: teamMemberStatusEnum("status").default("offline").notNull(),
    avatarUrl: text("avatar_url"),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    emailUnique: uniqueIndex("team_members_company_email_key").on(table.companyId, table.email),
    statusIdx: index("team_members_status_idx").on(table.status),
    companyIdx: index("team_members_company_idx").on(table.companyId)
  })
);

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

