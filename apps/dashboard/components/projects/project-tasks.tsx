"use client";

import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";
import type { Table as TanStackTable } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type {
	ProjectDetails,
	ProjectTask,
	TaskStatus,
	UpdateTaskPayload,
	CreateTaskPayload,
} from "@/src/types/projects";
import { DataTable } from "./tasks/data-table";
import { createColumns } from "./tasks/columns";
import { TasksKanbanBoard } from "./tasks/tasks-kanban-board";
import { TasksCalendarView } from "./tasks/tasks-calendar-view";
import { TasksGanttView } from "./tasks/tasks-gantt-view";
import ProjectTaskDetailSheet from "./tasks/project-task-detail-sheet";
import { ProjectTasksToolbar } from "./tasks/project-tasks-toolbar";
import { DetailTaskDialog } from "./tasks/detail-task-dialog";
import type { ViewMode } from "./project-header";

type ProjectTasksProps = {
	project: ProjectDetails;
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
	onUpdateTask: (
		taskId: string,
		payload: UpdateTaskPayload,
	) => Promise<unknown>;
	onDeleteTask: (taskId: string) => Promise<unknown>;
	onCreateTask: (payload: CreateTaskPayload) => Promise<unknown>;
};

export type ProjectTasksRef = {
	openAddTaskDialog: () => void;
};

export const ProjectTasks = forwardRef<ProjectTasksRef, ProjectTasksProps>(({
	project,
	viewMode,
	onViewModeChange,
	onUpdateTask,
	onDeleteTask,
	onCreateTask,
}, ref) => {
	const { toast } = useToast();
	const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
	const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
	const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [table, setTable] = useState<TanStackTable<ProjectTask> | null>(null);

	// Expose openAddTaskDialog function to parent
	useImperativeHandle(ref, () => ({
		openAddTaskDialog: () => setIsAddTaskDialogOpen(true),
	}));

	const handleStatusChange = useCallback(
		async (task: ProjectTask, status: TaskStatus) => {
			if (task.status === status) return;

			try {
				await onUpdateTask(task.id, { status });
			} catch (error) {
				toast({
					variant: "destructive",
					title: "Error",
					description:
						error instanceof Error
							? error.message
							: "Failed to update task status.",
				});
			}
		},
		[onUpdateTask, toast],
	);

	const handleDelete = useCallback(
		async (task: ProjectTask) => {
			try {
				await onDeleteTask(task.id);
				toast({
					title: "Task deleted",
					description: `"${task.title}" has been removed.`,
				});
			} catch (error) {
				toast({
					variant: "destructive",
					title: "Error",
					description:
						error instanceof Error
							? error.message
							: "Failed to delete task.",
				});
			}
		},
		[onDeleteTask, toast],
	);

	const handleTaskSelect = useCallback((taskId: string) => {
		setSelectedTaskId(taskId);
		setIsDetailSheetOpen(true);
	}, []);

	const handleCloseDetailSheet = useCallback(() => {
		setIsDetailSheetOpen(false);
		setSelectedTaskId(null);
	}, []);

	const handleAddTask = useCallback(async (data: {
		title: string;
		priority: string;
		assignedTo: Array<{ id: string; name: string; avatar?: string }>;
		description: string;
		reminder: boolean;
	}) => {
		if (!data.title.trim()) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Task title is required.",
			});
			return;
		}

		try {
			await onCreateTask({
				title: data.title,
				description: data.description,
				status: "todo",
			});
			setIsAddTaskDialogOpen(false);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to create task.",
			});
		}
	}, [onCreateTask, toast]);

	const columns = useMemo(
		() => createColumns(handleStatusChange, handleDelete, handleTaskSelect),
		[handleStatusChange, handleDelete, handleTaskSelect],
	);

	const selectedTask = selectedTaskId
		? project.tasks.find((t) => t.id === selectedTaskId)
		: null;

	// Filter tasks based on search value
	const filteredTasks = useMemo(() => {
		if (!searchValue.trim()) {
			return project.tasks;
		}
		const searchLower = searchValue.toLowerCase();
		return project.tasks.filter(
			(task) =>
				task.title.toLowerCase().includes(searchLower) ||
				task.description?.toLowerCase().includes(searchLower),
		);
	}, [project.tasks, searchValue]);

	const renderView = () => {
		switch (viewMode) {
			case "list":
				return (
					<DataTable
						columns={columns}
						data={filteredTasks}
						onTableReady={setTable}
					/>
				);
			case "kanban":
	return (
					<TasksKanbanBoard
						tasks={filteredTasks}
						onStatusChange={handleStatusChange}
						onDelete={handleDelete}
						onTaskSelect={handleTaskSelect}
					/>
				);
			case "gantt":
				return (
					<TasksGanttView
						tasks={filteredTasks}
						onTaskSelect={handleTaskSelect}
					/>
				);
			case "calendar":
				return (
					<TasksCalendarView
						tasks={filteredTasks}
						onTaskSelect={handleTaskSelect}
					/>
				);
			case "dashboard":
				return (
					<Card className="border-none bg-card/80 shadow-lg shadow-primary/5">
						<CardContent className="p-8 text-center text-muted-foreground">
							<p>Dashboard view will be available soon.</p>
						</CardContent>
					</Card>
				);
			default:
				return <DataTable columns={columns} data={filteredTasks} />;
		}
	};

	return (
		<>
			<div className="space-y-6">
                    <ProjectTasksToolbar
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        viewMode={viewMode}
                        onViewModeChange={onViewModeChange}
                        table={table ?? undefined}
                        onExportCSV={() => {
                            // TODO: Implement CSV export
                            toast({
                                title: "Export CSV",
                                description: "CSV export functionality will be available soon.",
                            });
                        }}
                    />
				{renderView()}
			</div>

		<ProjectTaskDetailSheet
			isOpen={isDetailSheetOpen}
			onClose={handleCloseDetailSheet}
			task={selectedTask || null}
			allTasks={project.tasks}
			onStatusChange={handleStatusChange}
			onDelete={handleDelete}
			onTaskSelect={handleTaskSelect}
		/>

			{/* Add Task Dialog */}
			<DetailTaskDialog
				isOpen={isAddTaskDialogOpen}
				onClose={() => setIsAddTaskDialogOpen(false)}
				onSave={handleAddTask}
			/>
		</>
	);
});

ProjectTasks.displayName = "ProjectTasks";
