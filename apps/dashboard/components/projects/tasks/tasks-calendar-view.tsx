"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
	addMonths,
	format,
	getDaysInMonth,
	isSameDay,
	isSameMonth,
	startOfMonth,
	subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectTask } from "@/src/types/projects";

interface TasksCalendarViewProps {
	tasks: ProjectTask[];
	onTaskSelect?: (taskId: string) => void;
}

export function TasksCalendarView({
	tasks,
	onTaskSelect,
}: TasksCalendarViewProps) {
	const [currentDate, setCurrentDate] = useState(new Date());

	const monthStart = startOfMonth(currentDate);
	const daysInMonth = getDaysInMonth(currentDate);
	const firstDayOfWeek = monthStart.getDay();

	// Get tasks grouped by date
	const tasksByDate = useMemo(() => {
		const grouped = new Map<string, ProjectTask[]>();

		tasks.forEach((task) => {
			if (!task.dueDate) return;

			try {
				const taskDate = new Date(task.dueDate);
				const dateKey = format(taskDate, "yyyy-MM-dd");
				if (!grouped.has(dateKey)) {
					grouped.set(dateKey, []);
				}
				grouped.get(dateKey)?.push(task);
			} catch {
				// Invalid date, skip
			}
		});

		return grouped;
	}, [tasks]);

	// Get tasks without due date
	const tasksWithoutDate = useMemo(() => {
		return tasks.filter((task) => !task.dueDate);
	}, [tasks]);

	const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	const goToPreviousMonth = () => {
		setCurrentDate(subMonths(currentDate, 1));
	};

	const goToNextMonth = () => {
		setCurrentDate(addMonths(currentDate, 1));
	};

	const goToToday = () => {
		setCurrentDate(new Date());
	};

	const renderCalendarDays = () => {
		const days = [];
		const today = new Date();

		// Empty cells for days before month starts
		for (let i = 0; i < firstDayOfWeek; i++) {
			days.push(
				<div key={`empty-${i}`} className="min-h-[100px] border border-border/50" />,
			);
		}

		// Days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
			const dateKey = format(date, "yyyy-MM-dd");
			const dayTasks = tasksByDate.get(dateKey) || [];
			const isToday = isSameDay(date, today);
			const isCurrentMonth = isSameMonth(date, currentDate);

			days.push(
				<div
					key={day}
					className={cn(
						"min-h-[100px] border border-border/50 p-2 transition-colors hover:bg-muted/50",
						isToday && "bg-primary/5 border-primary/30",
					)}
				>
					<div className="flex items-center justify-between mb-1">
						<span
							className={cn(
								"text-sm font-medium",
								isToday && "text-primary font-semibold",
								!isCurrentMonth && "text-muted-foreground",
							)}
						>
							{day}
						</span>
						{dayTasks.length > 0 && (
							<Badge variant="secondary" className="h-5 px-1.5 text-xs">
								{dayTasks.length}
							</Badge>
						)}
					</div>
					<div className="space-y-1 overflow-y-auto max-h-[70px]">
						{dayTasks.slice(0, 3).map((task) => (
							<Card
								key={task.id}
								className={cn(
									"p-1.5 cursor-pointer hover:bg-primary/10 transition-colors text-xs",
									"border-l-2",
									task.status === "todo" && "border-l-muted",
									task.status === "in_progress" && "border-l-sky-500",
									task.status === "blocked" && "border-l-amber-500",
									task.status === "done" && "border-l-emerald-500",
								)}
								onClick={() => onTaskSelect?.(task.id)}
							>
								<div className="truncate font-medium">{task.title}</div>
							</Card>
						))}
						{dayTasks.length > 3 && (
							<div className="text-xs text-muted-foreground px-1.5">
								+{dayTasks.length - 3} more
							</div>
						)}
					</div>
				</div>
			);
		}

		return days;
	};

	return (
		<div className="space-y-4">
			{/* Calendar Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={goToPreviousMonth}
						className="h-8 w-8"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<h2 className="text-lg font-semibold min-w-[200px] text-center">
						{format(currentDate, "MMMM yyyy")}
					</h2>
					<Button
						variant="outline"
						size="icon"
						onClick={goToNextMonth}
						className="h-8 w-8"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
				<Button variant="outline" size="sm" onClick={goToToday}>
					Today
				</Button>
			</div>

			{/* Calendar Grid */}
			<div className="border rounded-lg overflow-hidden">
				{/* Weekday Headers */}
				<div className="grid grid-cols-7 bg-muted/50">
					{weekDays.map((day) => (
						<div
							key={day}
							className="p-2 text-center text-sm font-semibold text-muted-foreground border-r border-border/50 last:border-r-0"
						>
							{day}
						</div>
					))}
				</div>

				{/* Calendar Days */}
				<div className="grid grid-cols-7">{renderCalendarDays()}</div>
			</div>

			{/* Tasks without due date */}
			{tasksWithoutDate.length > 0 && (
				<Card className="p-4">
					<div className="flex items-center gap-2 mb-3">
						<CalendarDays className="h-4 w-4 text-muted-foreground" />
						<h3 className="font-semibold text-sm">Tasks without due date</h3>
						<Badge variant="secondary" className="ml-auto">
							{tasksWithoutDate.length}
						</Badge>
					</div>
					<div className="space-y-2">
						{tasksWithoutDate.map((task) => (
							<Card
								key={task.id}
								className={cn(
									"p-2 cursor-pointer hover:bg-primary/10 transition-colors",
									"border-l-2",
									task.status === "todo" && "border-l-muted",
									task.status === "in_progress" && "border-l-sky-500",
									task.status === "blocked" && "border-l-amber-500",
									task.status === "done" && "border-l-emerald-500",
								)}
								onClick={() => onTaskSelect?.(task.id)}
							>
								<div className="font-medium text-sm">{task.title}</div>
								{task.description && (
									<div className="text-xs text-muted-foreground mt-1 line-clamp-1">
										{task.description}
									</div>
								)}
							</Card>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}

