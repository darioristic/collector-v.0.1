import { ensureResponse, getApiUrl } from "@/src/lib/fetch-utils";
import type { ProjectTemplate } from "@/lib/data/projectTemplates";
import type {
	AddTeamMemberPayload,
	CreateBudgetCategoryPayload,
	CreateTaskPayload,
	CreateTeamPayload,
	CreateTimeEntryPayload,
	CreateTimelinePayload,
	ProjectBudgetCategory,
	ProjectBudgetSummary,
	ProjectDetails,
	ProjectSummary,
	ProjectTask,
	ProjectTeam,
	ProjectTeamMember,
	ProjectTimeEntry,
	ProjectTimelineEvent,
	ProjectUpdatePayload,
	UpdateBudgetCategoryPayload,
	UpdateBudgetPayload,
	UpdateTaskPayload,
	UpdateTeamPayload,
	UpdateTimeEntryPayload,
	UpdateTimelinePayload,
} from "@/src/types/projects";

const jsonHeaders: HeadersInit = {
	"Content-Type": "application/json",
	Accept: "application/json",
};

type ProjectListEnvelope = { data: ProjectSummary[] };
type ProjectEnvelope = { data: ProjectDetails };
type TaskEnvelope = { data: ProjectTask };
type TaskListEnvelope = { data: ProjectTask[] };
type TimelineEnvelope = { data: ProjectTimelineEvent };
type TimelineListEnvelope = { data: ProjectTimelineEvent[] };
type TeamEnvelope = { data: ProjectTeamMember };
type TeamListEnvelope = { data: ProjectTeamMember[] };
type TeamEntityEnvelope = { data: ProjectTeam };
type TeamEntityListEnvelope = { data: ProjectTeam[] };
type BudgetEnvelope = { data: ProjectBudgetSummary };
type BudgetCategoryEnvelope = { data: ProjectBudgetCategory };
type TimeEntryEnvelope = { data: ProjectTimeEntry };
type TimeEntryListEnvelope = { data: ProjectTimeEntry[] };

export const projectKeys = {
	all: ["projects"] as const,
	lists: () => [...projectKeys.all, "list"] as const,
	list: () => [...projectKeys.lists()] as const,
	details: () => [...projectKeys.all, "detail"] as const,
	detail: (id: string) => [...projectKeys.details(), id] as const,
	tasks: (id: string) => [...projectKeys.detail(id), "tasks"] as const,
	timeline: (id: string) => [...projectKeys.detail(id), "timeline"] as const,
	teams: (id: string) => [...projectKeys.detail(id), "teams"] as const,
	team: (id: string) => [...projectKeys.detail(id), "team"] as const,
	timeEntries: (id: string) => [...projectKeys.detail(id), "timeEntries"] as const,
	budget: (id: string) => [...projectKeys.detail(id), "budget"] as const,
};

const projectsEndpoint = "projects";

export async function fetchProjects(): Promise<ProjectSummary[]> {
	const response = await ensureResponse(
		fetch(getApiUrl(projectsEndpoint), {
			method: "GET",
			headers: jsonHeaders,
			cache: "no-store",
		}),
	);

	const payload = (await response.json()) as ProjectListEnvelope;
	return payload.data ?? [];
}

export async function fetchProject(id: string): Promise<ProjectDetails> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${id}`), {
			method: "GET",
			headers: jsonHeaders,
			cache: "no-store",
		}),
	);

	const payload = (await response.json()) as ProjectEnvelope;
	
	if (!payload || !payload.data) {
		throw new Error(`Project ${id} not found or invalid response format`);
	}

	const project = payload.data;

	// Ensure backward compatibility - add missing fields if not present
	// Also ensure team members have teamId field
	const teamWithTeamId = (project.team ?? []).map((member) => ({
		...member,
		teamId: member.teamId ?? null,
	}));

	return {
		...project,
		teams: project.teams ?? [],
		team: teamWithTeamId,
		timeEntries: project.timeEntries ?? [],
		budget: {
			...project.budget,
			totalHours: project.budget?.totalHours ?? 0,
		},
	};
}

export async function createProject(
	input: ProjectUpdatePayload,
): Promise<ProjectDetails> {
	const response = await ensureResponse(
		fetch(getApiUrl(projectsEndpoint), {
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as ProjectEnvelope;
	return payload.data;
}

export async function updateProject(
	id: string,
	input: ProjectUpdatePayload,
): Promise<ProjectDetails> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${id}`), {
			method: "PATCH",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as ProjectEnvelope;
	return payload.data;
}

export async function deleteProject(id: string): Promise<void> {
	await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${id}`), {
			method: "DELETE",
			headers: jsonHeaders,
		}),
	);
}

export async function fetchProjectTasks(
	projectId: string,
): Promise<ProjectTask[]> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/tasks`), {
			method: "GET",
			headers: jsonHeaders,
			cache: "no-store",
		}),
	);

	const payload = (await response.json()) as TaskListEnvelope;
	return payload.data ?? [];
}

export async function createProjectTask(
	projectId: string,
	input: CreateTaskPayload,
): Promise<ProjectTask> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/tasks`), {
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as TaskEnvelope;
	return payload.data;
}

export async function updateProjectTask(
	projectId: string,
	taskId: string,
	input: UpdateTaskPayload,
): Promise<ProjectTask> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/tasks/${taskId}`), {
			method: "PATCH",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as TaskEnvelope;
	return payload.data;
}

export async function deleteProjectTask(
	projectId: string,
	taskId: string,
): Promise<void> {
	await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/tasks/${taskId}`), {
			method: "DELETE",
			headers: jsonHeaders,
		}),
	);
}

export async function fetchProjectTimeline(
	projectId: string,
): Promise<ProjectTimelineEvent[]> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/timeline`), {
			method: "GET",
			headers: jsonHeaders,
			cache: "no-store",
		}),
	);

	const payload = (await response.json()) as TimelineListEnvelope;
	return payload.data ?? [];
}

export async function createTimelineEvent(
	projectId: string,
	input: CreateTimelinePayload,
): Promise<ProjectTimelineEvent> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/timeline`), {
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as TimelineEnvelope;
	return payload.data;
}

export async function updateTimelineEvent(
	projectId: string,
	eventId: string,
	input: UpdateTimelinePayload,
): Promise<ProjectTimelineEvent> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/timeline/${eventId}`), {
			method: "PATCH",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as TimelineEnvelope;
	return payload.data;
}

export async function deleteTimelineEvent(
	projectId: string,
	eventId: string,
): Promise<void> {
	await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/timeline/${eventId}`), {
			method: "DELETE",
			headers: jsonHeaders,
		}),
	);
}

export async function fetchProjectTeam(
	projectId: string,
): Promise<ProjectTeamMember[]> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/team`), {
			method: "GET",
			headers: jsonHeaders,
			cache: "no-store",
		}),
	);

	const payload = (await response.json()) as TeamListEnvelope;
	return payload.data ?? [];
}

export async function addTeamMember(
	projectId: string,
	input: AddTeamMemberPayload,
): Promise<ProjectTeamMember> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/team`), {
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as TeamEnvelope;
	return payload.data;
}

export async function removeTeamMember(
	projectId: string,
	userId: string,
): Promise<void> {
	await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/team/${userId}`), {
			method: "DELETE",
			headers: jsonHeaders,
		}),
	);
}

export async function fetchProjectBudget(
	projectId: string,
): Promise<ProjectBudgetSummary> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/budget`), {
			method: "GET",
			headers: jsonHeaders,
			cache: "no-store",
		}),
	);

	const payload = (await response.json()) as BudgetEnvelope;
	return payload.data;
}

export async function updateProjectBudget(
	projectId: string,
	input: UpdateBudgetPayload,
): Promise<ProjectBudgetSummary> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/budget`), {
			method: "PATCH",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as BudgetEnvelope;
	return payload.data;
}

export async function createBudgetCategory(
	projectId: string,
	input: CreateBudgetCategoryPayload,
): Promise<ProjectBudgetCategory> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/budget/categories`), {
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as BudgetCategoryEnvelope;
	return payload.data;
}

export async function updateBudgetCategory(
	projectId: string,
	categoryId: string,
	input: UpdateBudgetCategoryPayload,
): Promise<ProjectBudgetCategory> {
	const response = await ensureResponse(
		fetch(
			getApiUrl(
				`${projectsEndpoint}/${projectId}/budget/categories/${categoryId}`,
			),
			{
				method: "PATCH",
				headers: jsonHeaders,
				body: JSON.stringify(input),
			},
		),
	);

	const payload = (await response.json()) as BudgetCategoryEnvelope;
	return payload.data;
}

export async function deleteBudgetCategory(
	projectId: string,
	categoryId: string,
): Promise<void> {
	await ensureResponse(
		fetch(
			getApiUrl(
				`${projectsEndpoint}/${projectId}/budget/categories/${categoryId}`,
			),
			{
				method: "DELETE",
				headers: jsonHeaders,
			},
		),
	);
}

export async function fetchProjectTeams(
	projectId: string,
): Promise<ProjectTeam[]> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/teams`), {
			method: "GET",
			headers: jsonHeaders,
			cache: "no-store",
		}),
	);

	const payload = (await response.json()) as TeamEntityListEnvelope;
	return payload.data ?? [];
}

export async function createProjectTeam(
	projectId: string,
	input: CreateTeamPayload,
): Promise<ProjectTeam> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/teams`), {
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as TeamEntityEnvelope;
	return payload.data;
}

export async function updateProjectTeam(
	projectId: string,
	teamId: string,
	input: UpdateTeamPayload,
): Promise<ProjectTeam> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/teams/${teamId}`), {
			method: "PATCH",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as TeamEntityEnvelope;
	return payload.data;
}

export async function deleteProjectTeam(
	projectId: string,
	teamId: string,
): Promise<void> {
	await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/teams/${teamId}`), {
			method: "DELETE",
			headers: jsonHeaders,
		}),
	);
}

export async function fetchProjectTimeEntries(
	projectId: string,
): Promise<ProjectTimeEntry[]> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/time-entries`), {
			method: "GET",
			headers: jsonHeaders,
			cache: "no-store",
		}),
	);

	const payload = (await response.json()) as TimeEntryListEnvelope;
	return payload.data ?? [];
}

export async function createTimeEntry(
	projectId: string,
	input: CreateTimeEntryPayload,
): Promise<ProjectTimeEntry> {
	const response = await ensureResponse(
		fetch(getApiUrl(`${projectsEndpoint}/${projectId}/time-entries`), {
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify(input),
		}),
	);

	const payload = (await response.json()) as TimeEntryEnvelope;
	return payload.data;
}

export async function updateTimeEntry(
	projectId: string,
	entryId: string,
	input: UpdateTimeEntryPayload,
): Promise<ProjectTimeEntry> {
	const response = await ensureResponse(
		fetch(
			getApiUrl(`${projectsEndpoint}/${projectId}/time-entries/${entryId}`),
			{
				method: "PATCH",
				headers: jsonHeaders,
				body: JSON.stringify(input),
			},
		),
	);

	const payload = (await response.json()) as TimeEntryEnvelope;
	return payload.data;
}

export async function deleteTimeEntry(
	projectId: string,
	entryId: string,
): Promise<void> {
	await ensureResponse(
		fetch(
			getApiUrl(`${projectsEndpoint}/${projectId}/time-entries/${entryId}`),
			{
				method: "DELETE",
				headers: jsonHeaders,
			},
		),
	);
}

export async function createProjectFromTemplate(
	template: ProjectTemplate,
	projectData: ProjectUpdatePayload,
): Promise<ProjectDetails> {
	// Create the project
	const project = await createProject(projectData);

	// Create tasks from all phases
	const taskPromises: Promise<ProjectTask>[] = [];
	for (const phase of template.phases) {
		for (const task of phase.tasks) {
			const taskPayload: CreateTaskPayload = {
				title: task.title,
				description: task.description,
				status: task.status || "todo",
			};
			taskPromises.push(createProjectTask(project.id, taskPayload));
		}
	}

	// Create timeline events (milestones) for each phase
	const timelinePromises: Promise<ProjectTimelineEvent>[] = [];
	for (const phase of template.phases) {
		const timelinePayload: CreateTimelinePayload = {
			title: phase.title,
			description: phase.description,
			status: "upcoming",
		};
		timelinePromises.push(createTimelineEvent(project.id, timelinePayload));
	}

	// Wait for all tasks and timeline events to be created
	await Promise.all([...taskPromises, ...timelinePromises]);

	// Fetch the complete project details
	return fetchProject(project.id);
}
