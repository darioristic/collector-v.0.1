"use client";

import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
	useCreateProjectTask,
	useDeleteProject,
	useDeleteProjectTask,
	useProjectDetails,
	useUpdateProject,
	useUpdateProjectTask,
} from "@/src/hooks/useProjects";
import type {
	ProjectStatus,
	ProjectUpdatePayload,
} from "@/src/types/projects";
import { ProjectTasks, type ProjectTasksRef } from "./project-tasks";
import type { ViewMode } from "./project-header";

type ProjectEditFormValues = {
	name: string;
	description: string;
	status: ProjectStatus;
	customer: string;
	ownerId: string;
	startDate: string;
	dueDate: string;
};

type ProjectDetailsViewProps = {
	projectId: string;
};

const statusOptions: { value: ProjectStatus; label: string }[] = [
	{ value: "planned", label: "Pending" },
	{ value: "active", label: "Active" },
	{ value: "on_hold", label: "On Hold" },
	{ value: "completed", label: "Completed" },
];

export function ProjectDetailsView({ projectId }: ProjectDetailsViewProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>("list");
	const projectTasksRef = useRef<ProjectTasksRef>(null);

	const projectQuery = useProjectDetails(projectId, { suspense: true });
	const updateProjectMutation = useUpdateProject(projectId);
	const deleteProjectMutation = useDeleteProject(projectId, {
		onDeleted: () => router.push("/projects/list"),
	});
	const updateTaskMutation = useUpdateProjectTask(projectId);
	const deleteTaskMutation = useDeleteProjectTask(projectId);
	const createTaskMutation = useCreateProjectTask(projectId);
	const project = projectQuery.data;

	const editForm = useForm<ProjectEditFormValues>({
		defaultValues: {
			name: "",
			description: "",
			status: "planned",
			customer: "",
			ownerId: "",
			startDate: "",
			dueDate: "",
		},
	});

	useEffect(() => {
		if (!project) {
			return;
		}

		editForm.reset({
			name: project.name,
			description: project.description ?? "",
			status: project.status,
			customer: project.customer ?? "",
			ownerId: project.owner?.id ?? "",
			startDate: project.startDate ? project.startDate.slice(0, 10) : "",
			dueDate: project.dueDate ? project.dueDate.slice(0, 10) : "",
		});
	}, [project, editForm]);

	if (!project) {
		return null;
	}

	const submitProjectUpdate = async (values: ProjectEditFormValues) => {
		const payload: ProjectUpdatePayload = {
			name: values.name,
			description: values.description,
			status: values.status,
			customer: values.customer,
			ownerId: values.ownerId || null,
			startDate: values.startDate || null,
			dueDate: values.dueDate || null,
		};

		try {
			await updateProjectMutation.mutateAsync(payload);
			toast({
				title: "Projekat ažuriran",
				description: "Promene na projektu su uspešno sačuvane.",
			});
			setIsEditDialogOpen(false);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Greška",
				description:
					error instanceof Error
						? error.message
						: "Ažuriranje projekta nije uspelo.",
			});
		}
	};

	const handleDeleteProject = async () => {
		try {
			await deleteProjectMutation.mutateAsync();
			toast({
				title: "Projekat obrisan",
				description: "Projekat je trajno uklonjen.",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Greška",
				description:
					error instanceof Error
						? error.message
						: "Brisanje projekta nije uspelo.",
			});
		}
	};

	return (
		<Fragment>
			<motion.section
				initial={{ opacity: 0, y: -8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25 }}
				className="space-y-8"
			>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
						<p className="text-muted-foreground text-sm">
							Monitor each task's status, assignee, and due date to keep your
							project moving.
						</p>
					</div>
					<Button
						onClick={() => {
							projectTasksRef.current?.openAddTaskDialog();
						}}
						className="gap-2"
					>
						<Plus className="size-4" />
						New Task
					</Button>
				</div>

				<ProjectTasks
					ref={projectTasksRef}
					project={project}
					viewMode={viewMode}
					onViewModeChange={setViewMode}
					onUpdateTask={(taskId, payload) =>
						updateTaskMutation.mutateAsync({ taskId, input: payload })
					}
					onDeleteTask={(taskId) => deleteTaskMutation.mutateAsync(taskId)}
					onCreateTask={(payload) => createTaskMutation.mutateAsync(payload)}
				/>
			</motion.section>

			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="md:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Izmeni projekat</DialogTitle>
					</DialogHeader>
					<form
						className="space-y-4"
						onSubmit={editForm.handleSubmit(submitProjectUpdate)}
					>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">Naziv</Label>
								<Input
									id="name"
									{...editForm.register("name", { required: true })}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="customer">Klijent</Label>
								<Input id="customer" {...editForm.register("customer")} />
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Opis</Label>
							<Input id="description" {...editForm.register("description")} />
						</div>
						<div className="grid gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<Label>Status</Label>
								<Controller
									control={editForm.control}
									name="status"
									render={({ field }) => (
										<select
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background"
											value={field.value}
											onChange={field.onChange}
										>
											{statusOptions.map((status) => (
												<option key={status.value} value={status.value}>
													{status.label}
												</option>
											))}
										</select>
									)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="startDate">Početak</Label>
								<Input
									id="startDate"
									type="date"
									{...editForm.register("startDate")}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="dueDate">Rok</Label>
								<Input
									id="dueDate"
									type="date"
									{...editForm.register("dueDate")}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsEditDialogOpen(false)}
							>
								Otkaži
							</Button>
							<Button type="submit" disabled={updateProjectMutation.isPending}>
								Sačuvaj promene
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Obrisati projekat?</AlertDialogTitle>
						<AlertDialogDescription>
							Ova radnja je trajna i ukloniće sve povezane podatke o projektu,
							zadacima, vremenskoj liniji i budžetu.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Otkaži</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDeleteProject}
							disabled={deleteProjectMutation.isPending}
						>
							Obriši projekat
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Fragment>
	);
}
