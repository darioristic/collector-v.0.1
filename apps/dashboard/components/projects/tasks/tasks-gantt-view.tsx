"use client";

import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
	addDays,
	addWeeks,
	differenceInDays,
	endOfWeek,
	format,
	startOfWeek,
	subWeeks,
} from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProjectTask, TaskStatus } from "@/src/types/projects";

interface TasksGanttViewProps {
	tasks: ProjectTask[];
	onTaskSelect?: (taskId: string) => void;
}

const statusConfig: Record<
	TaskStatus,
	{
		label: string;
		badgeClass: string;
		barColor: string;
	}
> = {
	todo: {
		label: "Backlog",
		badgeClass: "bg-muted text-muted-foreground",
		barColor: "bg-purple-500",
	},
	in_progress: {
		label: "In Progress",
		badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
		barColor: "bg-purple-500",
	},
	blocked: {
		label: "In Review",
		badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
		barColor: "bg-purple-500",
	},
	done: {
		label: "Done",
		badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
		barColor: "bg-gray-400",
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

function calculateTaskDuration(task: ProjectTask): { start: Date; end: Date; days: number } | null {
	if (!task.dueDate) return null;

	try {
		const endDate = new Date(task.dueDate);
		// If no start date, assume task starts 3 days before due date or from creation
		const createdAt = new Date(task.createdAt);
		const startDate = createdAt < endDate ? createdAt : addDays(endDate, -3);
		
		const days = Math.max(1, differenceInDays(endDate, startDate) + 1);
		
		return {
			start: startDate,
			end: endDate,
			days,
		};
	} catch {
		return null;
	}
}

export function TasksGanttView({
	tasks,
	onTaskSelect,
}: TasksGanttViewProps) {
	const [currentWeekStart, setCurrentWeekStart] = useState(() =>
		startOfWeek(new Date(), { weekStartsOn: 1 }),
	);

	const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
	const weekDays = useMemo(() => {
		const days = [];
		for (let i = 0; i < 7; i++) {
			days.push(addDays(currentWeekStart, i));
		}
		return days;
	}, [currentWeekStart]);

	const goToPreviousWeek = () => {
		setCurrentWeekStart(subWeeks(currentWeekStart, 1));
	};

	const goToNextWeek = () => {
		setCurrentWeekStart(addWeeks(currentWeekStart, 1));
	};

	const goToToday = () => {
		setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
	};

	// Filter tasks that have dates and are visible in current week
	const visibleTasks = useMemo(() => {
		return tasks
			.map((task) => {
				const duration = calculateTaskDuration(task);
				if (!duration) return null;

				// Check if task overlaps with current week
				const taskEnd = duration.end;
				const weekStartDate = currentWeekStart;
				const weekEndDate = weekEnd;

				if (taskEnd < weekStartDate || duration.start > weekEndDate) {
					return null;
				}

				return { task, duration };
			})
			.filter((item): item is { task: ProjectTask; duration: { start: Date; end: Date; days: number } } => item !== null);
	}, [tasks, currentWeekStart, weekEnd]);

	// Calculate position and width for Gantt bars
	const getTaskBarStyle = (
		taskDuration: { start: Date; end: Date; days: number },
	) => {
		const weekStartDate = currentWeekStart;
		const weekEndDate = weekEnd;
		const totalDays = 7;
		const dayWidth = 100 / totalDays; // Percentage

		// Calculate start position
		let startDay = 0;
		if (taskDuration.start < weekStartDate) {
			startDay = 0;
		} else {
			startDay = differenceInDays(taskDuration.start, weekStartDate);
		}

		// Calculate end position
		let endDay = totalDays - 1;
		if (taskDuration.end > weekEndDate) {
			endDay = totalDays - 1;
		} else {
			endDay = differenceInDays(taskDuration.end, weekStartDate);
		}

		const left = startDay * dayWidth;
		const width = (endDay - startDay + 1) * dayWidth;

		return {
			left: `${left}%`,
			width: `${width}%`,
		};
	};

	const isWeekend = (date: Date) => {
		const day = date.getDay();
		return day === 0 || day === 6; // Sunday or Saturday
	};

	return (
		<div className="space-y-4">
			{/* Header Controls */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={goToPreviousWeek}
						className="h-8 w-8"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<h2 className="text-lg font-semibold min-w-[200px] text-center">
						{format(currentWeekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
					</h2>
					<Button
						variant="outline"
						size="icon"
						onClick={goToNextWeek}
						className="h-8 w-8"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
				<Button variant="outline" size="sm" onClick={goToToday}>
					Today
				</Button>
			</div>

			{/* Gantt Chart */}
			<div className="border rounded-lg overflow-hidden bg-background">
				{/* Timeline Header */}
				<div className="grid grid-cols-[280px_1fr] border-b bg-muted/30">
					<div className="border-r p-3 flex items-center justify-between">
						<span className="font-semibold text-sm">Task</span>
						<div className="flex items-center gap-1">
							<Button variant="ghost" size="icon" className="h-6 w-6">
								<Plus className="h-3 w-3" />
							</Button>
							<Button variant="ghost" size="icon" className="h-6 w-6">
								<Filter className="h-3 w-3" />
							</Button>
						</div>
					</div>
					<div className="grid grid-cols-7">
						{weekDays.map((day) => (
							<div
								key={day.toISOString()}
								className={cn(
									"p-2 text-center text-xs font-medium border-r last:border-r-0",
									isWeekend(day) && "bg-yellow-50 dark:bg-yellow-950/20",
								)}
							>
								<div className="font-semibold">{format(day, "EEE")}</div>
								<div className="text-muted-foreground">{format(day, "d")}</div>
							</div>
						))}
					</div>
				</div>

				{/* Task Rows */}
				<div className="divide-y">
					{visibleTasks.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground text-sm">
							No tasks with due dates for this week.
						</div>
					) : (
						visibleTasks.map(({ task, duration }, _index) => {
							const config = statusConfig[task.status];
							const barStyle = getTaskBarStyle(duration);
							const assigneeName =
								task.assignee?.name ?? task.assignee?.email ?? "Unassigned";

							return (
								<div
									key={task.id}
									className="grid grid-cols-[280px_1fr] min-h-[80px] hover:bg-muted/20 transition-colors"
								>
									{/* Task Info Column */}
									<div className="border-r p-3 flex items-center gap-3">
										{task.assignee ? (
											<Avatar className="h-8 w-8">
												<AvatarFallback className="text-xs">
													{getInitials(assigneeName)}
												</AvatarFallback>
											</Avatar>
										) : (
											<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
												<span className="text-xs text-muted-foreground">?</span>
											</div>
										)}
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm truncate">
												{task.title}
											</div>
											<div className="flex items-center gap-2 mt-1">
												<Badge className={cn("text-xs", config.badgeClass)}>
													{config.label}
												</Badge>
											</div>
										</div>
									</div>

									{/* Timeline Column */}
									<div className="relative p-2">
										<div className="grid grid-cols-7 h-full relative">
											{weekDays.map((day) => (
												<div
													key={day.toISOString()}
													className={cn(
														"border-r last:border-r-0 border-dashed border-border/50",
														isWeekend(day) && "bg-yellow-50/50 dark:bg-yellow-950/10",
													)}
												/>
											))}

											{/* Gantt Bar */}
											<div
												className={cn(
													"absolute top-2 bottom-2 rounded-lg px-3 py-1.5 cursor-pointer",
													"flex items-center text-white text-xs font-medium",
													"hover:opacity-90 transition-opacity shadow-sm",
													config.barColor,
												)}
												style={barStyle}
												onClick={() => onTaskSelect?.(task.id)}
											>
												<div className="truncate">{task.title}</div>
											</div>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* Tasks without dates */}
			{tasks.filter((t) => !t.dueDate).length > 0 && (
				<Card className="p-4">
					<div className="flex items-center gap-2 mb-3">
						<h3 className="font-semibold text-sm">Tasks without due date</h3>
						<Badge variant="secondary" className="ml-auto">
							{tasks.filter((t) => !t.dueDate).length}
						</Badge>
					</div>
					<div className="space-y-2">
						{tasks
							.filter((t) => !t.dueDate)
							.map((task) => {
								const config = statusConfig[task.status];
								const assigneeName =
									task.assignee?.name ?? task.assignee?.email ?? "Unassigned";

								return (
									<Card
										key={task.id}
										className="p-2 cursor-pointer hover:bg-primary/10 transition-colors"
										onClick={() => onTaskSelect?.(task.id)}
									>
										<div className="flex items-center gap-3">
											{task.assignee ? (
												<Avatar className="h-8 w-8">
													<AvatarFallback className="text-xs">
														{getInitials(assigneeName)}
													</AvatarFallback>
												</Avatar>
											) : (
												<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
													<span className="text-xs text-muted-foreground">?</span>
												</div>
											)}
											<div className="flex-1">
												<div className="font-medium text-sm">{task.title}</div>
												{task.description && (
													<div className="text-xs text-muted-foreground mt-1 line-clamp-1">
														{task.description}
													</div>
												)}
											</div>
											<Badge className={cn("text-xs", config.badgeClass)}>
												{config.label}
											</Badge>
										</div>
									</Card>
								);
							})}
					</div>
				</Card>
			)}
		</div>
	);
}

