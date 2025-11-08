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

import { accounts } from "./accounts.schema";
import { users } from "./settings.schema";

export const projectStatus = pgEnum("project_status", ["planned", "active", "on_hold", "completed"]);
export const taskStatus = pgEnum("task_status", ["todo", "in_progress", "blocked", "done"]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    status: projectStatus("status").default("planned").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    nameUnique: uniqueIndex("projects_name_owner_key").on(table.name, table.ownerId),
    statusIdx: index("projects_status_idx").on(table.status)
  })
);

export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").default("contributor").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    pk: uniqueIndex("project_members_project_user_key").on(table.projectId, table.userId)
  })
);

export const projectMilestones = pgTable(
  "project_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: taskStatus("status").default("todo").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    projectIdx: index("project_milestones_project_idx").on(table.projectId)
  })
);

export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    milestoneId: uuid("milestone_id").references(() => projectMilestones.id, {
      onDelete: "set null"
    }),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatus("status").default("todo").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    projectIdx: index("project_tasks_project_idx").on(table.projectId),
    assigneeIdx: index("project_tasks_assignee_idx").on(table.assigneeId)
  })
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  account: one(accounts, {
    fields: [projects.accountId],
    references: [accounts.id]
  }),
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id]
  }),
  members: many(projectMembers),
  milestones: many(projectMilestones),
  tasks: many(projectTasks)
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id]
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id]
  })
}));

export const projectMilestonesRelations = relations(projectMilestones, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectMilestones.projectId],
    references: [projects.id]
  }),
  tasks: many(projectTasks)
}));

export const projectTasksRelations = relations(projectTasks, ({ one }) => ({
  project: one(projects, {
    fields: [projectTasks.projectId],
    references: [projects.id]
  }),
  milestone: one(projectMilestones, {
    fields: [projectTasks.milestoneId],
    references: [projectMilestones.id]
  }),
  assignee: one(users, {
    fields: [projectTasks.assigneeId],
    references: [users.id]
  })
}));


