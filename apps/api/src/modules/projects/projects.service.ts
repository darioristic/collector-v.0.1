import { and, asc, eq, sql } from "drizzle-orm";
import { db as defaultDb, type AppDatabase } from "../../db";
import {
  projectBudgetCategories,
  projectMembers,
  projectMilestones,
  projectTasks,
  projects,
  projectStatus,
  taskStatus
} from "../../db/schema/projects.schema";
import { users } from "../../db/schema/settings.schema";
import type { CacheService } from "../../lib/cache.service";
import type {
  AddTeamMemberInput,
  CreateBudgetCategoryInput,
  CreateTaskInput,
  CreateTimelineEventInput,
  ProjectBudgetCategory,
  ProjectBudgetSummary,
  ProjectCreateInput,
  ProjectDetails,
  ProjectSummary,
  ProjectTask,
  ProjectTimelineEvent,
  ProjectTeamMember,
  ProjectUpdateInput,
  TimelineStatus,
  UpdateBudgetCategoryInput,
  UpdateBudgetSummaryInput,
  UpdateTaskInput,
  UpdateTimelineEventInput
} from "./projects.types";

type ProjectsTableRow = typeof projects.$inferSelect;
type TasksTableRow = typeof projectTasks.$inferSelect;
type TimelineTableRow = typeof projectMilestones.$inferSelect;
type TeamTableRow = typeof projectMembers.$inferSelect;
type BudgetCategoryRow = typeof projectBudgetCategories.$inferSelect;
type UserRow = typeof users.$inferSelect;

const DAY_IN_MS = 86_400_000;
const DEFAULT_CURRENCY = "EUR";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string =>
  typeof value === "string" && uuidRegex.test(value);

const statusLabelMap: Record<(typeof projectStatus.enumValues)[number], string> = {
  planned: "Pending",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed"
};

const timelineStatusToTaskStatus: Record<TimelineStatus, (typeof taskStatus.enumValues)[number]> = {
  completed: "done",
  in_progress: "in_progress",
  upcoming: "todo"
};

const taskStatusToTimelineStatus: Record<(typeof taskStatus.enumValues)[number], TimelineStatus> = {
  todo: "upcoming",
  in_progress: "in_progress",
  blocked: "upcoming",
  done: "completed"
};

const toNumber = (value: string | number | null | undefined, fallback = 0): number => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? fallback : value;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toIsoString = (value: Date | string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

const toDateOrNull = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const calculateRemainingDays = (dueDate: Date | null): number | null => {
  if (!dueDate) {
    return null;
  }

  const diff = Math.ceil((dueDate.getTime() - Date.now()) / DAY_IN_MS);
  return diff < 0 ? 0 : diff;
};

type BasicUserInfo = Pick<UserRow, "id" | "name" | "email">;

const mapOwner = (
  row: BasicUserInfo | UserRow | null | undefined
): { id: string | null; name: string | null; email: string | null } | null => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email
  };
};

export class ProjectsService {
  constructor(
    private readonly database: AppDatabase = defaultDb,
    private readonly cache?: CacheService
  ) {}

  async list(): Promise<ProjectSummary[]> {
    const cacheKey = "projects:list";

    if (this.cache) {
      const cached = await this.cache.get<ProjectSummary[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const [projectRows, taskStats] = await Promise.all([
      this.database
        .select({
          project: projects,
          owner: users
        })
        .from(projects)
        .leftJoin(users, eq(projects.ownerId, users.id))
        .orderBy(asc(projects.createdAt)),
      this.database
        .select({
          projectId: projectTasks.projectId,
          total: sql<number>`count(*)`,
          completed: sql<number>`sum(case when ${projectTasks.status} = 'done' then 1 else 0 end)`
        })
        .from(projectTasks)
        .groupBy(projectTasks.projectId)
    ]);

    const statsMap = new Map<string, { total: number; completed: number }>();
    for (const stat of taskStats) {
      statsMap.set(stat.projectId, {
        total: toNumber(stat.total),
        completed: toNumber(stat.completed)
      });
    }

    const summaries = projectRows.map(({ project, owner }) =>
      this.mapProjectSummary(project, owner ?? undefined, statsMap.get(project.id))
    );

    if (this.cache) {
      await this.cache.set(cacheKey, summaries, { ttl: 300 });
    }

    return summaries;
  }

  async projectExists(id: string): Promise<boolean> {
    if (!isUuid(id)) {
      return false;
    }

    const [row] = await this.database
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    return Boolean(row);
  }

  async createProject(input: ProjectCreateInput): Promise<ProjectDetails> {
    const payload: typeof projects.$inferInsert = {
      name: input.name,
      description: input.description ?? null,
      customer: input.customer ?? null,
      status: input.status ?? "planned",
      accountId: input.accountId ?? null,
      ownerId: input.ownerId ?? null,
      startDate: toDateOrNull(input.startDate),
      dueDate: toDateOrNull(input.dueDate),
      budgetTotal: input.budget?.total != null ? input.budget.total.toString() : null,
      budgetSpent: input.budget?.spent != null ? input.budget.spent.toString() : null,
      budgetCurrency: input.budget?.currency ?? DEFAULT_CURRENCY
    };

    const [row] = await this.database.insert(projects).values(payload).returning();

    if (!row) {
      throw new Error("Failed to create project");
    }

    await this.invalidateProjectCaches();

    return this.getProjectDetails(row.id) as Promise<ProjectDetails>;
  }

  async updateProject(id: string, input: ProjectUpdateInput): Promise<ProjectDetails | null> {
    if (!isUuid(id)) {
      return null;
    }

    const existing = await this.getProjectDetails(id);

    if (!existing) {
      return null;
    }

    const payload: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date()
    };

    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description;
    if (input.customer !== undefined) payload.customer = input.customer;
    if (input.status !== undefined) payload.status = input.status;
    if (input.accountId !== undefined) payload.accountId = input.accountId;
    if (input.ownerId !== undefined) payload.ownerId = input.ownerId;
    if (input.startDate !== undefined) payload.startDate = toDateOrNull(input.startDate);
    if (input.dueDate !== undefined) payload.dueDate = toDateOrNull(input.dueDate);

    if (input.budget) {
      if (input.budget.total !== undefined && input.budget.total !== null) {
        payload.budgetTotal = input.budget.total.toString();
      } else if (input.budget.total === null) {
        payload.budgetTotal = null;
      }

      if (input.budget.spent !== undefined && input.budget.spent !== null) {
        payload.budgetSpent = input.budget.spent.toString();
      } else if (input.budget.spent === null) {
        payload.budgetSpent = null;
      }

      if (input.budget.currency !== undefined) {
        payload.budgetCurrency = input.budget.currency ?? DEFAULT_CURRENCY;
      }
    }

    await this.database.update(projects).set(payload).where(eq(projects.id, id));

    await this.invalidateProjectCaches(id);

    return this.getProjectDetails(id);
  }

  async deleteProject(id: string): Promise<boolean> {
    if (!isUuid(id)) {
      return false;
    }

    const deleted = await this.database
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();
    const success = deleted.length > 0;

    if (success) {
      await this.invalidateProjectCaches(id);
    }

    return success;
  }

  async getProjectDetails(id: string): Promise<ProjectDetails | null> {
    if (!isUuid(id)) {
      return null;
    }

    const cacheKey = `projects:details:${id}`;

    if (this.cache) {
      const cached = await this.cache.get<ProjectDetails>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const [projectRow] = await this.database
      .select({
        project: projects,
        owner: users
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .where(eq(projects.id, id))
      .limit(1);

    if (!projectRow) {
      return null;
    }

    const [tasks, timeline, team, budgetCategories] = await Promise.all([
      this.fetchProjectTasks(id),
      this.fetchProjectTimeline(id),
      this.fetchProjectTeam(id),
      this.fetchBudgetCategories(id)
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === "done").length;
    const remainingTasks = totalTasks - completedTasks;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const summary = this.mapProjectSummary(projectRow.project, projectRow.owner ?? undefined, {
      total: totalTasks,
      completed: completedTasks
    });

    const budget = this.composeBudgetSummary(projectRow.project, budgetCategories);

    const details: ProjectDetails = {
      ...summary,
      progress,
      totalTasks,
      completedTasks,
      remainingDays: summary.remainingDays,
      budget,
      tasks,
      timeline,
      team,
      quickStats: {
        totalTasks,
        completedTasks,
        remainingTasks,
        remainingDays: summary.remainingDays
      }
    };

    if (this.cache) {
      await this.cache.set(cacheKey, details, { ttl: 600 });
    }

    return details;
  }

  async listTasks(projectId: string): Promise<ProjectTask[]> {
    return this.fetchProjectTasks(projectId);
  }

  async createTask(projectId: string, input: CreateTaskInput): Promise<ProjectTask> {
    const payload: typeof projectTasks.$inferInsert = {
      projectId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "todo",
      assigneeId: input.assigneeId ?? null,
      dueDate: toDateOrNull(input.dueDate)
    };

    const [row] = await this.database.insert(projectTasks).values(payload).returning();

    if (!row) {
      throw new Error("Failed to create task");
    }

    await this.invalidateProjectCaches(projectId);

    const created = await this.getTaskById(row.id);

    if (!created) {
      throw new Error("Failed to load created task");
    }

    return created;
  }

  async updateTask(projectId: string, taskId: string, input: UpdateTaskInput): Promise<ProjectTask | null> {
    const existing = await this.getTaskById(taskId);

    if (!existing || existing.projectId !== projectId) {
      return null;
    }

    const payload: Partial<typeof projectTasks.$inferInsert> = {
      updatedAt: new Date()
    };

    if (input.title !== undefined) payload.title = input.title;
    if (input.description !== undefined) payload.description = input.description;
    if (input.status !== undefined) payload.status = input.status;
    if (input.assigneeId !== undefined) payload.assigneeId = input.assigneeId;
    if (input.dueDate !== undefined) payload.dueDate = toDateOrNull(input.dueDate);

    await this.database.update(projectTasks).set(payload).where(eq(projectTasks.id, taskId));

    await this.invalidateProjectCaches(projectId);

    return this.getTaskById(taskId);
  }

  async deleteTask(projectId: string, taskId: string): Promise<boolean> {
    const deleted = await this.database
      .delete(projectTasks)
      .where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, projectId)))
      .returning();

    const success = deleted.length > 0;

    if (success) {
      await this.invalidateProjectCaches(projectId);
    }

    return success;
  }

  async listTimeline(projectId: string): Promise<ProjectTimelineEvent[]> {
    return this.fetchProjectTimeline(projectId);
  }

  async createTimelineEvent(projectId: string, input: CreateTimelineEventInput): Promise<ProjectTimelineEvent> {
    const payload: typeof projectMilestones.$inferInsert = {
      projectId,
      title: input.title,
      description: input.description ?? null,
      status: timelineStatusToTaskStatus[input.status ?? "upcoming"],
      dueDate: toDateOrNull(input.date)
    };

    const [row] = await this.database.insert(projectMilestones).values(payload).returning();

    if (!row) {
      throw new Error("Failed to create timeline event");
    }

    const created = await this.getTimelineEventById(row.id);

    if (!created) {
      throw new Error("Failed to load created timeline event");
    }

    return created;
  }

  async updateTimelineEvent(
    projectId: string,
    eventId: string,
    input: UpdateTimelineEventInput
  ): Promise<ProjectTimelineEvent | null> {
    const existing = await this.getTimelineEventById(eventId);

    if (!existing || existing.projectId !== projectId) {
      return null;
    }

    const payload: Partial<typeof projectMilestones.$inferInsert> = {
      updatedAt: new Date()
    };

    if (input.title !== undefined) payload.title = input.title;
    if (input.description !== undefined) payload.description = input.description;
    if (input.status !== undefined)
      payload.status = timelineStatusToTaskStatus[input.status ?? "upcoming"];
    if (input.date !== undefined) payload.dueDate = toDateOrNull(input.date);

    await this.database.update(projectMilestones).set(payload).where(eq(projectMilestones.id, eventId));

    return this.getTimelineEventById(eventId);
  }

  async deleteTimelineEvent(projectId: string, eventId: string): Promise<boolean> {
    const deleted = await this.database
      .delete(projectMilestones)
      .where(and(eq(projectMilestones.id, eventId), eq(projectMilestones.projectId, projectId)))
      .returning();

    return deleted.length > 0;
  }

  async listTeamMembers(projectId: string): Promise<ProjectTeamMember[]> {
    return this.fetchProjectTeam(projectId);
  }

  async addTeamMember(projectId: string, input: AddTeamMemberInput): Promise<ProjectTeamMember | null> {
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (!user) {
      return null;
    }

    const payload: typeof projectMembers.$inferInsert = {
      projectId,
      userId: input.userId,
      role: input.role ?? "contributor"
    };

    await this.database.insert(projectMembers).values(payload).onConflictDoNothing();

    const [row] = await this.database
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, input.userId)))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      projectId: row.projectId,
      userId: row.userId,
      role: row.role,
      name: user.name,
      email: user.email,
      addedAt: toIsoString(row.addedAt) ?? new Date().toISOString()
    };
  }

  async removeTeamMember(projectId: string, userId: string): Promise<boolean> {
    const deleted = await this.database
      .delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
      .returning();

    return deleted.length > 0;
  }

  async getBudget(projectId: string): Promise<ProjectBudgetSummary | null> {
    const project = await this.getProjectDetails(projectId);
    return project?.budget ?? null;
  }

  async updateBudget(projectId: string, input: UpdateBudgetSummaryInput): Promise<ProjectBudgetSummary | null> {
    const payload: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date()
    };

    if (input.total !== undefined && input.total !== null) {
      payload.budgetTotal = input.total.toString();
    } else if (input.total === null) {
      payload.budgetTotal = null;
    }

    if (input.spent !== undefined && input.spent !== null) {
      payload.budgetSpent = input.spent.toString();
    } else if (input.spent === null) {
      payload.budgetSpent = null;
    }

    if (input.currency !== undefined) {
      payload.budgetCurrency = input.currency ?? DEFAULT_CURRENCY;
    }

    await this.database.update(projects).set(payload).where(eq(projects.id, projectId));

    return this.getBudget(projectId);
  }

  async createBudgetCategory(
    projectId: string,
    input: CreateBudgetCategoryInput
  ): Promise<ProjectBudgetCategory> {
    const payload: typeof projectBudgetCategories.$inferInsert = {
      projectId,
      category: input.category,
      allocatedAmount:
        input.allocated !== undefined && input.allocated !== null ? input.allocated.toString() : "0",
      spentAmount:
        input.spent !== undefined && input.spent !== null ? input.spent.toString() : "0"
    };

    const [row] = await this.database.insert(projectBudgetCategories).values(payload).returning();

    if (!row) {
      throw new Error("Failed to create budget category");
    }

    return this.mapBudgetCategory(row);
  }

  async updateBudgetCategory(
    projectId: string,
    categoryId: string,
    input: UpdateBudgetCategoryInput
  ): Promise<ProjectBudgetCategory | null> {
    const existing = await this.database
      .select()
      .from(projectBudgetCategories)
      .where(and(eq(projectBudgetCategories.id, categoryId), eq(projectBudgetCategories.projectId, projectId)))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    const payload: Partial<typeof projectBudgetCategories.$inferInsert> = {
      updatedAt: new Date()
    };

    if (input.category !== undefined) payload.category = input.category;
    if (input.allocated !== undefined && input.allocated !== null) {
      payload.allocatedAmount = input.allocated.toString();
    }
    if (input.spent !== undefined && input.spent !== null) {
      payload.spentAmount = input.spent.toString();
    }

    await this.database
      .update(projectBudgetCategories)
      .set(payload)
      .where(eq(projectBudgetCategories.id, categoryId));

    const [row] = await this.database
      .select()
      .from(projectBudgetCategories)
      .where(eq(projectBudgetCategories.id, categoryId))
      .limit(1);

    return row ? this.mapBudgetCategory(row) : null;
  }

  async deleteBudgetCategory(projectId: string, categoryId: string): Promise<boolean> {
    const deleted = await this.database
      .delete(projectBudgetCategories)
      .where(and(eq(projectBudgetCategories.id, categoryId), eq(projectBudgetCategories.projectId, projectId)))
      .returning();

    return deleted.length > 0;
  }

  private mapProjectSummary(
    project: ProjectsTableRow,
    owner: BasicUserInfo | UserRow | undefined,
    stats?: { total: number; completed: number }
  ): ProjectSummary {
    const totalTasks = stats?.total ?? 0;
    const completedTasks = stats?.completed ?? 0;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const remainingDays = calculateRemainingDays(project.dueDate);

    return {
      id: project.id,
      name: project.name,
      description: project.description ?? null,
      customer: project.customer ?? null,
      status: project.status,
      statusLabel: statusLabelMap[project.status] ?? project.status,
      startDate: toIsoString(project.startDate),
      dueDate: toIsoString(project.dueDate),
      progress,
      totalTasks,
      completedTasks,
      remainingDays,
      owner: mapOwner(owner ?? null)
    };
  }

  private composeBudgetSummary(
    project: ProjectsTableRow,
    categories: ProjectBudgetCategory[]
  ): ProjectBudgetSummary {
    const totalProjectBudget = toNumber(project.budgetTotal, 0);
    const spentProjectBudget = toNumber(project.budgetSpent, 0);
    const currency = project.budgetCurrency ?? DEFAULT_CURRENCY;

    const categoriesAllocated = categories.reduce((acc, item) => acc + item.allocated, 0);
    const categoriesSpent = categories.reduce((acc, item) => acc + item.spent, 0);

    const total =
      totalProjectBudget > 0
        ? totalProjectBudget
        : categoriesAllocated > 0
        ? categoriesAllocated
        : 0;

    const spent =
      spentProjectBudget > 0
        ? spentProjectBudget
        : categoriesSpent > 0
        ? categoriesSpent
        : 0;

    return {
      currency,
      total,
      spent,
      remaining: Math.max(total - spent, 0),
      categories
    };
  }

  private async invalidateProjectCaches(projectId?: string): Promise<void> {
    if (!this.cache) {
      return;
    }

    if (projectId) {
      await this.cache.delete(`projects:details:${projectId}`);
    }

    await this.cache.deletePattern("projects:list*");
  }

  private async fetchProjectTasks(projectId: string): Promise<ProjectTask[]> {
    if (!isUuid(projectId)) {
      return [];
    }

    const rows = await this.database
      .select({
        task: projectTasks,
        assignee: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(projectTasks)
      .leftJoin(users, eq(projectTasks.assigneeId, users.id))
      .where(eq(projectTasks.projectId, projectId))
      .orderBy(asc(projectTasks.dueDate), asc(projectTasks.createdAt));

    return rows.map(({ task, assignee }) => this.mapTask(task, assignee ?? undefined));
  }

  private async getTaskById(taskId: string): Promise<ProjectTask | null> {
    if (!isUuid(taskId)) {
      return null;
    }

    const [row] = await this.database
      .select({
        task: projectTasks,
        assignee: users
      })
      .from(projectTasks)
      .leftJoin(users, eq(projectTasks.assigneeId, users.id))
      .where(eq(projectTasks.id, taskId))
      .limit(1);

    if (!row) {
      return null;
    }

    return this.mapTask(row.task, row.assignee ?? undefined);
  }

  private mapTask(task: TasksTableRow, assignee?: BasicUserInfo | UserRow): ProjectTask {
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      dueDate: toIsoString(task.dueDate),
      assignee: mapOwner(assignee),
      createdAt: toIsoString(task.createdAt) ?? new Date().toISOString(),
      updatedAt: toIsoString(task.updatedAt) ?? toIsoString(task.createdAt) ?? new Date().toISOString()
    };
  }

  private async fetchProjectTimeline(projectId: string): Promise<ProjectTimelineEvent[]> {
    if (!isUuid(projectId)) {
      return [];
    }

    const rows = await this.database
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId))
      .orderBy(asc(projectMilestones.dueDate), asc(projectMilestones.createdAt));

    return rows.map((row) => this.mapTimeline(row));
  }

  private async getTimelineEventById(eventId: string): Promise<ProjectTimelineEvent | null> {
    if (!isUuid(eventId)) {
      return null;
    }

    const [row] = await this.database
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.id, eventId))
      .limit(1);

    if (!row) {
      return null;
    }

    return this.mapTimeline(row);
  }

  private mapTimeline(row: TimelineTableRow): ProjectTimelineEvent {
    return {
      id: row.id,
      projectId: row.projectId,
      title: row.title,
      description: row.description ?? null,
      date: toIsoString(row.dueDate),
      status: taskStatusToTimelineStatus[row.status],
      createdAt: toIsoString(row.createdAt) ?? new Date().toISOString()
    };
  }

  private async fetchProjectTeam(projectId: string): Promise<ProjectTeamMember[]> {
    if (!isUuid(projectId)) {
      return [];
    }

    const rows = await this.database
      .select({
        membership: projectMembers,
        user: users
      })
      .from(projectMembers)
      .leftJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(asc(projectMembers.addedAt));

    return rows.map(({ membership, user }) => ({
      projectId: membership.projectId,
      userId: membership.userId,
      role: membership.role,
      name: user?.name ?? null,
      email: user?.email ?? null,
      addedAt: toIsoString(membership.addedAt) ?? new Date().toISOString()
    }));
  }

  private async fetchBudgetCategories(projectId: string): Promise<ProjectBudgetCategory[]> {
    if (!isUuid(projectId)) {
      return [];
    }

    const rows = await this.database
      .select()
      .from(projectBudgetCategories)
      .where(eq(projectBudgetCategories.projectId, projectId))
      .orderBy(asc(projectBudgetCategories.category));

    return rows.map((row) => this.mapBudgetCategory(row));
  }

  private mapBudgetCategory(row: BudgetCategoryRow): ProjectBudgetCategory {
    return {
      id: row.id,
      projectId: row.projectId,
      category: row.category,
      allocated: toNumber(row.allocatedAmount),
      spent: toNumber(row.spentAmount),
      createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
      updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString()
    };
  }
}

export const createProjectsService = (database: AppDatabase = defaultDb): ProjectsService =>
  new ProjectsService(database);

declare module "fastify" {
  interface FastifyInstance {
    projectsService: ProjectsService;
  }

  interface FastifyRequest {
    projectsService: ProjectsService;
  }
}

