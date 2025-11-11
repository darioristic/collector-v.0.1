import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

import { roleKey, roles, users } from "./settings.schema";

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    domain: text("domain"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    slugUnique: uniqueIndex("companies_slug_key").on(table.slug),
    nameIdx: index("companies_name_idx").on(table.name)
  })
);

export const companyUsers = pgTable(
  "company_users",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),
    role: roleKey("role_key").notNull().default("viewer"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    pk: uniqueIndex("company_users_company_user_key").on(table.companyId, table.userId),
    roleIdx: index("company_users_role_idx").on(table.role)
  })
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    token: text("token").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true })
  },
  (table) => ({
    tokenUnique: uniqueIndex("auth_sessions_token_key").on(table.token),
    userIdx: index("auth_sessions_user_idx").on(table.userId),
    expiryIdx: index("auth_sessions_expires_at_idx").on(table.expiresAt)
  })
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    issuedForSessionId: uuid("issued_for_session_id").references(() => authSessions.id, {
      onDelete: "set null"
    }),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true })
  },
  (table) => ({
    tokenUnique: uniqueIndex("password_reset_tokens_token_key").on(table.token),
    userIdx: index("password_reset_tokens_user_idx").on(table.userId)
  })
);

export const companiesRelations = relations(companies, ({ many, one }) => ({
  members: many(companyUsers),
  sessions: many(authSessions),
  createdByUser: one(users, {
    fields: [companies.createdBy],
    references: [users.id],
    relationName: "companies_created_by"
  }),
  updatedByUser: one(users, {
    fields: [companies.updatedBy],
    references: [users.id],
    relationName: "companies_updated_by"
  })
}));

export const companyUsersRelations = relations(companyUsers, ({ one }) => ({
  company: one(companies, {
    fields: [companyUsers.companyId],
    references: [companies.id]
  }),
  user: one(users, {
    fields: [companyUsers.userId],
    references: [users.id]
  }),
  role: one(roles, {
    fields: [companyUsers.roleId],
    references: [roles.id]
  })
}));

export const authSessionsRelations = relations(authSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id]
  }),
  company: one(companies, {
    fields: [authSessions.companyId],
    references: [companies.id]
  }),
  passwordResetTokens: many(passwordResetTokens)
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id]
  }),
  session: one(authSessions, {
    fields: [passwordResetTokens.issuedForSessionId],
    references: [authSessions.id]
  })
}));


