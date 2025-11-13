"use client";

import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import {
	addTeamMember,
	createBudgetCategory,
	createProject,
	createProjectFromTemplate,
	createProjectTask,
	createTimelineEvent,
	deleteBudgetCategory,
	deleteProject,
	deleteProjectTask,
	deleteTimelineEvent,
	fetchProject,
	fetchProjectBudget,
	fetchProjects,
	fetchProjectTasks,
	fetchProjectTeam,
	fetchProjectTimeline,
	projectKeys,
	removeTeamMember,
	updateBudgetCategory,
	updateProject,
	updateProjectBudget,
	updateProjectTask,
	updateTimelineEvent,
} from "@/src/queries/projects";
import type { ProjectTemplate } from "@/lib/data/projectTemplates";
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
	UpdateTimelinePayload,
} from "@/src/types/projects";

export function useProjects(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: projectKeys.list(),
		queryFn: fetchProjects,
		enabled: options?.enabled ?? true,
	});
}

export function useProjectDetails(
	projectId: string,
	options?: { enabled?: boolean; suspense?: boolean },
) {
	if (options?.suspense) {
		if (options.enabled === false) {
			return useQuery<ProjectDetails>({
				queryKey: projectKeys.detail(projectId),
				queryFn: () => fetchProject(projectId),
				enabled: false,
			});
		}

		return useSuspenseQuery<ProjectDetails>({
			queryKey: projectKeys.detail(projectId),
			queryFn: async () => {
				try {
					const project = await fetchProject(projectId);
					return project;
				} catch (error) {
					console.error("[useProjectDetails] Error fetching project:", {
						projectId,
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
						errorType: error instanceof Error ? error.constructor.name : typeof error,
					});
					throw error;
				}
			},
			retry: (failureCount, error) => {
				// Don't retry on 404 (not found) errors
				if (error instanceof Error) {
					const message = error.message.toLowerCase();
					if (message.includes("404") || message.includes("not found")) {
						return false;
					}
				}
				// Retry up to 2 times for other errors
				return failureCount < 2;
			},
		});
	}

	return useQuery<ProjectDetails>({
		queryKey: projectKeys.detail(projectId),
		queryFn: async () => {
			try {
				const project = await fetchProject(projectId);
				return project;
			} catch (error) {
				console.error("[useProjectDetails] Error fetching project:", {
					projectId,
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
					errorType: error instanceof Error ? error.constructor.name : typeof error,
				});
				throw error;
			}
		},
		enabled: options?.enabled ?? Boolean(projectId),
		retry: (failureCount, error) => {
			// Don't retry on 404 (not found) errors
			if (error instanceof Error) {
				const message = error.message.toLowerCase();
				if (message.includes("404") || message.includes("not found")) {
					return false;
				}
			}
			// Retry up to 2 times for other errors
			return failureCount < 2;
		},
	});
}

export function useProjectTasks(
	projectId: string,
	options?: { enabled?: boolean },
) {
	return useQuery<ProjectTask[]>({
		queryKey: projectKeys.tasks(projectId),
		queryFn: () => fetchProjectTasks(projectId),
		enabled: options?.enabled ?? Boolean(projectId),
	});
}

export function useProjectTimeline(
	projectId: string,
	options?: { enabled?: boolean },
) {
	return useQuery<ProjectTimelineEvent[]>({
		queryKey: projectKeys.timeline(projectId),
		queryFn: () => fetchProjectTimeline(projectId),
		enabled: options?.enabled ?? Boolean(projectId),
	});
}

export function useProjectTeam(
	projectId: string,
	options?: { enabled?: boolean },
) {
	return useQuery<ProjectTeamMember[]>({
		queryKey: projectKeys.team(projectId),
		queryFn: () => fetchProjectTeam(projectId),
		enabled: options?.enabled ?? Boolean(projectId),
	});
}

export function useProjectBudget(
	projectId: string,
	options?: { enabled?: boolean },
) {
	return useQuery<ProjectBudgetSummary>({
		queryKey: projectKeys.budget(projectId),
		queryFn: () => fetchProjectBudget(projectId),
		enabled: options?.enabled ?? Boolean(projectId),
	});
}

export function useCreateProject() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (input: ProjectUpdatePayload) => createProject(input),
		onSuccess: async (project) => {
			await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
			await queryClient.invalidateQueries({
				queryKey: projectKeys.detail(project.id),
			});
			toast({
				title: "Projekat kreiran",
				description: "Novi projekat je uspešno dodat.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Kreiranje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri kreiranju projekta.",
			});
		},
	});
}

export function useUpdateProject(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (input: ProjectUpdatePayload) =>
			updateProject(projectId, input),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
			]);
			toast({
				title: "Projekat ažuriran",
				description: "Izmene su uspešno sačuvane.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Ažuriranje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri ažuriranju projekta.",
			});
		},
	});
}

export function useDeleteProject(
	projectId: string,
	options?: { onDeleted?: () => void },
) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: () => deleteProject(projectId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
			toast({
				title: "Projekat obrisan",
				description: "Projekat je uspešno obrisan.",
			});
			options?.onDeleted?.();
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Brisanje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri brisanju projekta.",
			});
		},
	});
}

export function useCreateProjectTask(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (input: CreateTaskPayload) =>
			createProjectTask(projectId, input),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.tasks(projectId),
				}),
			]);
			toast({
				title: "Zadatak dodat",
				description: "Novi zadatak je uspešno kreiran.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Dodavanje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri dodavanju zadatka.",
			});
		},
	});
}

export function useUpdateProjectTask(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: ({
			taskId,
			input,
		}: {
			taskId: string;
			input: UpdateTaskPayload;
		}) => updateProjectTask(projectId, taskId, input),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.tasks(projectId),
				}),
			]);
			toast({
				title: "Zadatak ažuriran",
				description: "Promene su uspešno sačuvane.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Ažuriranje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri ažuriranju zadatka.",
			});
		},
	});
}

export function useDeleteProjectTask(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (taskId: string) => deleteProjectTask(projectId, taskId),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.tasks(projectId),
				}),
			]);
			toast({
				title: "Zadatak obrisan",
				description: "Zadatak je uspešno uklonjen.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Brisanje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri brisanju zadatka.",
			});
		},
	});
}

export function useCreateTimelineEvent(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (input: CreateTimelinePayload) =>
			createTimelineEvent(projectId, input),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.timeline(projectId),
				}),
			]);
			toast({
				title: "Milestone dodat",
				description: "Uspešno ste dodali novu stavku na vremenskoj liniji.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Dodavanje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri dodavanju stavke na vremensku liniju.",
			});
		},
	});
}

export function useUpdateTimelineEvent(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: ({
			eventId,
			input,
		}: {
			eventId: string;
			input: UpdateTimelinePayload;
		}) => updateTimelineEvent(projectId, eventId, input),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.timeline(projectId),
				}),
			]);
			toast({
				title: "Milestone ažuriran",
				description: "Vremenska linija je osvežena.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Ažuriranje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri ažuriranju vremenske linije.",
			});
		},
	});
}

export function useDeleteTimelineEvent(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (eventId: string) => deleteTimelineEvent(projectId, eventId),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.timeline(projectId),
				}),
			]);
			toast({
				title: "Milestone obrisan",
				description: "Stavka je uklonjena sa vremenske linije.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Brisanje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri brisanju stavke.",
			});
		},
	});
}

export function useAddTeamMember(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (input: AddTeamMemberPayload) =>
			addTeamMember(projectId, input),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.team(projectId),
				}),
			]);
			toast({
				title: "Član dodat",
				description: "Član tima je uspešno dodat projektu.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Dodavanje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri dodavanju člana tima.",
			});
		},
	});
}

export function useRemoveTeamMember(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (userId: string) => removeTeamMember(projectId, userId),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.team(projectId),
				}),
			]);
			toast({
				title: "Član uklonjen",
				description: "Član tima je uklonjen sa projekta.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Uklanjanje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri uklanjanju člana tima.",
			});
		},
	});
}

export function useUpdateProjectBudget(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (input: UpdateBudgetPayload) =>
			updateProjectBudget(projectId, input),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.budget(projectId),
				}),
			]);
			toast({
				title: "Budžet ažuriran",
				description: "Budžet projekta je osvežen.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Ažuriranje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri ažuriranju budžeta.",
			});
		},
	});
}

export function useCreateBudgetCategory(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (input: CreateBudgetCategoryPayload) =>
			createBudgetCategory(projectId, input),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.budget(projectId),
				}),
			]);
			toast({
				title: "Budžetska stavka dodata",
				description: "Nova kategorija troška je dodata.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Dodavanje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri dodavanju kategorije.",
			});
		},
	});
}

export function useUpdateBudgetCategory(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: ({
			categoryId,
			input,
		}: {
			categoryId: string;
			input: UpdateBudgetCategoryPayload;
		}) => updateBudgetCategory(projectId, categoryId, input),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.budget(projectId),
				}),
			]);
			toast({
				title: "Budžetska stavka ažurirana",
				description: "Izmene su uspešno sačuvane.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Ažuriranje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri ažuriranju kategorije.",
			});
		},
	});
}

export function useDeleteBudgetCategory(projectId: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: (categoryId: string) =>
			deleteBudgetCategory(projectId, categoryId),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				}),
				queryClient.invalidateQueries({
					queryKey: projectKeys.budget(projectId),
				}),
			]);
			toast({
				title: "Budžetska stavka obrisana",
				description: "Kategorija je uklonjena iz budžeta.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Brisanje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri brisanju kategorije.",
			});
		},
	});
}

export function useCreateProjectFromTemplate() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: ({
			template,
			projectData,
		}: {
			template: ProjectTemplate;
			projectData: ProjectUpdatePayload;
		}) => createProjectFromTemplate(template, projectData),
		onSuccess: async (project) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
				queryClient.invalidateQueries({
					queryKey: projectKeys.detail(project.id),
				}),
			]);
			toast({
				title: "Projekat kreiran",
				description: "Novi projekat je uspešno kreiran iz template-a.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Kreiranje neuspešno",
				description:
					error instanceof Error
						? error.message
						: "Greška pri kreiranju projekta iz template-a.",
			});
		},
	});
}
