"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import {
	CalendarDays,
	CheckCircle,
	CircleDashed,
	CircleDot,
	CircleSlash,
	MoreHorizontal,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ProjectTask, TaskStatus } from "@/src/types/projects";
import { DataTableColumnHeader } from "./data-table-column-header";

const statusConfig: Record<
	TaskStatus,
	{
		label: string;
		icon: React.ReactNode;
		badgeClass: string;
		groupLabel: string;
	}
> = {
	todo: {
		label: "Backlog",
		icon: <CircleDashed className="size-4" />,
		badgeClass: "bg-muted text-muted-foreground",
		groupLabel: "Backlog",
	},
	in_progress: {
		label: "In Progress",
		icon: <CircleDot className="size-4" />,
		badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
		groupLabel: "In Progress",
	},
	blocked: {
		label: "In Review",
		icon: <CircleSlash className="size-4" />,
		badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
		groupLabel: "In Review",
	},
	done: {
		label: "Done",
		icon: <CheckCircle className="size-4" />,
		badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
		groupLabel: "Done",
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

export function createColumns(
	onStatusChange: (task: ProjectTask, status: TaskStatus) => void,
	onDelete: (task: ProjectTask) => void,
	onTaskSelect?: (taskId: string) => void,
): ColumnDef<ProjectTask>[] {
	return [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
					className="translate-y-[2px]"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
					className="translate-y-[2px]"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "title",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Task" />
			),
			cell: ({ row }) => {
				const task = row.original;
				return (
					<div className="space-y-1">
						<button
							type="button"
							className="font-medium text-sm text-foreground cursor-pointer hover:underline text-left"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								if (onTaskSelect) {
									onTaskSelect(task.id);
								}
							}}
							onPointerDown={(e) => {
								e.stopPropagation();
							}}
						>
							{task.title}
						</button>
						{task.description ? (
							<p className="text-muted-foreground text-xs max-w-[500px] truncate">
								{task.description}
							</p>
						) : null}
					</div>
				);
			},
		},
		{
			accessorKey: "assignee",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Assignee" />
			),
			cell: ({ row }) => {
				const assignee = row.original.assignee;
				if (!assignee?.name && !assignee?.email) {
					return (
						<span className="text-muted-foreground text-xs">Unassigned</span>
					);
				}

				const initials = getInitials(assignee.name ?? assignee.email ?? "");

				return (
					<div className="flex items-center gap-2 text-sm">
						<Avatar className="h-8 w-8 border border-border">
							<AvatarFallback className="bg-primary/10 text-xs font-semibold uppercase">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="leading-tight">
							<div className="font-medium">{assignee.name ?? assignee.email}</div>
							{assignee.email && assignee.name ? (
								<div className="text-muted-foreground text-xs">
									{assignee.email}
								</div>
							) : null}
						</div>
					</div>
				);
			},
			filterFn: (row, id, value) => {
				const assignee = row.getValue(id) as ProjectTask["assignee"];
				if (!value) return true;
				if (!assignee) return false;
				const searchValue = value.toLowerCase();
				return (
					assignee.name?.toLowerCase().includes(searchValue) ||
					assignee.email?.toLowerCase().includes(searchValue) ||
					false
				);
			},
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Status" />
			),
			cell: ({ row }) => {
				const task = row.original;
				const status = task.status;
				const config = statusConfig[status];

				if (!config) {
					return null;
				}

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className={cn(
									"flex w-full items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
									config.badgeClass,
								)}
							>
								{config.icon}
								{config.label}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							{Object.entries(statusConfig).map(([value, option]) => (
								<DropdownMenuItem
									key={value}
									onSelect={(event) => {
										event.preventDefault();
										onStatusChange(task, value as TaskStatus);
									}}
									className="flex items-center gap-2 text-sm"
								>
									{option.icon}
									{option.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
		},
		{
			accessorKey: "dueDate",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Due Date" />
			),
			cell: ({ row }) => {
				const dueDate = row.getValue("dueDate") as string | null;
				return (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<CalendarDays className="size-4" />
						{formatDueDate(dueDate)}
					</div>
				);
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const task = row.original;
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 rounded-full"
							>
								<span className="sr-only">Open menu</span>
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
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
}

