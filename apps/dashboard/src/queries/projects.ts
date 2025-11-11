import type {
  AddTeamMemberPayload,
  CreateBudgetCategoryPayload,
  CreateTaskPayload,
  CreateTimelinePayload,
  ProjectBudgetCategory,
  ProjectBudgetSummary,
  ProjectDetails,
  ProjectSummary,
  ProjectTask,
  ProjectTeamMember,
  ProjectTimelineEvent,
  ProjectUpdatePayload,
  UpdateBudgetCategoryPayload,
  UpdateBudgetPayload,
  UpdateTaskPayload,
  UpdateTimelinePayload
} from "@/src/types/projects";
import { ensureResponse, getApiUrl } from "@/src/lib/fetch-utils";

const jsonHeaders: HeadersInit = {
  "Content-Type": "application/json",
  Accept: "application/json"
};

type ProjectListEnvelope = { data: ProjectSummary[] };
type ProjectEnvelope = { data: ProjectDetails };
type TaskEnvelope = { data: ProjectTask };
type TaskListEnvelope = { data: ProjectTask[] };
type TimelineEnvelope = { data: ProjectTimelineEvent };
type TimelineListEnvelope = { data: ProjectTimelineEvent[] };
type TeamEnvelope = { data: ProjectTeamMember };
type TeamListEnvelope = { data: ProjectTeamMember[] };
type BudgetEnvelope = { data: ProjectBudgetSummary };
type BudgetCategoryEnvelope = { data: ProjectBudgetCategory };

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: () => [...projectKeys.lists()] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  tasks: (id: string) => [...projectKeys.detail(id), "tasks"] as const,
  timeline: (id: string) => [...projectKeys.detail(id), "timeline"] as const,
  team: (id: string) => [...projectKeys.detail(id), "team"] as const,
  budget: (id: string) => [...projectKeys.detail(id), "budget"] as const
};

const projectsEndpoint = "projects";

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const response = await ensureResponse(
    await fetch(getApiUrl(projectsEndpoint), {
      method: "GET",
      headers: jsonHeaders,
      cache: "no-store"
    })
  );

  const payload = (await response.json()) as ProjectListEnvelope;
  return payload.data ?? [];
}

export async function fetchProject(id: string): Promise<ProjectDetails> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${id}`), {
      method: "GET",
      headers: jsonHeaders,
      cache: "no-store"
    })
  );

  const payload = (await response.json()) as ProjectEnvelope;
  return payload.data;
}

export async function createProject(input: ProjectUpdatePayload): Promise<ProjectDetails> {
  const response = await ensureResponse(
    await fetch(getApiUrl(projectsEndpoint), {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const payload = (await response.json()) as ProjectEnvelope;
  return payload.data;
}

export async function updateProject(id: string, input: ProjectUpdatePayload): Promise<ProjectDetails> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${id}`), {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const payload = (await response.json()) as ProjectEnvelope;
  return payload.data;
}

export async function deleteProject(id: string): Promise<void> {
  await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${id}`), {
      method: "DELETE",
      headers: jsonHeaders
    })
  );
}

export async function fetchProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/tasks`), {
      method: "GET",
      headers: jsonHeaders,
      cache: "no-store"
    })
  );

  const payload = (await response.json()) as TaskListEnvelope;
  return payload.data ?? [];
}

export async function createProjectTask(
  projectId: string,
  input: CreateTaskPayload
): Promise<ProjectTask> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/tasks`), {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const payload = (await response.json()) as TaskEnvelope;
  return payload.data;
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  input: UpdateTaskPayload
): Promise<ProjectTask> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/tasks/${taskId}`), {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const payload = (await response.json()) as TaskEnvelope;
  return payload.data;
}

export async function deleteProjectTask(projectId: string, taskId: string): Promise<void> {
  await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/tasks/${taskId}`), {
      method: "DELETE",
      headers: jsonHeaders
    })
  );
}

export async function fetchProjectTimeline(projectId: string): Promise<ProjectTimelineEvent[]> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/timeline`), {
      method: "GET",
      headers: jsonHeaders,
      cache: "no-store"
    })
  );

  const payload = (await response.json()) as TimelineListEnvelope;
  return payload.data ?? [];
}

export async function createTimelineEvent(
  projectId: string,
  input: CreateTimelinePayload
): Promise<ProjectTimelineEvent> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/timeline`), {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const payload = (await response.json()) as TimelineEnvelope;
  return payload.data;
}

export async function updateTimelineEvent(
  projectId: string,
  eventId: string,
  input: UpdateTimelinePayload
): Promise<ProjectTimelineEvent> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/timeline/${eventId}`), {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const payload = (await response.json()) as TimelineEnvelope;
  return payload.data;
}

export async function deleteTimelineEvent(projectId: string, eventId: string): Promise<void> {
  await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/timeline/${eventId}`), {
      method: "DELETE",
      headers: jsonHeaders
    })
  );
}

export async function fetchProjectTeam(projectId: string): Promise<ProjectTeamMember[]> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/team`), {
      method: "GET",
      headers: jsonHeaders,
      cache: "no-store"
    })
  );

  const payload = (await response.json()) as TeamListEnvelope;
  return payload.data ?? [];
}

export async function addTeamMember(
  projectId: string,
  input: AddTeamMemberPayload
): Promise<ProjectTeamMember> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/team`), {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const payload = (await response.json()) as TeamEnvelope;
  return payload.data;
}

export async function removeTeamMember(projectId: string, userId: string): Promise<void> {
  await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/team/${userId}`), {
      method: "DELETE",
      headers: jsonHeaders
    })
  );
}

export async function fetchProjectBudget(projectId: string): Promise<ProjectBudgetSummary> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/budget`), {
      method: "GET",
      headers: jsonHeaders,
      cache: "no-store"
    })
  );

  const payload = (await response.json()) as BudgetEnvelope;
  return payload.data;
}

export async function updateProjectBudget(
  projectId: string,
  input: UpdateBudgetPayload
): Promise<ProjectBudgetSummary> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/budget`), {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const payload = (await response.json()) as BudgetEnvelope;
  return payload.data;
}

export async function createBudgetCategory(
  projectId: string,
  input: CreateBudgetCategoryPayload
): Promise<ProjectBudgetCategory> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/budget/categories`), {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const payload = (await response.json()) as BudgetCategoryEnvelope;
  return payload.data;
}

export async function updateBudgetCategory(
  projectId: string,
  categoryId: string,
  input: UpdateBudgetCategoryPayload
): Promise<ProjectBudgetCategory> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/budget/categories/${categoryId}`), {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const payload = (await response.json()) as BudgetCategoryEnvelope;
  return payload.data;
}

export async function deleteBudgetCategory(
  projectId: string,
  categoryId: string
): Promise<void> {
  await ensureResponse(
    await fetch(getApiUrl(`${projectsEndpoint}/${projectId}/budget/categories/${categoryId}`), {
      method: "DELETE",
      headers: jsonHeaders
    })
  );
}

