export type ProjectStatus = "planned" | "active" | "on_hold" | "completed";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TimelineStatus = "completed" | "in_progress" | "upcoming";

export type ProjectOwner = {
  id: string | null;
  name: string | null;
  email: string | null;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  customer: string | null;
  status: ProjectStatus;
  statusLabel: string;
  startDate: string | null;
  dueDate: string | null;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  remainingDays: number | null;
  owner: ProjectOwner | null;
};

export type ProjectTask = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  assignee: ProjectOwner | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectTimelineEvent = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  date: string | null;
  status: TimelineStatus;
  createdAt: string;
};

export type ProjectTeamMember = {
  projectId: string;
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
  addedAt: string;
};

export type ProjectBudgetCategory = {
  id: string;
  projectId: string;
  category: string;
  allocated: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectBudgetSummary = {
  currency: string;
  total: number;
  spent: number;
  remaining: number;
  categories: ProjectBudgetCategory[];
};

export type ProjectQuickStats = {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  remainingDays: number | null;
};

export type ProjectDetails = ProjectSummary & {
  budget: ProjectBudgetSummary;
  tasks: ProjectTask[];
  timeline: ProjectTimelineEvent[];
  team: ProjectTeamMember[];
  quickStats: ProjectQuickStats;
};

export type ProjectPayload = {
  name: string;
  description?: string | null;
  customer?: string | null;
  status?: ProjectStatus;
  startDate?: string | null;
  dueDate?: string | null;
  ownerId?: string | null;
  accountId?: string | null;
  budget?: {
    total?: number | null;
    spent?: number | null;
    currency?: string | null;
  };
};

export type ProjectUpdatePayload = Partial<ProjectPayload>;

export type CreateTaskPayload = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
};

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export type CreateTimelinePayload = {
  title: string;
  description?: string | null;
  status?: TimelineStatus;
  date?: string | null;
};

export type UpdateTimelinePayload = Partial<CreateTimelinePayload>;

export type AddTeamMemberPayload = {
  userId: string;
  role?: string | null;
};

export type UpdateBudgetPayload = {
  total?: number | null;
  spent?: number | null;
  currency?: string | null;
};

export type CreateBudgetCategoryPayload = {
  category: string;
  allocated?: number | null;
  spent?: number | null;
};

export type UpdateBudgetCategoryPayload = Partial<CreateBudgetCategoryPayload>;

