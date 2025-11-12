"use client";

import type { Activity, ActivityStatus } from "@crm/types";
import { format } from "date-fns";
import {
	CalendarClock,
	Check,
	Eye,
	PenSquare,
	UserCircle2,
} from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
	ACTIVITY_PRIORITY_LABEL,
	ACTIVITY_PRIORITY_STYLES,
	ACTIVITY_STATUS_LABEL,
	ACTIVITY_STATUS_STYLES,
	ACTIVITY_TYPE_ICONS,
	ACTIVITY_TYPE_LABEL,
	pillClassName,
} from "../constants";

interface CompactViewProps {
	activities: Activity[];
	total: number;
	pageSize: number;
	currentPage: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onEdit: (activity: Activity) => void;
	onStatusChange: (activity: Activity, status: ActivityStatus) => void;
	onView?: (activity: Activity) => void;
}

const getAvatarFallback = (activity: Activity) => {
	if (activity.assignedToName) {
		return activity.assignedToName
			.split(" ")
			.map((word) => word.charAt(0))
			.join("")
			.slice(0, 2)
			.toUpperCase();
	}

	return activity.clientName.charAt(0).toUpperCase();
};

export function CompactView({
	activities,
	total,
	pageSize,
	currentPage,
	onPageChange,
	onPageSizeChange,
	onEdit,
	onStatusChange,
	onView,
}: CompactViewProps) {
	if (activities.length === 0) {
		return (
			<Card className="border-dashed">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<UserCircle2
							className="h-5 w-5 text-muted-foreground"
							aria-hidden
						/>
						No activities available
					</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					Adjust filters or add a new activity to populate this grid view.
				</CardContent>
			</Card>
		);
	}

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{activities.map((activity) => {
					const ActivityIcon = ACTIVITY_TYPE_ICONS[activity.type];
					const dueDate = new Date(activity.dueDate);

					return (
						<Card
							key={activity.id}
							className="flex flex-col border border-muted/70 shadow-none transition hover:border-primary/40"
						>
							<CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
								<div className="flex items-center gap-3">
									<span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
										<ActivityIcon className="h-5 w-5" aria-hidden />
									</span>
									<div>
										<CardTitle className="line-clamp-1 text-base">
											{activity.title}
										</CardTitle>
										<p className="text-xs text-muted-foreground">
											{activity.clientName}
										</p>
									</div>
								</div>
								<Badge
									className={pillClassName(
										ACTIVITY_STATUS_STYLES[activity.status],
									)}
								>
									{ACTIVITY_STATUS_LABEL[activity.status]}
								</Badge>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col gap-3 text-sm">
								<div className="flex items-center gap-2">
									<CalendarClock
										className="h-4 w-4 text-muted-foreground"
										aria-hidden
									/>
									<div className="flex flex-col leading-tight">
										<span>{format(dueDate, "MMM dd, yyyy")}</span>
										<span className="text-xs text-muted-foreground">
											{format(dueDate, "hh:mm a")}
										</span>
									</div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Badge
										className={pillClassName(
											ACTIVITY_PRIORITY_STYLES[activity.priority],
										)}
									>
										{ACTIVITY_PRIORITY_LABEL[activity.priority]}
									</Badge>
									<Badge
										variant="outline"
										className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
									>
										{ACTIVITY_TYPE_LABEL[activity.type]}
									</Badge>
								</div>
								<div className="flex items-center gap-3 rounded-md border bg-muted/40 p-2 text-xs">
									<Avatar className="h-8 w-8">
										<AvatarFallback>
											{getAvatarFallback(activity)}
										</AvatarFallback>
									</Avatar>
									<div className="flex flex-col">
										<span className="font-medium">
											{activity.assignedToName ?? "Unassigned"}
										</span>
										<span className="text-muted-foreground">
											{activity.assignedToEmail ?? "No email"}
										</span>
									</div>
								</div>
								{activity.notes ? (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<p className="line-clamp-2 text-xs text-muted-foreground/90">
													“{activity.notes}”
												</p>
											</TooltipTrigger>
											<TooltipContent className="max-w-xs text-xs">
												{activity.notes}
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								) : null}
							</CardContent>
							<CardFooter className="flex items-center justify-between border-t bg-muted/40 px-4 py-3">
								<div className="text-xs text-muted-foreground">
									Updated {format(new Date(activity.updatedAt), "MMM dd, yyyy")}
								</div>
								<div className="flex items-center gap-2">
									{onView ? (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => onView(activity)}
													>
														<Eye className="h-4 w-4" aria-hidden />
														<span className="sr-only">View activity</span>
													</Button>
												</TooltipTrigger>
												<TooltipContent>View details</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									) : null}
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => onEdit(activity)}
												>
													<PenSquare className="h-4 w-4" aria-hidden />
													<span className="sr-only">Edit activity</span>
												</Button>
											</TooltipTrigger>
											<TooltipContent>Edit</TooltipContent>
										</Tooltip>
									</TooltipProvider>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													disabled={activity.status === "completed"}
													onClick={() => onStatusChange(activity, "completed")}
												>
													<Check className="h-4 w-4" aria-hidden />
													<span className="sr-only">Mark as completed</span>
												</Button>
											</TooltipTrigger>
											<TooltipContent>Mark as completed</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
							</CardFooter>
						</Card>
					);
				})}
			</div>

			<div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2">
					<span>Rows per page</span>
					<Select
						value={String(pageSize)}
						onValueChange={(value) => onPageSizeChange(Number(value))}
					>
						<SelectTrigger className="h-8 w-[80px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[6, 12, 24, 48].map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(currentPage - 1)}
						disabled={currentPage <= 1}
					>
						Previous
					</Button>
					<span>
						Page {currentPage} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(currentPage + 1)}
						disabled={currentPage >= totalPages}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
