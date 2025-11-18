"use client";

import { format, parseISO } from "date-fns";
import { CalendarDays, MoreHorizontal, Trash2 } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as Kanban from "@/components/ui/kanban";
import type { ProjectTask, TaskStatus } from "@/src/types/projects";

const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

const statusConfig: Record<
	TaskStatus,
	{
		label: string;
		badgeClass: string;
	}
> = {
	todo: {
		label: "Backlog",
		badgeClass: "bg-muted text-muted-foreground",
	},
	in_progress: {
		label: "In Progress",
		badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
	},
	blocked: {
		label: "In Review",
		badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
	},
	done: {
		label: "Done",
		badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
	},
};

function getInitials(value: string) {
	return value
		.split(" ")
		.map((part) => part.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function formatDueDate(dueDate: string | null) {
	if (!dueDate) return "No due date";
	try {
		return format(parseISO(dueDate), "dd MMM yyyy");
	} catch {
		return "No due date";
	}
}

interface TasksKanbanBoardProps {
	tasks: ProjectTask[];
	onStatusChange: (task: ProjectTask, status: TaskStatus) => void;
	onDelete: (task: ProjectTask) => void;
	onTaskSelect?: (taskId: string) => void;
}

export function TasksKanbanBoard({
	tasks,
	onStatusChange,
	onDelete,
	onTaskSelect,
}: TasksKanbanBoardProps) {
	const groupedTasks = React.useMemo(() => {
		const grouped = STATUS_ORDER.reduce(
			(acc, status) => {
				acc[status] = [] as ProjectTask[];
				return acc;
			},
			{} as Record<TaskStatus, ProjectTask[]>,
		);

		tasks.forEach((task) => {
			const status = task.status ?? "todo";
			grouped[status]?.push(task);
		});

		return grouped;
	}, [tasks]);

	const [columns, setColumns] =
		React.useState<Record<TaskStatus, ProjectTask[]>>(groupedTasks);

	React.useEffect(() => {
		setColumns(groupedTasks);
	}, [groupedTasks]);

	const taskIndex = React.useMemo(() => {
		const map = new Map<string, ProjectTask>();
		STATUS_ORDER.forEach((status) => {
			columns[status]?.forEach((task) => {
				map.set(task.id, task);
			});
		});
		return map;
	}, [columns]);

	const handleValueChange = React.useCallback(
		(nextColumns: Record<TaskStatus, ProjectTask[]>) => {
			let movedTask: { id: string; status: TaskStatus } | null = null;

			for (const status of STATUS_ORDER) {
				const nextIds = new Set(
					nextColumns[status]?.map((task) => task.id) ?? [],
				);
				const prevIds = new Set(columns[status]?.map((task) => task.id) ?? []);

				// task removed from previous column
				for (const id of prevIds) {
					if (!nextIds.has(id)) {
						// find where it landed
						for (const targetStatus of STATUS_ORDER) {
							if (targetStatus === status) continue;
							const targetIds =
								nextColumns[targetStatus]?.map((task) => task.id) ?? [];
							if (targetIds.includes(id)) {
								movedTask = { id, status: targetStatus };
								break;
							}
						}
					}
					if (movedTask) break;
				}
				if (movedTask) break;
			}

			setColumns(nextColumns);

			if (movedTask) {
				const task = taskIndex.get(movedTask.id);
				if (task) {
					onStatusChange(task, movedTask.status);
				}
			}
		},
		[columns, taskIndex, onStatusChange],
	);

	return (
		<Kanban.Root
			value={columns}
			onValueChange={handleValueChange}
			getItemValue={(task) => task.id}
			accessibility={{
				announcements: {
					onDragStart({ active }) {
						return `Selected ${String(active.id)}`;
					},
					onDragEnd({ active, over }) {
						if (!over) return `Dropping ${String(active.id)} canceled`;
						return `${String(active.id)} dropped in ${String(over.id)}`;
					},
					onDragOver({ active, over }) {
						if (!over) return `Dragging ${String(active.id)}`;
						return `Dragging ${String(active.id)} over ${String(over.id)}`;
					},
					onDragCancel({ active }) {
						return `Drag for ${String(active.id)} canceled`;
					},
				},
			}}
		>
			<Kanban.Board className="flex w-full gap-4 overflow-x-auto pb-4">
				{STATUS_ORDER.map((status) => {
					const items = columns[status] ?? [];
					const config = statusConfig[status];

					return (
						<Kanban.Column
							key={status}
							value={status}
							className="w-[340px] min-w-[320px] flex-1 rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur transition"
						>
							<div className="flex items-start justify-between gap-2 rounded-lg border border-dashed border-border/60 bg-muted/40 px-3 py-2">
								<div className="space-y-1">
									<div className="flex items-center gap-2 text-sm font-semibold">
										<span>{config.label}</span>
									</div>
								</div>
								<Badge className={config.badgeClass}>{items.length}</Badge>
							</div>

							<div className="mt-3 flex min-h-[18rem] flex-1 flex-col gap-2">
								{items.length === 0 ? (
									<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
										No tasks
									</div>
								) : null}

								<div className="flex flex-1 flex-col gap-2">
									{items.map((task) => (
										<Kanban.Item key={task.id} value={task.id} asChild>
											<Card className="cursor-grab rounded-lg border bg-background/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg">
												<div className="space-y-3">
													<div className="space-y-1">
														<h3
															className="text-base font-semibold leading-6 cursor-pointer hover:underline"
															onClick={(e) => {
																e.stopPropagation();
																if (onTaskSelect) {
																	onTaskSelect(task.id);
																}
															}}
														>
															{task.title}
														</h3>
														{task.description ? (
															<p className="text-muted-foreground text-sm line-clamp-2">
																{task.description}
															</p>
														) : null}
													</div>

													<div className="flex items-center justify-between text-xs text-muted-foreground">
														{task.assignee ? (
															<div className="flex items-center gap-2">
																<Avatar className="h-6 w-6">
																	<AvatarFallback className="text-xs">
																		{getInitials(
																			task.assignee.name ??
																				task.assignee.email ??
																				"",
																		)}
																	</AvatarFallback>
																</Avatar>
																<span className="font-medium text-foreground">
																	{task.assignee.name ?? task.assignee.email}
																</span>
															</div>
														) : (
															<span className="text-muted-foreground text-xs">
																Unassigned
															</span>
														)}
														<div className="flex items-center gap-1">
															<CalendarDays
																className="h-3.5 w-3.5"
																aria-hidden="true"
															/>
															<span>{formatDueDate(task.dueDate)}</span>
														</div>
													</div>

													<div className="flex justify-end">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon"
																	className="size-6"
																	onClick={(e) => e.stopPropagation()}
																>
																	<MoreHorizontal className="size-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem
																	className="text-destructive focus:text-destructive"
																	onSelect={(event) => {
																		event.preventDefault();
																		onDelete(task);
																	}}
																>
																	<Trash2 className="mr-2 size-4" />
																	Delete
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
												</div>
											</Card>
										</Kanban.Item>
									))}
								</div>
							</div>
						</Kanban.Column>
					);
				})}
			</Kanban.Board>

			<Kanban.Overlay>
				{({ value, variant }) => {
					if (variant === "column") {
						return (
							<Card className="border-primary/60 bg-background/90 px-4 py-3 shadow-xl">
								<div className="animate-pulse text-sm font-semibold text-primary">
									Moving columns…
								</div>
							</Card>
						);
					}

					const task = taskIndex.get(String(value));
					if (!task) {
						return null;
					}

					return (
						<Card className="w-[300px] rounded-lg border border-primary/60 bg-background/95 p-4 shadow-xl">
							<div className="space-y-3">
								<div className="space-y-1">
									<h3 className="text-base font-semibold leading-6">
										{task.title}
									</h3>
									{task.description ? (
										<p className="text-muted-foreground text-sm line-clamp-2">
											{task.description}
										</p>
									) : null}
								</div>
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									{task.assignee ? (
										<div className="flex items-center gap-2">
											<Avatar className="h-6 w-6">
												<AvatarFallback className="text-xs">
													{getInitials(
														task.assignee.name ?? task.assignee.email ?? "",
													)}
												</AvatarFallback>
											</Avatar>
											<span className="font-medium text-foreground">
												{task.assignee.name ?? task.assignee.email}
											</span>
										</div>
									) : (
										<span className="text-muted-foreground text-xs">
											Unassigned
										</span>
									)}
									<div className="flex items-center gap-1">
										<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
										<span>{formatDueDate(task.dueDate)}</span>
									</div>
								</div>
							</div>
						</Card>
					);
				}}
			</Kanban.Overlay>
		</Kanban.Root>
	);
}
