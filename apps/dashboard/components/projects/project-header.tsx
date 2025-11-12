"use client";

export type ViewMode = "list" | "kanban" | "gantt" | "calendar" | "dashboard";

type ProjectHeaderProps = {
	projectId: string;
	projectName?: string;
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
	onGroupByStatus?: (enabled: boolean) => void;
	groupByStatus?: boolean;
	onCreateIssue?: () => void;
};

export function ProjectHeader({
	projectId,
	projectName = "Product Sprints",
	viewMode,
	onViewModeChange,
	onGroupByStatus,
	groupByStatus = false,
	onCreateIssue,
}: ProjectHeaderProps) {
	return null;
}

