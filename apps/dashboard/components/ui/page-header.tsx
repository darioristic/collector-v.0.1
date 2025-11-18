import type * as React from "react";

import { cn } from "@/lib/utils";

interface DashboardPageHeaderProps {
	title: string;
	description?: string;
	actions?: React.ReactNode;
	className?: string;
}

/**
 * Page header component for dashboard pages.
 * Used for pages with overview content, charts, and metrics.
 */
export function DashboardPageHeader({
	title,
	description,
	actions,
	className,
}: DashboardPageHeaderProps) {
	return (
		<div
			className={cn("flex flex-row items-center justify-between", className)}
		>
			<div className="space-y-1">
				<h1 className="text-xl font-bold tracking-tight lg:text-2xl">
					{title}
				</h1>
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}

interface TablePageHeaderProps {
	title: string;
	description?: string;
	actions?: React.ReactNode;
	className?: string;
}

/**
 * Page header component for table/list pages.
 * Used for pages with data tables and list views.
 */
export function TablePageHeader({
	title,
	description,
	actions,
	className,
}: TablePageHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
				className,
			)}
		>
			<div className="space-y-1">
				<h1 className="font-bold tracking-tight" style={{ fontSize: "26px" }}>
					{title}
				</h1>
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}
