import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const userStatus = pgEnum("user_status", ["active", "inactive", "invited"]);
export const roleKey = pgEnum("role_key", [
  "admin",
  "sales_manager",
  "sales_rep",
  "support",
  "viewer"
]);
export const integrationProvider = pgEnum("integration_provider", [
  "hubspot",
  "salesforce",
  "slack",
  "google"
]);
export const integrationStatus = pgEnum("integration_status", ["connected", "disconnected", "error"]);
export const teamMemberStatus = pgEnum("team_member_status", ["online", "offline", "idle", "invited"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    status: userStatus("status").default("invited").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_key").on(table.email)
  })
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: roleKey("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    roleKeyUnique: uniqueIndex("roles_key_key").on(table.key)
  })
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    pk: uniqueIndex("user_roles_user_role_key").on(table.userId, table.roleId)
  })
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    resource: text("resource").notNull(),
    action: text("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    resourceIndex: index("permissions_resource_action_idx").on(table.resource, table.action)
  })
);

export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: integrationProvider("provider").notNull(),
    status: integrationStatus("status").default("disconnected").notNull(),
    externalId: text("external_id"),
    settings: text("settings"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    providerStatusIdx: index("integrations_provider_status_idx").on(table.provider, table.status)
  })
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    status: teamMemberStatus("status").default("offline").notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    emailUnique: uniqueIndex("team_members_email_key").on(table.email),
    statusIdx: index("team_members_status_idx").on(table.status)
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles)
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  permissions: many(permissions)
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id]
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id]
  })
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  role: one(roles, {
    fields: [permissions.roleId],
    references: [roles.id]
  })
}));


