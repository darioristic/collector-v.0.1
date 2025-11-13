import type { projectStatus, taskStatus } from "../../db/schema/projects.schema";

export type ProjectStatus = (typeof projectStatus.enumValues)[number];
export type TaskStatus = (typeof taskStatus.enumValues)[number];

export type TimelineStatus = "completed" | "in_progress" | "upcoming";

export interface ProjectOwner {
  id: string | null;
  name: string | null;
  email: string | null;
}

export interface ProjectSummary {
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
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  assignee: ProjectOwner | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTimelineEvent {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  date: string | null;
  status: TimelineStatus;
  createdAt: string;
}

export interface ProjectTeam {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTeamMember {
  projectId: string;
  userId: string;
  teamId: string | null;
  role: string;
  name: string | null;
  email: string | null;
  addedAt: string;
}

export interface ProjectBudgetCategory {
  id: string;
  projectId: string;
  category: string;
  allocated: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTimeEntry {
  id: string;
  projectId: string;
  userId: string;
  taskId: string | null;
  hours: number;
  date: string;
  description: string | null;
  userName: string | null;
  userEmail: string | null;
  taskTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBudgetSummary {
  currency: string;
  total: number;
  spent: number;
  remaining: number;
  totalHours: number;
  categories: ProjectBudgetCategory[];
}

export interface ProjectDetails extends ProjectSummary {
  budget: ProjectBudgetSummary;
  tasks: ProjectTask[];
  timeline: ProjectTimelineEvent[];
  teams: ProjectTeam[];
  team: ProjectTeamMember[];
  timeEntries: ProjectTimeEntry[];
  quickStats: {
    totalTasks: number;
    completedTasks: number;
    remainingTasks: number;
    remainingDays: number | null;
  };
}

export interface ProjectCreateInput {
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
}

export interface ProjectUpdateInput extends Partial<ProjectCreateInput> {}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {}

export interface CreateTimelineEventInput {
  title: string;
  description?: string | null;
  status?: TimelineStatus;
  date?: string | null;
}

export interface UpdateTimelineEventInput extends Partial<CreateTimelineEventInput> {}

export interface CreateTeamInput {
  name: string;
  goal?: string | null;
}

export interface UpdateTeamInput extends Partial<CreateTeamInput> {}

export interface AddTeamMemberInput {
  userId: string;
  teamId?: string | null;
  role?: string | null;
}

export interface UpdateBudgetSummaryInput {
  total?: number | null;
  spent?: number | null;
  currency?: string | null;
}

export interface CreateBudgetCategoryInput {
  category: string;
  allocated?: number | null;
  spent?: number | null;
}

export interface UpdateBudgetCategoryInput extends Partial<CreateBudgetCategoryInput> {}

export interface CreateTimeEntryInput {
  userId: string;
  taskId?: string | null;
  hours: number;
  date: string;
  description?: string | null;
}

export interface UpdateTimeEntryInput extends Partial<CreateTimeEntryInput> {}

