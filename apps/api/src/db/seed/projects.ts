import { faker } from "@faker-js/faker";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { accounts } from "../schema/accounts.schema";
import {
  projectBudgetCategories,
  projectMembers,
  projectMilestones,
  projectTasks,
  projectTeams,
  projectTimeEntries,
  projects
} from "../schema/projects.schema";
import { users } from "../schema/settings.schema";

const PROJECT_COUNT = 10;
const TASKS_PER_PROJECT = 25;
const MILESTONES_PER_PROJECT = 5;
const TEAM_MEMBERS_PER_PROJECT = 4;
const BUDGET_CATEGORIES = ["Planning", "Execution", "Operations", "Quality", "Contingency"];
const PROJECT_STATUSES = ["planned", "active", "on_hold", "completed"] as const;
const TASK_STATUSES = ["todo", "in_progress", "blocked", "done"] as const;

const formatCurrency = (value: number): string => value.toFixed(2);

const ensureUsers = async (
  tx: typeof defaultDb
): Promise<Array<{ id: string; name: string; email: string }>> => {
  let existingUsers = await tx.select({ id: users.id, name: users.name, email: users.email }).from(users);

  if (existingUsers.length === 0) {
    const userSeed = Array.from({ length: 8 }, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email({ provider: "projects.example" }),
      status: "active" as const
    }));

    await tx.insert(users).values(userSeed).onConflictDoNothing({
      target: users.email
    });

    existingUsers = await tx.select({ id: users.id, name: users.name, email: users.email }).from(users);
  }

  return existingUsers;
};

const makeDeterministicUuid = (input: string): string => {
  const hash = createHash("sha256").update(input).digest();
  const bytes = Uint8Array.from(hash.slice(0, 16));

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const ensureProjectSchema = async (db: typeof defaultDb) => {
  await db.execute(sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
      CREATE TYPE project_status AS ENUM ('planned', 'active', 'on_hold', 'completed');
    END IF;
  END $$;`);

  await db.execute(sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
      CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done');
    END IF;
  END $$;`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "projects" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "account_id" uuid REFERENCES "accounts"("id") ON DELETE SET NULL,
      "owner_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
      "name" text NOT NULL,
      "description" text,
      "customer" text,
      "status" "project_status" NOT NULL DEFAULT 'planned',
      "start_date" timestamptz,
      "due_date" timestamptz,
      "budget_total" numeric(12, 2) DEFAULT 0,
      "budget_spent" numeric(12, 2) DEFAULT 0,
      "budget_currency" text DEFAULT 'EUR',
      "created_at" timestamptz NOT NULL DEFAULT NOW(),
      "updated_at" timestamptz NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "customer" text;`);
  await db.execute(
    sql`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "status" project_status NOT NULL DEFAULT 'planned';`
  );
  await db.execute(sql`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "start_date" timestamptz;`);
  await db.execute(sql`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "due_date" timestamptz;`);
  await db.execute(
    sql`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget_total" numeric(12, 2) DEFAULT 0;`
  );
  await db.execute(
    sql`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget_spent" numeric(12, 2) DEFAULT 0;`
  );
  await db.execute(
    sql`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget_currency" text DEFAULT 'EUR';`
  );
  await db.execute(
    sql`ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'planned';`
  );
  await db.execute(
    sql`ALTER TABLE "projects" ALTER COLUMN "budget_currency" SET DEFAULT 'EUR';`
  );

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "projects_name_owner_key" ON "projects" ("name", "owner_id");
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects" ("status");
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "project_members" (
      "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "role" text NOT NULL DEFAULT 'contributor',
      "added_at" timestamptz NOT NULL DEFAULT NOW(),
      PRIMARY KEY ("project_id", "user_id")
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "project_milestones" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
      "title" text NOT NULL,
      "description" text,
      "due_date" timestamptz,
      "status" "task_status" NOT NULL DEFAULT 'todo',
      "created_at" timestamptz NOT NULL DEFAULT NOW(),
      "updated_at" timestamptz NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(
    sql`ALTER TABLE "project_milestones" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT NOW();`
  );

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "project_milestones_project_idx" ON "project_milestones" ("project_id");
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "project_tasks" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
      "milestone_id" uuid REFERENCES "project_milestones"("id") ON DELETE SET NULL,
      "assignee_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
      "title" text NOT NULL,
      "description" text,
      "status" "task_status" NOT NULL DEFAULT 'todo',
      "due_date" timestamptz,
      "created_at" timestamptz NOT NULL DEFAULT NOW(),
      "updated_at" timestamptz NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "project_tasks_project_idx" ON "project_tasks" ("project_id");
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "project_tasks_assignee_idx" ON "project_tasks" ("assignee_id");
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "project_budget_categories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
      "category" text NOT NULL,
      "allocated_amount" numeric(12, 2) NOT NULL DEFAULT 0,
      "spent_amount" numeric(12, 2) NOT NULL DEFAULT 0,
      "created_at" timestamptz NOT NULL DEFAULT NOW(),
      "updated_at" timestamptz NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "project_budget_categories_project_idx" ON "project_budget_categories" ("project_id");
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "project_budget_categories_category_idx" ON "project_budget_categories" ("category");
  `);
};

export const seedProjects = async (database = defaultDb) => {
  faker.seed(2025);

  await ensureProjectSchema(database);

  await database.transaction(async (tx) => {
    const accountRows = await tx.select({ id: accounts.id, name: accounts.name }).from(accounts);

    if (accountRows.length === 0) {
      throw new Error("Seed Accounts mora biti pokrenut pre Projects seeda.");
    }

    const userRows = await ensureUsers(tx);

    // Clean previous data to keep deterministic dataset
    await Promise.all([
      tx.delete(projectTimeEntries),
      tx.delete(projectBudgetCategories),
      tx.delete(projectTasks),
      tx.delete(projectMilestones),
      tx.delete(projectMembers),
      tx.delete(projectTeams),
      tx.delete(projects)
    ]);

    const baseStartDate = new Date(2025, 0, 10);

    for (let index = 0; index < PROJECT_COUNT; index += 1) {
      const account = accountRows[index % accountRows.length];
      const owner = userRows[index % userRows.length];
      const status = PROJECT_STATUSES[index % PROJECT_STATUSES.length];

      const startDate = new Date(baseStartDate);
      startDate.setDate(baseStartDate.getDate() + index * 7);
      const dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + 120);

      const budgetTotal = 250_000 + index * 12_500;
      const budgetSpent = budgetTotal * 0.45;

      const projectId = makeDeterministicUuid(`project-${index}`);

      const [projectRow] = await tx
        .insert(projects)
        .values({
          id: projectId,
          name: `Project ${String(index + 1).padStart(2, "0")}`,
          description: faker.lorem.paragraph(),
          customer: account.name,
          status,
          accountId: account.id,
          ownerId: owner.id,
          startDate,
          dueDate,
          budgetTotal: formatCurrency(budgetTotal),
          budgetSpent: formatCurrency(budgetSpent),
          budgetCurrency: "EUR"
        })
        .returning();

      if (!projectRow) {
        throw new Error("Failed to insert project seed row.");
      }

      // Project members (owner + additional teammates)
      const shuffledUsers = faker.helpers.shuffle(userRows);
      const memberCandidates = new Map<string, { id: string; name: string; email: string }>();
      memberCandidates.set(owner.id, owner);

      for (const candidate of shuffledUsers) {
        if (memberCandidates.size >= TEAM_MEMBERS_PER_PROJECT) {
          break;
        }

        memberCandidates.set(candidate.id, candidate);
      }

      // Create project teams (1-2 teams per project)
      const teamCount = index % 3 === 0 ? 2 : 1;
      const teamRows = [];
      
      for (let teamIndex = 0; teamIndex < teamCount; teamIndex++) {
        const [teamRow] = await tx
          .insert(projectTeams)
          .values({
            projectId,
            name: teamIndex === 0 ? `Core Team` : `Support Team ${teamIndex}`,
            goal: teamIndex === 0 
              ? `Primary development team for ${projectRow.name}`
              : `Supporting team for specialized tasks`
          })
          .returning();
        
        if (teamRow) {
          teamRows.push(teamRow);
        }
      }

      // Project members (owner + additional teammates)
      const shuffledUsers = faker.helpers.shuffle(userRows);
      const memberCandidates = new Map<string, { id: string; name: string; email: string }>();
      memberCandidates.set(owner.id, owner);

      for (const candidate of shuffledUsers) {
        if (memberCandidates.size >= TEAM_MEMBERS_PER_PROJECT) {
          break;
        }

        memberCandidates.set(candidate.id, candidate);
      }

      await tx.insert(projectMembers).values(
        Array.from(memberCandidates.values()).map((member, memberIndex) => ({
          projectId,
          userId: member.id,
          teamId: teamRows.length > 0 ? teamRows[memberIndex % teamRows.length]?.id ?? null : null,
          role: memberIndex === 0 ? "owner" : "contributor"
        }))
      );

      // Milestones
      const milestoneRows = await tx
        .insert(projectMilestones)
        .values(
          Array.from({ length: MILESTONES_PER_PROJECT }, (_value, milestoneIndex) => {
            const milestoneDueDate = new Date(startDate);
            milestoneDueDate.setDate(startDate.getDate() + (milestoneIndex + 1) * 21);

            return {
              projectId,
              title: `Milestone ${milestoneIndex + 1}`,
              description: faker.lorem.sentence(),
              dueDate: milestoneDueDate,
              status: TASK_STATUSES[(index + milestoneIndex) % TASK_STATUSES.length]
            };
          })
        )
        .returning();

      const milestoneIds = milestoneRows.map((entry) => entry.id);

      // Budget categories
      await tx.insert(projectBudgetCategories).values(
        BUDGET_CATEGORIES.map((category, categoryIndex) => {
          const allocated = budgetTotal * (0.15 + categoryIndex * 0.05);
          const spent = allocated * (0.4 + (categoryIndex % 3) * 0.2);

          return {
            projectId,
            category,
            allocatedAmount: formatCurrency(allocated),
            spentAmount: formatCurrency(Math.min(spent, allocated))
          };
        })
      );

      // Tasks
      const tasksPayload = Array.from({ length: TASKS_PER_PROJECT }, (_value, taskIndex) => {
        const taskStatus = TASK_STATUSES[(taskIndex + index) % TASK_STATUSES.length];
        const assignee = faker.helpers.arrayElement(userRows);
        const dueDate = new Date(startDate);
        dueDate.setDate(startDate.getDate() + 5 + taskIndex * 3);

        return {
          projectId,
          milestoneId: milestoneIds.length > 0 ? milestoneIds[taskIndex % milestoneIds.length] ?? null : null,
          assigneeId: assignee.id,
          title: `Task ${String(taskIndex + 1).padStart(2, "0")} for Project ${index + 1}`,
          description: faker.lorem.sentences(2),
          status: taskStatus,
          dueDate
        };
      });

      const insertedTasks = await tx.insert(projectTasks).values(tasksPayload).returning();

      // Create time entries for tasks
      const timeEntriesData = [];
      const tasksForTimeEntries = insertedTasks.slice(0, Math.min(20, insertedTasks.length));

      for (const task of tasksForTimeEntries) {
        // Create 1-3 time entries per task
        const entryCount = (task.id.charCodeAt(0) % 3) + 1;
        
        for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
          const entryDate = new Date(startDate);
          entryDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60));
          entryDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);

          const hours = 2 + Math.random() * 6; // 2-8 hours

          timeEntriesData.push({
            projectId,
            userId: task.assigneeId || owner.id,
            taskId: task.id,
            hours: formatCurrency(hours),
            date: entryDate,
            description: faker.lorem.sentence()
          });
        }
      }

      if (timeEntriesData.length > 0) {
        await tx.insert(projectTimeEntries).values(timeEntriesData);
      }
    }
  });
};

