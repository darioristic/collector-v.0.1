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
	projectId: _projectId,
	projectName: _projectName = "Product Sprints",
	viewMode: _viewMode,
	onViewModeChange: _onViewModeChange,
	onGroupByStatus: _onGroupByStatus,
	groupByStatus: _groupByStatus = false,
	onCreateIssue: _onCreateIssue,
}: ProjectHeaderProps) {
	return null;
}
