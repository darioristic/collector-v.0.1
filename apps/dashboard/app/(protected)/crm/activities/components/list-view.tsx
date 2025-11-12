"use client";

import type { Activity, ActivityStatus } from "@crm/types";
import { format } from "date-fns";
import {
	ArrowDown,
	ArrowUp,
	CalendarClock,
	ChevronLeft,
	ChevronRight,
	MoreHorizontal,
	PenSquare,
} from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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
	ACTIVITY_TYPE_LABEL,
	pillClassName,
} from "../constants";

type SortKey =
	| "title"
	| "clientName"
	| "dueDate"
	| "status"
	| "priority"
	| "assignedToName";

type SortDirection = "asc" | "desc";

interface ListViewProps {
	activities: Activity[];
	total: number;
	pageSize: number;
	currentPage: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onEdit: (activity: Activity) => void;
	onStatusChange: (activity: Activity, status: ActivityStatus) => void;
	onDelete?: (activity: Activity) => void;
}

const getInitials = (name?: string | null) => {
	if (!name) return "NA";
	return name
		.split(" ")
		.map((word) => word.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
};

const compareValues = (a: string | number, b: string | number) => {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function ListView({
	activities,
	total,
	pageSize,
	currentPage,
	onPageChange,
	onPageSizeChange,
	onEdit,
	onStatusChange,
	onDelete,
}: ListViewProps) {
	const [sortKey, setSortKey] = React.useState<SortKey>("dueDate");
	const [sortDirection, setSortDirection] =
		React.useState<SortDirection>("asc");
	const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

	const sortedActivities = React.useMemo(() => {
		const sorted = [...activities].sort((a, b) => {
			let value = 0;
			switch (sortKey) {
				case "title":
					value = compareValues(a.title.toLowerCase(), b.title.toLowerCase());
					break;
				case "clientName":
					value = compareValues(
						a.clientName.toLowerCase(),
						b.clientName.toLowerCase(),
					);
					break;
				case "dueDate":
					value = compareValues(
						new Date(a.dueDate).getTime(),
						new Date(b.dueDate).getTime(),
					);
					break;
				case "status":
					value = compareValues(a.status, b.status);
					break;
				case "priority":
					value = compareValues(a.priority, b.priority);
					break;
				case "assignedToName":
					value = compareValues(
						(a.assignedToName ?? "").toLowerCase(),
						(b.assignedToName ?? "").toLowerCase(),
					);
					break;
			}

			return sortDirection === "asc" ? value : -value;
		});

		return sorted;
	}, [activities, sortDirection, sortKey]);

	React.useEffect(() => {
		setSelectedIds((previous) => {
			const next = new Set(previous);
			for (const id of previous) {
				if (!sortedActivities.find((activity) => activity.id === id)) {
					next.delete(id);
				}
			}
			return next;
		});
	}, [sortedActivities]);

	const handleSort = (key: SortKey) => {
		if (key === sortKey) {
			setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
			return;
		}

		setSortKey(key);
		setSortDirection("asc");
		onPageChange(1);
	};

	const renderSortIcon = (key: SortKey) => {
		if (key !== sortKey) {
			return (
				<ArrowDown
					className="ml-1 h-3.5 w-3.5 text-muted-foreground"
					aria-hidden
				/>
			);
		}

		return sortDirection === "asc" ? (
			<ArrowUp className="ml-1 h-3.5 w-3.5" aria-hidden />
		) : (
			<ArrowDown className="ml-1 h-3.5 w-3.5" aria-hidden />
		);
	};

	const totalItems = total ?? sortedActivities.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const currentPageIndex = currentPage - 1;
	const pageStart = currentPageIndex * pageSize;
	const pageEnd = pageStart + pageSize;
	const paginatedActivities = sortedActivities.slice(pageStart, pageEnd);

	React.useEffect(() => {
		onPageChange(1);
	}, [pageSize, sortKey, sortDirection, onPageChange]);

	React.useEffect(() => {
		if (currentPage > totalPages) {
			onPageChange(totalPages);
		}
	}, [currentPage, totalPages, onPageChange]);

	const isAllPageSelected =
		paginatedActivities.length > 0 &&
		paginatedActivities.every((activity) => selectedIds.has(activity.id));

	const handleToggleAll = (checked: boolean) => {
		setSelectedIds((previous) => {
			const next = new Set(previous);
			if (checked) {
				for (const activity of paginatedActivities) {
					next.add(activity.id);
				}
			} else {
				for (const activity of paginatedActivities) {
					next.delete(activity.id);
				}
			}
			return next;
		});
	};

	const handleToggleOne = (id: string, checked: boolean) => {
		setSelectedIds((previous) => {
			const next = new Set(previous);
			if (checked) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	};

	const selectedCount = selectedIds.size;
	const displayFrom = total === 0 ? 0 : pageStart + 1;
	const displayTo = Math.min(pageEnd, total);

	return (
		<div className="space-y-4">
			<div className="bg-background overflow-hidden rounded-xl border shadow-sm">
				<div className="flex items-center justify-between border-b px-4 py-3">
					<h3 className="text-base font-semibold tracking-tight">
						Activities List
					</h3>
					<span className="text-sm text-muted-foreground">
						{sortedActivities.length} activity
						{sortedActivities.length === 1 ? "" : "ies"}
					</span>
				</div>
				<div className="overflow-x-auto">
					<Table className="min-w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="w-12">
									<Checkbox
										aria-label="Select all activities on this page"
										checked={isAllPageSelected}
										onCheckedChange={(checked) =>
											handleToggleAll(Boolean(checked))
										}
									/>
								</TableHead>
								<TableHead>
									<button
										type="button"
										onClick={() => handleSort("title")}
										className="flex w-full items-center text-left font-semibold"
									>
										Activity
										{renderSortIcon("title")}
									</button>
								</TableHead>
								<TableHead>
									<button
										type="button"
										onClick={() => handleSort("clientName")}
										className="flex w-full items-center text-left font-semibold"
									>
										Client
										{renderSortIcon("clientName")}
									</button>
								</TableHead>
								<TableHead>
									<button
										type="button"
										onClick={() => handleSort("dueDate")}
										className="flex w-full items-center text-left font-semibold"
									>
										Due Date
										{renderSortIcon("dueDate")}
									</button>
								</TableHead>
								<TableHead>
									<button
										type="button"
										onClick={() => handleSort("status")}
										className="flex w-full items-center text-left font-semibold"
									>
										Status
										{renderSortIcon("status")}
									</button>
								</TableHead>
								<TableHead>
									<button
										type="button"
										onClick={() => handleSort("priority")}
										className="flex w-full items-center text-left font-semibold"
									>
										Priority
										{renderSortIcon("priority")}
									</button>
								</TableHead>
								<TableHead>
									<button
										type="button"
										onClick={() => handleSort("assignedToName")}
										className="flex w-full items-center text-left font-semibold"
									>
										Assigned To
										{renderSortIcon("assignedToName")}
									</button>
								</TableHead>
								<TableHead className="w-20 text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedActivities.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={8}
										className="h-32 text-center text-sm text-muted-foreground"
									>
										No activities match the selected filters.
									</TableCell>
								</TableRow>
							) : (
								paginatedActivities.map((activity) => {
									const dueDate = new Date(activity.dueDate);
									return (
										<TableRow key={activity.id} className="group">
											<TableCell className="align-top">
												<Checkbox
													aria-label={`Select ${activity.title}`}
													checked={selectedIds.has(activity.id)}
													onCheckedChange={(checked) =>
														handleToggleOne(activity.id, Boolean(checked))
													}
												/>
											</TableCell>
											<TableCell className="align-top">
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<Badge
															variant="outline"
															className="rounded-full px-2.5 py-0.5 text-[11px]"
														>
															{ACTIVITY_TYPE_LABEL[activity.type]}
														</Badge>
														<span className="font-medium">
															{activity.title}
														</span>
													</div>
													{activity.notes ? (
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<p className="line-clamp-1 text-xs text-muted-foreground">
																		“{activity.notes}”
																	</p>
																</TooltipTrigger>
																<TooltipContent className="max-w-xs text-xs">
																	{activity.notes}
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													) : null}
												</div>
											</TableCell>
											<TableCell className="text-sm">
												{activity.clientName}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2 text-sm">
													<CalendarClock
														className="h-4 w-4 text-muted-foreground"
														aria-hidden
													/>
													<div className="flex flex-col">
														<span>{format(dueDate, "MMM dd, yyyy")}</span>
														<span className="text-xs text-muted-foreground">
															{format(dueDate, "HH:mm")}
														</span>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													className={pillClassName(
														ACTIVITY_STATUS_STYLES[activity.status],
													)}
												>
													{ACTIVITY_STATUS_LABEL[activity.status]}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge
													className={pillClassName(
														ACTIVITY_PRIORITY_STYLES[activity.priority],
													)}
												>
													{ACTIVITY_PRIORITY_LABEL[activity.priority]}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Avatar className="h-8 w-8">
														<AvatarFallback>
															{getInitials(activity.assignedToName)}
														</AvatarFallback>
													</Avatar>
													<div className="flex flex-col">
														<span className="text-sm font-medium">
															{activity.assignedToName ?? "Unassigned"}
														</span>
														<span className="text-xs text-muted-foreground">
															{activity.assignedToEmail ?? "No email"}
														</span>
													</div>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
														>
															<MoreHorizontal className="h-4 w-4" aria-hidden />
															<span className="sr-only">Open actions</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem onClick={() => onEdit(activity)}>
															<PenSquare className="mr-2 h-4 w-4" aria-hidden />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															disabled={activity.status === "completed"}
															onClick={() =>
																onStatusChange(activity, "completed")
															}
														>
															Mark Complete
														</DropdownMenuItem>
														<DropdownMenuItem
															disabled={activity.status === "missed"}
															onClick={() => onStatusChange(activity, "missed")}
														>
															Mark Missed
														</DropdownMenuItem>
														{onDelete ? (
															<DropdownMenuItem
																className="text-destructive"
																onClick={() => onDelete(activity)}
															>
																Cancel Activity
															</DropdownMenuItem>
														) : null}
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</div>
			<div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-1 text-sm text-muted-foreground">
					<span>
						Showing {displayFrom}-{displayTo} of {total} activities
					</span>
					{selectedCount > 0 ? <span>{selectedCount} selected</span> : null}
				</div>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
					<div className="flex items-center gap-2 text-sm">
						<span>Rows per page</span>
						<Select
							value={String(pageSize)}
							onValueChange={(value) => {
								onPageSizeChange(Number(value));
								onPageChange(1);
							}}
						>
							<SelectTrigger className="h-8 w-20">
								<SelectValue aria-label={`Rows per page: ${pageSize}`} />
							</SelectTrigger>
							<SelectContent>
								{PAGE_SIZE_OPTIONS.map((option) => (
									<SelectItem key={option} value={String(option)}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							className="h-8"
							onClick={() => onPageChange(Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
						>
							<ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
							Prev
						</Button>
						<span className="text-sm text-muted-foreground">
							Page {currentPage} of {totalPages}
						</span>
						<Button
							variant="ghost"
							size="sm"
							className="h-8"
							onClick={() =>
								onPageChange(Math.min(totalPages, currentPage + 1))
							}
							disabled={currentPage === totalPages}
						>
							Next
							<ChevronRight className="ml-1 h-4 w-4" aria-hidden />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
