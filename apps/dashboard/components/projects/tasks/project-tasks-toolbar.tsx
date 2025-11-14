"use client";

import { Calendar, Download, GanttChart, LayoutGrid, LayoutList, Search, X } from "lucide-react";
import {
	CheckCircle,
	CircleDashed,
	CircleDot,
	CircleSlash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";
import type { ViewMode } from "../project-header";
import type { ProjectTask, TaskStatus } from "@/src/types/projects";
import type { Table } from "@tanstack/react-table";

const statuses: {
	value: TaskStatus;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}[] = [
	{
		value: "todo",
		label: "Backlog",
		icon: CircleDashed,
	},
	{
		value: "in_progress",
		label: "In Progress",
		icon: CircleDot,
	},
	{
		value: "blocked",
		label: "In Review",
		icon: CircleSlash,
	},
	{
		value: "done",
		label: "Done",
		icon: CheckCircle,
	},
];

type ProjectTasksToolbarProps = {
	searchValue: string;
	onSearchChange: (value: string) => void;
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
	table?: Table<ProjectTask>;
	onExportCSV?: () => void;
};

export function ProjectTasksToolbar({
	searchValue,
	onSearchChange,
	viewMode,
	onViewModeChange,
	table,
	onExportCSV,
}: ProjectTasksToolbarProps) {
	const columnFilters = table?.getState()?.columnFilters ?? [];
	const isFiltered = columnFilters.length > 0 || searchValue.trim().length > 0;

	const handleClearFilters = () => {
		table?.resetColumnFilters();
		onSearchChange("");
	};

	return (
		<div className="flex items-center gap-2 flex-wrap bg-muted/30 p-3 rounded-lg border">
			{/* Search Input */}
			<div className="relative flex-1 min-w-[200px]">
				<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					placeholder="Search tasks by name, description, or status"
					value={searchValue}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-8 h-9 bg-background"
				/>
			</div>

			{/* Status Filter */}
			{table?.getColumn("status") && (
				<DataTableFacetedFilter
					column={table.getColumn("status")}
					title="All statuses"
					options={statuses}
				/>
			)}

			{/* Clear Filters */}
			{isFiltered && (
				<Button
					variant="ghost"
					size="sm"
					onClick={handleClearFilters}
					className="h-9 gap-2 text-muted-foreground hover:text-foreground"
				>
					<X className="size-4" />
					Clear filters
				</Button>
			)}

			{/* Export CSV */}
			<Button
				variant="outline"
				size="sm"
				onClick={onExportCSV}
				className="h-9 gap-2"
			>
				<Download className="size-4" />
				Export CSV
			</Button>

			{/* Columns */}
			{table && (
				<DataTableViewOptions table={table} />
			)}

			{/* View Icons */}
			<div className="flex items-center gap-1 border rounded-md p-1 bg-background">
				<Button
					variant={viewMode === "list" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => onViewModeChange("list")}
					className="h-7 px-2"
					title="List view"
				>
					<LayoutList className="size-4" />
				</Button>
				<Button
					variant={viewMode === "kanban" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => onViewModeChange("kanban")}
					className="h-7 px-2"
					title="Kanban view"
				>
					<LayoutGrid className="size-4" />
				</Button>
				<Button
					variant={viewMode === "calendar" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => onViewModeChange("calendar")}
					className="h-7 px-2"
					title="Calendar view"
				>
					<Calendar className="size-4" />
				</Button>
				<Button
					variant={viewMode === "gantt" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => onViewModeChange("gantt")}
					className="h-7 px-2"
					title="Gantt view"
				>
					<GanttChart className="size-4" />
				</Button>
			</div>
		</div>
	);
}

