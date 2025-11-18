"use client";

import type {
	Activity,
	ActivityCreateInput,
	ActivityPriority,
	ActivityStatus,
	ActivityType,
} from "@crm/types";
import { endOfDay, format, startOfDay } from "date-fns";
import {
	CalendarDays,
	Filter,
	LayoutList,
	Plus,
	Table as TableIcon,
} from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { TableToolbar } from "@/components/table-toolbar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TablePageHeader } from "@/components/ui/page-header";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ActivityForm } from "./components/activity-form";
import { CalendarView } from "./components/calendar-view";
import { CompactView } from "./components/compact-view";
import { ListView } from "./components/list-view";
import {
	ACTIVITY_PRIORITY_LABEL,
	ACTIVITY_PRIORITY_OPTIONS,
	ACTIVITY_STATUS_LABEL,
	ACTIVITY_STATUS_OPTIONS,
	ACTIVITY_TYPE_LABEL,
	ACTIVITY_TYPE_OPTIONS,
} from "./constants";
import {
	createClientActivity,
	deleteClientActivity,
	updateClientActivity,
} from "./data";
import {
	type ActivityModalMode,
	type ActivityView,
	useActivitiesStore,
} from "./store";

type Option = {
	id: string;
	name: string;
	email?: string | null;
};

interface ClientActivitiesPageClientProps {
	initialActivities: Activity[];
	clients: Option[];
	assignees: Option[];
}

const ALL_FILTER_VALUE = "__all__";

const viewOptions: Array<{
	value: ActivityView;
	label: string;
	icon: React.ReactNode;
}> = [
	{
		value: "list",
		label: "List View",
		icon: <TableIcon className="h-4 w-4" aria-hidden="true" />,
	},
	{
		value: "calendar",
		label: "Calendar View",
		icon: <CalendarDays className="h-4 w-4" aria-hidden="true" />,
	},
	{
		value: "compact",
		label: "Compact View",
		icon: <LayoutList className="h-4 w-4" aria-hidden="true" />,
	},
];

const toIso = (date: Date | undefined | null) =>
	date ? date.toISOString() : undefined;

const normalizeRange = (
	range: DateRange | undefined,
): { from?: string; to?: string } => {
	if (!range) {
		return {};
	}

	return {
		from: toIso(range.from ? startOfDay(range.from) : undefined),
		to: toIso(range.to ? endOfDay(range.to) : undefined),
	};
};

export function ClientActivitiesPageClient({
	initialActivities,
	clients,
	assignees,
}: ClientActivitiesPageClientProps) {
	const { toast } = useToast();
	const [isPending, startTransition] = React.useTransition();
	const filterClientId = React.useId();
	const filterAssignedToId = React.useId();
	const filterStatusId = React.useId();
	const filterPriorityId = React.useId();
	const filterTypeId = React.useId();

	const runTransition = <T,>(task: () => Promise<T>): Promise<T> => {
		return new Promise<T>((resolve, reject) => {
			startTransition(() => {
				task().then(resolve).catch(reject);
			});
		});
	};
	const [isFilterSheetOpen, setFilterSheetOpen] = React.useState(false);

	const activities = useActivitiesStore((state) => state.activities);
	const setActivities = useActivitiesStore((state) => state.setActivities);
	const addActivity = useActivitiesStore((state) => state.addActivity);
	const updateActivity = useActivitiesStore((state) => state.updateActivity);
	const removeActivity = useActivitiesStore((state) => state.removeActivity);
	const view = useActivitiesStore((state) => state.view);
	const setView = useActivitiesStore((state) => state.setView);
	const filters = useActivitiesStore((state) => state.filters);
	const setFilters = useActivitiesStore((state) => state.setFilters);
	const resetFilters = useActivitiesStore((state) => state.resetFilters);
	const isModalOpen = useActivitiesStore((state) => state.isModalOpen);
	const modalMode = useActivitiesStore((state) => state.modalMode);
	const activeActivityId = useActivitiesStore(
		(state) => state.activeActivityId,
	);
	const setModal = useActivitiesStore((state) => state.setModal);
	const selectedDateIso = useActivitiesStore((state) => state.selectedDate);
	const setSelectedDate = useActivitiesStore((state) => state.setSelectedDate);
	const isSubmitting = useActivitiesStore((state) => state.isSubmitting);
	const setSubmitting = useActivitiesStore((state) => state.setSubmitting);

	const [clientOptions, setClientOptions] = React.useState<Option[]>(clients);
	const [assigneeOptions, setAssigneeOptions] =
		React.useState<Option[]>(assignees);

	const [dateRangeDraft, setDateRangeDraft] = React.useState<
		DateRange | undefined
	>(() => {
		if (!filters.dateFrom && !filters.dateTo) return undefined;
		return {
			from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
			to: filters.dateTo ? new Date(filters.dateTo) : undefined,
		};
	});

	React.useEffect(() => {
		setActivities(initialActivities);
	}, [initialActivities, setActivities]);

	React.useEffect(() => {
		setClientOptions(clients);
	}, [clients]);

	React.useEffect(() => {
		setAssigneeOptions(assignees);
	}, [assignees]);

	const activeActivity = React.useMemo(
		() => activities.find((activity) => activity.id === activeActivityId),
		[activities, activeActivityId],
	);

	const filteredActivities = React.useMemo(() => {
		return activities.filter((activity) => {
			if (filters.clientId && activity.clientId !== filters.clientId) {
				return false;
			}

			if (filters.assignedTo && activity.assignedTo !== filters.assignedTo) {
				return false;
			}

			if (filters.status && activity.status !== filters.status) {
				return false;
			}

			if (filters.priority && activity.priority !== filters.priority) {
				return false;
			}

			if (filters.type && activity.type !== filters.type) {
				return false;
			}

			if (
				filters.dateFrom &&
				new Date(activity.dueDate) < new Date(filters.dateFrom)
			) {
				return false;
			}

			if (
				filters.dateTo &&
				new Date(activity.dueDate) > new Date(filters.dateTo)
			) {
				return false;
			}

			if (filters.search) {
				const search = filters.search.toLowerCase();
				const matcher =
					activity.title.toLowerCase().includes(search) ||
					activity.clientName.toLowerCase().includes(search) ||
					activity.assignedToName?.toLowerCase().includes(search) ||
					activity.notes?.toLowerCase().includes(search);

				if (!matcher) {
					return false;
				}
			}

			return true;
		});
	}, [activities, filters]);

	const selectedDate = React.useMemo(() => {
		if (!selectedDateIso) {
			return startOfDay(new Date());
		}
		return new Date(selectedDateIso);
	}, [selectedDateIso]);

	const [listPageSize, setListPageSize] = React.useState(20);
	const [listPage, setListPage] = React.useState(1);
	const [compactPageSize, setCompactPageSize] = React.useState(12);
	const [compactPage, setCompactPage] = React.useState(1);

	React.useEffect(() => {
		setListPage(1);
		setCompactPage(1);
	}, [filteredActivities.length]);

	const paginatedCompactActivities = React.useMemo(() => {
		const startIndex = (compactPage - 1) * compactPageSize;
		const endIndex = startIndex + compactPageSize;
		return filteredActivities.slice(startIndex, endIndex);
	}, [filteredActivities, compactPage, compactPageSize]);

	const handleOpenCreateModal = (
		mode: ActivityModalMode,
		dueDate?: Date | null,
		activityId?: string | null,
	) => {
		if (dueDate) {
			setSelectedDate(startOfDay(dueDate).toISOString());
		}
		setModal(true, mode, activityId ?? null);
	};

	const handleCreateClick = () => {
		handleOpenCreateModal("create", selectedDate);
	};

	const handleCreateFromCalendar = (date: Date) => {
		handleOpenCreateModal("create", date);
	};

	const handleEdit = (activity: Activity) => {
		handleOpenCreateModal("edit", new Date(activity.dueDate), activity.id);
	};

	const handleStatusChange = (activity: Activity, status: ActivityStatus) => {
		startTransition(async () => {
			try {
				setSubmitting(true);
				const updated = await updateClientActivity(activity.id, { status });

				if (updated) {
					updateActivity(updated);
					toast({
						title: "Activity updated",
						description: `${activity.title} marked as ${ACTIVITY_STATUS_LABEL[status]}.`,
					});
				}
			} catch (error) {
				console.error(error);
				toast({
					title: "Unable to update activity",
					description: "Please try again.",
					variant: "destructive",
				});
			} finally {
				setSubmitting(false);
			}
		});
	};

	const handleReschedule = (activity: Activity, start: Date) => {
		startTransition(async () => {
			try {
				setSubmitting(true);
				const updated = await updateClientActivity(activity.id, {
					dueDate: start.toISOString(),
				});

				if (updated) {
					updateActivity(updated);
					setSelectedDate(startOfDay(new Date(updated.dueDate)).toISOString());
					toast({
						title: "Activity rescheduled",
						description: `${activity.title} moved to ${format(new Date(updated.dueDate), "MMM dd, yyyy 'at' HH:mm")}.`,
					});
				}
			} catch (error) {
				console.error(error);
				toast({
					title: "Unable to reschedule activity",
					description: "Please try again.",
					variant: "destructive",
				});
			} finally {
				setSubmitting(false);
			}
		});
	};

	const handleDelete = (activity: Activity) => {
		startTransition(async () => {
			try {
				setSubmitting(true);
				await deleteClientActivity(activity.id);
				removeActivity(activity.id);
				toast({
					title: "Activity cancelled",
					description: `${activity.title} was removed from the schedule.`,
				});
			} catch (error) {
				console.error(error);
				toast({
					title: "Unable to cancel activity",
					description: "Please try again.",
					variant: "destructive",
				});
			} finally {
				setSubmitting(false);
			}
		});
	};

	const handleModalClose = () => {
		setModal(false);
	};

	const handleFormSubmit = (values: ActivityCreateInput) => {
		return runTransition(async () => {
			try {
				setSubmitting(true);
				if (modalMode === "edit" && activeActivity) {
					const updated = await updateClientActivity(activeActivity.id, values);
					if (updated) {
						updateActivity(updated);
						toast({
							title: "Activity updated",
							description: `${updated.title} was updated successfully.`,
						});
					}
				} else {
					const created = await createClientActivity(values);
					addActivity(created);
					toast({
						title: "Activity created",
						description: `${created.title} scheduled for ${format(
							new Date(created.dueDate),
							"MMM dd, yyyy HH:mm",
						)}.`,
					});
				}
				setModal(false);
			} catch (error) {
				console.error(error);
				toast({
					title: "Action failed",
					description: "We couldn't save the activity. Please try again.",
					variant: "destructive",
				});
			} finally {
				setSubmitting(false);
			}
		});
	};

	const applyDateRangeFilter = (range: DateRange | undefined) => {
		setDateRangeDraft(range);
		const normalized = normalizeRange(range);
		setFilters({
			dateFrom: normalized.from,
			dateTo: normalized.to,
		});
	};

	const hasToolbarFilters =
		(filters.search?.trim().length ?? 0) > 0 ||
		Boolean(filters.clientId) ||
		Boolean(filters.assignedTo) ||
		Boolean(filters.status) ||
		Boolean(filters.priority) ||
		Boolean(filters.type) ||
		Boolean(filters.dateFrom) ||
		Boolean(filters.dateTo);

	const handleResetToolbar = () => {
		resetFilters();
		setDateRangeDraft(undefined);
	};

	const statusFilterValue = filters.status ?? ALL_FILTER_VALUE;
	const priorityFilterValue = filters.priority ?? ALL_FILTER_VALUE;
	const typeFilterValue = filters.type ?? ALL_FILTER_VALUE;

	const currentViewOption =
		viewOptions.find((option) => option.value === view) ?? viewOptions[0];

	return (
		<div className="space-y-8">
			<TablePageHeader
				title="Client Activities"
				description="Track scheduled tasks, meetings, and follow-ups across every client."
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							onClick={() => setFilterSheetOpen(true)}
							className="gap-2"
						>
							<Filter className="h-4 w-4" aria-hidden="true" />
							Filters
						</Button>
						<Button onClick={handleCreateClick} className="gap-2">
							<Plus className="h-4 w-4" aria-hidden="true" />
							Add Activity
						</Button>
					</div>
				}
			/>

			<TableToolbar
				search={{
					value: filters.search,
					onChange: (value) => setFilters({ search: value }),
					placeholder: "Search activities...",
					ariaLabel: "Search activities",
					inputProps: {
						className: "min-w-[200px]",
					},
				}}
				filters={
					<div className="flex flex-wrap items-center gap-3">
						<Select
							value={statusFilterValue}
							onValueChange={(value) =>
								setFilters({
									status:
										value === ALL_FILTER_VALUE
											? undefined
											: (value as ActivityStatus),
								})
							}
						>
							<SelectTrigger
								className="h-9 w-[160px]"
								aria-label="Filter by status"
							>
								<SelectValue placeholder="All statuses" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_FILTER_VALUE}>All statuses</SelectItem>
								{ACTIVITY_STATUS_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{ACTIVITY_STATUS_LABEL[option.value]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={priorityFilterValue}
							onValueChange={(value) =>
								setFilters({
									priority:
										value === ALL_FILTER_VALUE
											? undefined
											: (value as ActivityPriority),
								})
							}
						>
							<SelectTrigger
								className="h-9 w-[160px]"
								aria-label="Filter by priority"
							>
								<SelectValue placeholder="All priorities" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_FILTER_VALUE}>All priorities</SelectItem>
								{ACTIVITY_PRIORITY_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{ACTIVITY_PRIORITY_LABEL[option.value]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={typeFilterValue}
							onValueChange={(value) =>
								setFilters({
									type:
										value === ALL_FILTER_VALUE
											? undefined
											: (value as ActivityType),
								})
							}
						>
							<SelectTrigger
								className="h-9 w-[180px]"
								aria-label="Filter by type"
							>
								<SelectValue placeholder="All activity types" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_FILTER_VALUE}>All types</SelectItem>
								{ACTIVITY_TYPE_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{ACTIVITY_TYPE_LABEL[option.value]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				}
				reset={{
					onReset: handleResetToolbar,
					disabled: !hasToolbarFilters,
					hideUntilActive: true,
				}}
				actions={
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button type="button" variant="outline" className="gap-2">
								{currentViewOption.icon}
								{currentViewOption.label}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							{viewOptions.map((option) => (
								<DropdownMenuItem
									key={option.value}
									onSelect={() => setView(option.value)}
									className={cn(
										option.value === view ? "text-primary font-semibold" : "",
									)}
								>
									<div className="flex items-center gap-2">
										{option.icon}
										<span>{option.label}</span>
									</div>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				}
			/>

			{view === "calendar" ? (
				<div className="mt-4">
					<CalendarView
						onCreate={handleCreateFromCalendar}
						onEdit={handleEdit}
						onStatusChange={handleStatusChange}
						onReschedule={(activity, start) =>
							handleReschedule(activity, start)
						}
						onDelete={handleDelete}
					/>
				</div>
			) : null}

			{view === "list" ? (
				<div className="mt-4">
					<ListView
						activities={filteredActivities}
						total={filteredActivities.length}
						pageSize={listPageSize}
						currentPage={listPage}
						onPageChange={setListPage}
						onPageSizeChange={setListPageSize}
						onEdit={handleEdit}
						onStatusChange={handleStatusChange}
						onDelete={handleDelete}
					/>
				</div>
			) : null}

			{view === "compact" ? (
				<div className="mt-4">
					<CompactView
						activities={paginatedCompactActivities}
						total={filteredActivities.length}
						pageSize={compactPageSize}
						currentPage={compactPage}
						onPageChange={setCompactPage}
						onPageSizeChange={setCompactPageSize}
						onEdit={handleEdit}
						onStatusChange={handleStatusChange}
					/>
				</div>
			) : null}

			<Sheet open={isFilterSheetOpen} onOpenChange={setFilterSheetOpen}>
				<SheetContent className="w-full sm:max-w-xl">
					<SheetHeader>
						<SheetTitle>Filter activities</SheetTitle>
						<SheetDescription>
							Refine the list by client, owner, status, or date range.
						</SheetDescription>
					</SheetHeader>
					<div className="mt-6 space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-1.5">
								<label htmlFor={filterClientId} className="text-sm font-medium">
									Client
								</label>
								<Select
									value={filters.clientId ?? ALL_FILTER_VALUE}
									onValueChange={(value) =>
										setFilters({
											clientId: value === ALL_FILTER_VALUE ? undefined : value,
										})
									}
								>
									<SelectTrigger id={filterClientId}>
										<SelectValue placeholder="All clients" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ALL_FILTER_VALUE}>
											All clients
										</SelectItem>
										{clientOptions.map((client) => (
											<SelectItem key={client.id} value={client.id}>
												{client.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<label
									htmlFor={filterAssignedToId}
									className="text-sm font-medium"
								>
									Assigned To
								</label>
								<Select
									value={filters.assignedTo ?? ALL_FILTER_VALUE}
									onValueChange={(value) =>
										setFilters({
											assignedTo:
												value === ALL_FILTER_VALUE ? undefined : value,
										})
									}
								>
									<SelectTrigger id={filterAssignedToId}>
										<SelectValue placeholder="All team members" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ALL_FILTER_VALUE}>
											All team members
										</SelectItem>
										{assigneeOptions.map((user) => (
											<SelectItem key={user.id} value={user.id}>
												{user.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<label htmlFor={filterStatusId} className="text-sm font-medium">
									Status
								</label>
								<Select
									value={filters.status ?? ALL_FILTER_VALUE}
									onValueChange={(value) =>
										setFilters({
											status:
												value === ALL_FILTER_VALUE
													? undefined
													: (value as ActivityStatus),
										})
									}
								>
									<SelectTrigger id={filterStatusId}>
										<SelectValue placeholder="All statuses" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ALL_FILTER_VALUE}>
											All statuses
										</SelectItem>
										{ACTIVITY_STATUS_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{ACTIVITY_STATUS_LABEL[option.value]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<label
									htmlFor={filterPriorityId}
									className="text-sm font-medium"
								>
									Priority
								</label>
								<Select
									value={filters.priority ?? ALL_FILTER_VALUE}
									onValueChange={(value) =>
										setFilters({
											priority:
												value === ALL_FILTER_VALUE
													? undefined
													: (value as ActivityPriority),
										})
									}
								>
									<SelectTrigger id={filterPriorityId}>
										<SelectValue placeholder="All priorities" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ALL_FILTER_VALUE}>
											All priorities
										</SelectItem>
										{ACTIVITY_PRIORITY_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{ACTIVITY_PRIORITY_LABEL[option.value]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5 md:col-span-2">
								<label htmlFor={filterTypeId} className="text-sm font-medium">
									Activity Type
								</label>
								<Select
									value={filters.type ?? ALL_FILTER_VALUE}
									onValueChange={(value) =>
										setFilters({
											type:
												value === ALL_FILTER_VALUE
													? undefined
													: (value as ActivityType),
										})
									}
								>
									<SelectTrigger id={filterTypeId}>
										<SelectValue placeholder="All activity types" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ALL_FILTER_VALUE}>All types</SelectItem>
										{ACTIVITY_TYPE_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{ACTIVITY_TYPE_LABEL[option.value]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Date Range</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setDateRangeDraft(undefined);
										setFilters({ dateFrom: undefined, dateTo: undefined });
									}}
								>
									Clear
								</Button>
							</div>
							<Calendar
								mode="range"
								selected={dateRangeDraft}
								numberOfMonths={2}
								defaultMonth={dateRangeDraft?.from ?? new Date()}
								onSelect={(range) => applyDateRangeFilter(range ?? undefined)}
								initialFocus
							/>
						</div>
					</div>
					<SheetFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								resetFilters();
								setDateRangeDraft(undefined);
							}}
						>
							Reset filters
						</Button>
						<Button type="button" onClick={() => setFilterSheetOpen(false)}>
							Apply filters
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<Dialog
				open={isModalOpen}
				onOpenChange={(open) => (!open ? setModal(false) : null)}
			>
				<DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>
							{modalMode === "edit" ? "Edit Meeting" : "Create Meeting"}
						</DialogTitle>
						<DialogDescription>
							{modalMode === "edit"
								? "Update the details of this meeting."
								: "Member invited will receive message through email."}
						</DialogDescription>
					</DialogHeader>
					<ActivityForm
						initialActivity={activeActivity}
						clients={clientOptions}
						assignees={assigneeOptions}
						defaultDueDate={selectedDate.toISOString()}
						isSubmitting={isSubmitting || isPending}
						onSubmit={handleFormSubmit}
						onCancel={handleModalClose}
					/>
				</DialogContent>
			</Dialog>

			<div className="text-muted-foreground text-xs">
				Showing <strong>{filteredActivities.length}</strong> of{" "}
				<strong>{activities.length}</strong> activities
			</div>
		</div>
	);
}
