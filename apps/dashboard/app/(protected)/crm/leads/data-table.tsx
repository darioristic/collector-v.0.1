"use client";

import { LEAD_STATUSES, type Lead, type LeadStatus } from "@crm/types";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
} from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	BadgePercent,
	CalendarClock,
	Columns as ColumnsIcon,
	Download,
	Loader2,
	Mail,
	NotebookPen,
	PhoneCall,
	Sparkles,
	Tag,
	Trash2,
	UserRound,
} from "lucide-react";
import * as React from "react";
import { TableToolbar } from "@/components/table-toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn, generateAvatarFallback } from "@/lib/utils";

const formatLeadDate = (value: string | null | undefined) => {
	if (!value) {
		return "Unknown";
	}

	const iso = value.slice(0, 10);
	const [year, month, day] = iso.split("-");

	if (!year || !month || !day) {
		return "Unknown";
	}

	const normalize = (segment: string) => segment.padStart(2, "0");

	return `${normalize(day)}.${normalize(month)}.${year}.`;
};

const statusLabels: Record<LeadStatus, string> = {
	new: "New",
	contacted: "Contacted",
	qualified: "Qualified",
	won: "Won",
	lost: "Lost",
};

const statusClasses: Record<LeadStatus, string> = {
	new: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
	contacted: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
	qualified:
		"bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
	won: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
	lost: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const statusFilters = [
	{ id: "all" as const, label: "All statuses" },
	...LEAD_STATUSES.map((status) => ({
		id: status,
		label: statusLabels[status],
	})),
] as const;

const leadSearch = (lead: Lead) =>
	[lead.name, lead.email, lead.source, lead.status]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

type LeadsDataTableProps = {
	data: Lead[];
	showAddActionInToolbar?: boolean;
};

type StatusFilterValue = (typeof statusFilters)[number]["id"];

export type LeadsDataTableHandle = {
	openAddDialog: () => void;
};

export const LeadsDataTable = React.forwardRef<
	LeadsDataTableHandle,
	LeadsDataTableProps
>(({ data, showAddActionInToolbar = true }, ref) => {
	const { toast } = useToast();

	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});
	const [globalFilter, setGlobalFilter] = React.useState("");
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [activeStatusFilter, setActiveStatusFilter] =
		React.useState<StatusFilterValue>("all");
	const [selectedSource, setSelectedSource] = React.useState<string>("all");
	const [activeLead, setActiveLead] = React.useState<Lead | null>(null);
	const [editTarget, setEditTarget] = React.useState<Lead | null>(null);
	const [deleteTargets, setDeleteTargets] = React.useState<Lead[]>([]);
	const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
	const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
	const [isProcessingEdit, setIsProcessingEdit] = React.useState(false);
	const [isProcessingAdd, setIsProcessingAdd] = React.useState(false);
	const [isProcessingDelete, setIsProcessingDelete] = React.useState(false);
	const [editFormState, setEditFormState] = React.useState({
		name: "",
		email: "",
		status: "new" as LeadStatus,
		source: "",
		notes: "",
	});
	const [addFormState, setAddFormState] = React.useState({
		name: "",
		email: "",
		status: "new" as LeadStatus,
		source: "",
		notes: "",
	});

	const editFormId = React.useId();
	const addFormId = React.useId();
	const editDialogId = React.useId();
	const addDialogId = React.useId();
	const deleteDialogId = React.useId();

	const uniqueSources = React.useMemo(() => {
		const values = new Set<string>();
		data.forEach((lead) => {
			if (lead.source) {
				values.add(lead.source);
			}
		});
		return Array.from(values).sort((a, b) => a.localeCompare(b, "en-US"));
	}, [data]);

	const columns = React.useMemo<ColumnDef<Lead>[]>(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() && "indeterminate")
						}
						onCheckedChange={(value) =>
							table.toggleAllPageRowsSelected(Boolean(value))
						}
						aria-label="Select all leads on the page"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
						aria-label={`Select lead ${row.original.name}`}
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: "name",
				header: ({ column }) => (
					<Button
						variant="ghost"
						className="-ml-2 h-8 px-2 text-left"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Lead
						<SortIcon direction={column.getIsSorted()} />
					</Button>
				),
				cell: ({ row }) => {
					const lead = row.original;
					return (
						<button
							type="button"
							onClick={() => setActiveLead(lead)}
							className="hover:bg-muted/60 focus-visible:ring-ring focus-visible:ring-offset-background group flex w-full items-center gap-3 rounded-md px-1.5 py-1.5 text-left transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
						>
							<Avatar className="size-9 shrink-0">
								<AvatarFallback>
									{generateAvatarFallback(lead.name)}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col">
								<span className="font-medium group-hover:underline">
									{lead.name}
								</span>
								<span className="text-muted-foreground text-xs">
									{lead.email}
								</span>
							</div>
						</button>
					);
				},
			},
			{
				accessorKey: "status",
				header: ({ column }) => (
					<Button
						variant="ghost"
						className="-ml-2 h-8 px-2 text-left"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Status
						<SortIcon direction={column.getIsSorted()} />
					</Button>
				),
				cell: ({ row }) => {
					const status = row.original.status;
					return (
						<Badge
							className={cn(
								"flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs",
								statusClasses[status],
							)}
						>
							<Sparkles className="h-3.5 w-3.5" />
							{statusLabels[status]}
						</Badge>
					);
				},
				filterFn: (row, columnId, filterValue) => {
					if (!filterValue || filterValue === "all") {
						return true;
					}
					return row.getValue<LeadStatus>(columnId) === filterValue;
				},
			},
			{
				accessorKey: "source",
				header: ({ column }) => (
					<Button
						variant="ghost"
						className="-ml-2 h-8 px-2 text-left"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Source
						<SortIcon direction={column.getIsSorted()} />
					</Button>
				),
				cell: ({ row }) => (
					<Badge
						variant="outline"
						className="border-dashed text-xs font-medium"
					>
						{row.original.source || "Unknown"}
					</Badge>
				),
				filterFn: (row, columnId, filterValue) => {
					if (!filterValue || filterValue === "all") {
						return true;
					}
					return row.getValue<string>(columnId) === filterValue;
				},
			},
			{
				accessorKey: "createdAt",
				header: ({ column }) => (
					<Button
						variant="ghost"
						className="-ml-2 h-8 px-2 text-left"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Created
						<SortIcon direction={column.getIsSorted()} />
					</Button>
				),
				cell: ({ row }) => formatLeadDate(row.original.createdAt),
				sortingFn: "datetime",
			},
			{
				accessorKey: "updatedAt",
				header: ({ column }) => (
					<Button
						variant="ghost"
						className="-ml-2 h-8 px-2 text-left"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Updated
						<SortIcon direction={column.getIsSorted()} />
					</Button>
				),
				cell: ({ row }) =>
					formatLeadDate(row.original.updatedAt ?? row.original.createdAt),
				sortingFn: "datetime",
			},
			{
				id: "actions",
				enableHiding: false,
				cell: ({ row }) => {
					const lead = row.original;
					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="size-8">
									<span className="sr-only">Open menu</span>
									<BadgePercent className="h-4 w-4" aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem
									onClick={() => {
										setActiveLead(lead);
									}}
								>
									View details
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										setEditTarget(lead);
										setEditFormState({
											name: lead.name,
											email: lead.email,
											status: lead.status,
											source: lead.source ?? "",
											notes: "",
										});
										setIsEditDialogOpen(true);
									}}
								>
									Edit lead
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										toast({
											title: "Lead marked as won",
											description: `${lead.name} has been marked as successfully converted.`,
										});
									}}
								>
									Mark as won
								</DropdownMenuItem>
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									onClick={() => {
										setDeleteTargets([lead]);
										setIsDeleteDialogOpen(true);
									}}
								>
									Delete lead
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					);
				},
			},
		],
		[toast],
	);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			globalFilter,
			columnFilters,
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onGlobalFilterChange: setGlobalFilter,
		onColumnFiltersChange: setColumnFilters,
		globalFilterFn: (row, _columnId, filterValue) => {
			if (!filterValue) {
				return true;
			}
			return leadSearch(row.original).includes(
				String(filterValue).toLowerCase(),
			);
		},
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	});

	const handleStatusFilter = React.useCallback(
		(value: StatusFilterValue) => {
			setActiveStatusFilter(value);
			const column = table.getColumn("status");
			if (!column) {
				return;
			}
			column.setFilterValue(value === "all" ? undefined : value);
		},
		[table],
	);

	const handleSourceFilter = React.useCallback(
		(value: string) => {
			setSelectedSource(value);
			const column = table.getColumn("source");
			if (!column) {
				return;
			}
			column.setFilterValue(value === "all" ? undefined : value);
		},
		[table],
	);

	const selectionCount = table.getSelectedRowModel().rows.length;
	const filteredRowCount = table.getFilteredRowModel().rows.length;
	const pagination = table.getState().pagination;
	const pageCount = table.getPageCount();
	const pageStart =
		filteredRowCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
	const pageEnd =
		filteredRowCount === 0
			? 0
			: Math.min(
					filteredRowCount,
					pagination.pageSize * (pagination.pageIndex + 1),
				);
	const visibleColumnCount = table.getVisibleLeafColumns().length;

	const numberFormatter = React.useMemo(
		() => new Intl.NumberFormat("en-US"),
		[],
	);

	const handleBulkDelete = React.useCallback(() => {
		const selected = table
			.getSelectedRowModel()
			.rows.map((row) => row.original);
		if (selected.length === 0) {
			toast({
				title: "No leads selected",
				description: "Select at least one lead you want to delete.",
			});
			return;
		}
		setDeleteTargets(selected);
		setIsDeleteDialogOpen(true);
	}, [table, toast]);

	const exportLeads = React.useCallback(() => {
		if (data.length === 0) {
			toast({
				title: "No data to export",
				description:
					"Once leads are available you will be able to download a CSV file.",
			});
			return;
		}

		const headers = ["Name", "Email", "Status", "Source", "Created", "Updated"];

		const escapeCsv = (value: string | null | undefined) =>
			`"${String(value ?? "").replace(/"/g, '""')}"`;

		const rows = data.map((lead) => [
			escapeCsv(lead.name),
			escapeCsv(lead.email),
			escapeCsv(statusLabels[lead.status]),
			escapeCsv(lead.source),
			escapeCsv(lead.createdAt),
			escapeCsv(lead.updatedAt ?? ""),
		]);

		const csvContent = [
			headers.join(","),
			...rows.map((row) => row.join(",")),
		].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.setAttribute("download", "crm-leads.csv");
		link.click();
		URL.revokeObjectURL(url);

		toast({
			title: "Export started",
			description: "CSV download should start shortly.",
		});
	}, [data, toast]);

	const openAddDialog = React.useCallback(() => {
		setAddFormState({
			name: "",
			email: "",
			status: "new",
			source: "",
			notes: "",
		});
		setIsAddDialogOpen(true);
	}, []);

	React.useImperativeHandle(
		ref,
		() => ({
			openAddDialog,
		}),
		[openAddDialog],
	);

	const handleEditSubmit = React.useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (!editTarget) {
				return;
			}

			setIsProcessingEdit(true);
			try {
				await new Promise((resolve) => setTimeout(resolve, 800));
				toast({
					title: "Lead updated",
					description: `${editFormState.name || editTarget.name} has been updated successfully.`,
				});
				setIsEditDialogOpen(false);
				setEditTarget(null);
			} finally {
				setIsProcessingEdit(false);
			}
		},
		[editFormState.name, editTarget, toast],
	);

	const handleAddSubmit = React.useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			setIsProcessingAdd(true);
			try {
				await new Promise((resolve) => setTimeout(resolve, 800));
				toast({
					title: "Lead added",
					description: `${addFormState.name || "New lead"} has been added to the CRM.`,
				});
				setIsAddDialogOpen(false);
				setAddFormState({
					name: "",
					email: "",
					status: "new",
					source: "",
					notes: "",
				});
			} finally {
				setIsProcessingAdd(false);
			}
		},
		[addFormState.name, toast],
	);

	const handleDeleteConfirm = React.useCallback(async () => {
		if (deleteTargets.length === 0) {
			return;
		}

		setIsProcessingDelete(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 800));
			toast({
				title: "Leads removed",
				description:
					deleteTargets.length === 1
						? `${deleteTargets[0].name} has been deleted (simulation).`
						: `${numberFormatter.format(deleteTargets.length)} leads have been deleted (simulation).`,
			});
			setIsDeleteDialogOpen(false);
			setDeleteTargets([]);
			if (selectionCount > 0) {
				table.resetRowSelection();
			}
		} finally {
			setIsProcessingDelete(false);
		}
	}, [deleteTargets, numberFormatter, selectionCount, table, toast]);

	const deleteTargetNames = React.useMemo(
		() => deleteTargets.map((lead) => lead.name),
		[deleteTargets],
	);

	const paginationItems = React.useMemo(() => {
		if (pageCount <= 0) {
			return [] as Array<number | "ellipsis">;
		}
		if (pageCount <= 7) {
			return Array.from(
				{ length: pageCount },
				(_value, index) => index,
			) as Array<number | "ellipsis">;
		}

		const items: Array<number | "ellipsis"> = [];
		const firstPage = 0;
		const lastPage = pageCount - 1;
		const siblingCount = 1;
		const current = pagination.pageIndex;
		const start = Math.max(firstPage + 1, current - siblingCount);
		const end = Math.min(lastPage - 1, current + siblingCount);

		items.push(firstPage);

		if (start > firstPage + 1) {
			items.push("ellipsis");
		}

		for (let index = start; index <= end; index += 1) {
			if (index > firstPage && index < lastPage) {
				items.push(index);
			}
		}

		if (end < lastPage - 1) {
			items.push("ellipsis");
		}

		if (lastPage !== firstPage) {
			items.push(lastPage);
		}

		return items;
	}, [pageCount, pagination.pageIndex]);

	const rangeLabel =
		selectionCount > 0
			? selectionCount === 1
				? "1 lead selected"
				: `${numberFormatter.format(selectionCount)} leads selected`
			: filteredRowCount === 0
				? "Showing 0-0 of 0 leads"
				: `Showing ${numberFormatter.format(pageStart)}-${numberFormatter.format(pageEnd)} of ${numberFormatter.format(filteredRowCount)} leads`;

	const hasToolbarFilters =
		globalFilter.trim().length > 0 ||
		activeStatusFilter !== "all" ||
		selectedSource !== "all" ||
		columnFilters.length > 0;

	const handleResetToolbar = () => {
		setGlobalFilter("");
		handleStatusFilter("all");
		handleSourceFilter("all");
	};

	let ellipsisCounter = 0;

	return (
		<>
			<div className="space-y-6">
				<TableToolbar
					search={{
						value: globalFilter,
						onChange: (value) => setGlobalFilter(value),
						placeholder: "Search leads by name, email, or source",
						ariaLabel: "Search leads",
					}}
					filters={
						<div className="flex flex-wrap items-center gap-3">
							<Select
								value={activeStatusFilter}
								onValueChange={(value: StatusFilterValue) =>
									handleStatusFilter(value)
								}
							>
								<SelectTrigger
									className="h-9 w-[180px]"
									aria-label="Filter by status"
								>
									<SelectValue placeholder="All statuses" />
								</SelectTrigger>
								<SelectContent>
									{statusFilters.map((filter) => (
										<SelectItem key={filter.id} value={filter.id}>
											{filter.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select value={selectedSource} onValueChange={handleSourceFilter}>
								<SelectTrigger
									className="h-9 w-[180px]"
									aria-label="Filter by source"
								>
									<SelectValue placeholder="All sources" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All sources</SelectItem>
									{uniqueSources.map((source) => (
										<SelectItem key={source} value={source}>
											{source}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					}
					reset={{
						onReset: handleResetToolbar,
						disabled: !hasToolbarFilters,
					}}
					actions={
						<div className="flex flex-wrap items-center gap-2 md:order-2 md:justify-end">
							{selectionCount > 0 ? (
								<Button
									type="button"
									variant="destructive"
									size="sm"
									className="min-w-[150px]"
									onClick={handleBulkDelete}
									disabled={isProcessingDelete}
								>
									<Trash2 className="h-4 w-4" aria-hidden="true" />
									Delete selected
								</Button>
							) : null}
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="min-w-[140px]"
								onClick={exportLeads}
							>
								<Download className="h-4 w-4" aria-hidden="true" />
								Export CSV
							</Button>
							{showAddActionInToolbar ? (
								<Button
									type="button"
									size="sm"
									className="min-w-[140px]"
									onClick={openAddDialog}
								>
									<Sparkles className="h-4 w-4" aria-hidden="true" />
									New lead
								</Button>
							) : null}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" className="flex items-center gap-2">
										<ColumnsIcon className="h-4 w-4" />
										Columns
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-48">
									{table
										.getAllLeafColumns()
										.filter((column) => column.getCanHide())
										.map((column) => (
											<DropdownMenuCheckboxItem
												key={column.id}
												className="capitalize"
												checked={column.getIsVisible()}
												onCheckedChange={(value) =>
													column.toggleVisibility(Boolean(value))
												}
											>
												{column.id}
											</DropdownMenuCheckboxItem>
										))}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					}
				/>

				<div className="bg-background overflow-hidden rounded-xl border shadow-sm">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id} className="align-middle">
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={visibleColumnCount}
										className="p-6 text-center"
									>
										No leads currently match the filters.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				<div className="flex flex-col gap-3 border-t pt-4 text-sm md:flex-row md:items-center md:justify-between">
					<div className="text-muted-foreground">{rangeLabel}</div>
					<div className="text-muted-foreground flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
						<div className="flex items-center gap-2">
							<span className="text-foreground text-sm font-medium">
								Rows per page
							</span>
							<Select
								value={String(pagination.pageSize)}
								onValueChange={(value) => table.setPageSize(Number(value))}
							>
								<SelectTrigger className="h-8 w-[90px]">
									<SelectValue placeholder={pagination.pageSize} />
								</SelectTrigger>
								<SelectContent>
									{[10, 25, 50].map((pageSizeOption) => (
										<SelectItem
											key={pageSizeOption}
											value={String(pageSizeOption)}
										>
											{pageSizeOption}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="text-muted-foreground flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								Previous
							</Button>
							{paginationItems.map((item) => {
								if (item === "ellipsis") {
									const key = `ellipsis-${ellipsisCounter}`;
									ellipsisCounter += 1;
									return (
										<span key={key} className="px-2">
											...
										</span>
									);
								}

								return (
									<Button
										key={`page-${item}`}
										variant={
											pagination.pageIndex === item ? "default" : "outline"
										}
										size="sm"
										onClick={() => table.setPageIndex(item)}
									>
										{item + 1}
									</Button>
								);
							})}
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</div>

			<Sheet
				open={Boolean(activeLead)}
				onOpenChange={(open) => {
					if (!open) {
						setActiveLead(null);
					}
				}}
			>
				<SheetContent
					side="right"
					className="flex h-full w-full flex-col overflow-hidden border-l p-0 sm:max-w-xl"
				>
					{activeLead ? (
						<div className="flex h-full flex-col">
							<div className="border-b px-6 py-5">
								<h1 className="text-xl font-bold tracking-tight lg:text-2xl">
									{activeLead.name} — Lead Details
								</h1>
							</div>

							<ScrollArea className="h-[calc(100vh-200px)] flex-1">
								<div className="space-y-6 px-6 py-5">
									<section className="space-y-4">
										<div className="flex items-start gap-4">
											<Avatar className="size-16">
												<AvatarFallback>
													{generateAvatarFallback(activeLead.name)}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col gap-2 flex-1">
												<p className="text-muted-foreground text-sm leading-relaxed">
													This lead originates from{" "}
													<span className="text-foreground font-medium">
														{activeLead.source || "Unknown"}
													</span>
													. Define the next actions and turn it into an
													opportunity.
												</p>
											</div>
										</div>
									</section>

									<Separator />

									<section className="space-y-4">
										<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
											Status
										</h2>
										<div className="space-y-3">
											<Badge
												className={cn(
													"rounded-full px-3 py-1 text-sm",
													statusClasses[activeLead.status],
												)}
											>
												<Sparkles className="mr-1.5 h-3.5 w-3.5" />
												{statusLabels[activeLead.status]}
											</Badge>
											<div className="space-y-2 text-sm text-muted-foreground">
												<div className="flex items-center gap-2">
													<CalendarClock
														className="h-4 w-4 text-muted-foreground"
														aria-hidden="true"
													/>
													<span>
														Lead created on {formatLeadDate(activeLead.createdAt)}
													</span>
												</div>
												{activeLead.updatedAt && activeLead.updatedAt !== activeLead.createdAt && (
													<div className="flex items-center gap-2">
														<NotebookPen
															className="h-4 w-4 text-muted-foreground"
															aria-hidden="true"
														/>
														<span>
															Last updated on{" "}
															{formatLeadDate(activeLead.updatedAt)}
														</span>
													</div>
												)}
											</div>
										</div>
									</section>

									<Separator />

									<section className="space-y-4">
										<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
											Key Information
										</h2>
										<dl className="grid gap-4 sm:grid-cols-2">
											<DetailRow
												icon={<Mail className="h-4 w-4" aria-hidden="true" />}
												label="Email"
												value={activeLead.email}
											/>
											<DetailRow
												icon={<Tag className="h-4 w-4" aria-hidden="true" />}
												label="Source"
												value={activeLead.source ?? "Unknown"}
											/>
											<DetailRow
												icon={
													<CalendarClock
														className="h-4 w-4"
														aria-hidden="true"
													/>
												}
												label="Created"
												value={formatLeadDate(activeLead.createdAt)}
											/>
											<DetailRow
												icon={
													<NotebookPen className="h-4 w-4" aria-hidden="true" />
												}
												label="Last updated"
												value={formatLeadDate(
													activeLead.updatedAt ?? activeLead.createdAt,
												)}
											/>
										</dl>
									</section>

									<Separator />

									<section className="space-y-4">
										<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
											Next Steps
										</h2>
										<ul className="space-y-2 text-sm text-muted-foreground">
											<li className="flex items-center gap-2">
												<PhoneCall
													className="h-4 w-4 text-primary"
													aria-hidden="true"
												/>
												Schedule an introductory call and confirm the business
												needs.
											</li>
											<li className="flex items-center gap-2">
												<UserRound
													className="h-4 w-4 text-primary"
													aria-hidden="true"
												/>
												Loop in the assigned sales rep for continued follow-up.
											</li>
											<li className="flex items-center gap-2">
												<NotebookPen
													className="h-4 w-4 text-primary"
													aria-hidden="true"
												/>
												Capture key notes after the first conversation.
											</li>
										</ul>
									</section>
								</div>
							</ScrollArea>
						</div>
					) : null}
				</SheetContent>
			</Sheet>

			<Dialog
				open={isEditDialogOpen}
				onOpenChange={(open) => {
					setIsEditDialogOpen(open);
					if (!open) {
						setEditTarget(null);
					}
				}}
			>
				{isEditDialogOpen ? (
					<DialogContent
						aria-labelledby={`${editDialogId}-title`}
						aria-describedby={`${editDialogId}-description`}
						className="max-w-xl"
					>
						<DialogHeader>
							<DialogTitle id={`${editDialogId}-title`}>Edit lead</DialogTitle>
							<DialogDescription id={`${editDialogId}-description`}>
								Update the lead details. All changes are simulated.
							</DialogDescription>
						</DialogHeader>
						<form
							onSubmit={handleEditSubmit}
							className="space-y-5"
							aria-live="polite"
							aria-busy={isProcessingEdit}
						>
							<div className="grid gap-4">
								<div className="grid gap-2">
									<Label htmlFor={`${editFormId}-name`}>Full name</Label>
									<Input
										id={`${editFormId}-name`}
										value={editFormState.name}
										onChange={(event) =>
											setEditFormState((previous) => ({
												...previous,
												name: event.target.value,
											}))
										}
										placeholder="Jovana Petrović"
										required
										autoFocus
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${editFormId}-email`}>Email</Label>
									<Input
										id={`${editFormId}-email`}
										type="email"
										value={editFormState.email}
										onChange={(event) =>
											setEditFormState((previous) => ({
												...previous,
												email: event.target.value,
											}))
										}
										placeholder="jovana@example.com"
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${editFormId}-status`}>Status</Label>
									<Select
										value={editFormState.status}
										onValueChange={(value: LeadStatus) =>
											setEditFormState((previous) => ({
												...previous,
												status: value,
											}))
										}
									>
										<SelectTrigger id={`${editFormId}-status`}>
											<SelectValue placeholder="Choose status" />
										</SelectTrigger>
										<SelectContent>
											{(Object.keys(statusLabels) as LeadStatus[]).map(
												(status) => (
													<SelectItem key={status} value={status}>
														{statusLabels[status]}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${editFormId}-source`}>Source</Label>
									<Input
										id={`${editFormId}-source`}
										value={editFormState.source}
										onChange={(event) =>
											setEditFormState((previous) => ({
												...previous,
												source: event.target.value,
											}))
										}
										placeholder="Website lead form"
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${editFormId}-notes`}>Notes</Label>
									<Textarea
										id={`${editFormId}-notes`}
										value={editFormState.notes}
										onChange={(event) =>
											setEditFormState((previous) => ({
												...previous,
												notes: event.target.value,
											}))
										}
										placeholder="Add key information or agreed next steps."
										rows={4}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setIsEditDialogOpen(false);
										setEditTarget(null);
									}}
									disabled={isProcessingEdit}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={isProcessingEdit}
									aria-live="assertive"
								>
									{isProcessingEdit ? (
										<>
											<Loader2
												className="mr-2 h-4 w-4 animate-spin"
												aria-hidden="true"
											/>
											Saving…
										</>
									) : (
										"Save changes"
									)}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				) : null}
			</Dialog>

			<Dialog
				open={isAddDialogOpen}
				onOpenChange={(open) => {
					setIsAddDialogOpen(open);
					if (!open) {
						setAddFormState({
							name: "",
							email: "",
							status: "new",
							source: "",
							notes: "",
						});
					}
				}}
			>
				{isAddDialogOpen ? (
					<DialogContent
						aria-labelledby={`${addDialogId}-title`}
						aria-describedby={`${addDialogId}-description`}
						className="max-w-xl"
					>
						<DialogHeader>
							<DialogTitle id={`${addDialogId}-title`}>
								Add new lead
							</DialogTitle>
							<DialogDescription id={`${addDialogId}-description`}>
								Provide the basic information to create a lead record.
							</DialogDescription>
						</DialogHeader>
						<form
							onSubmit={handleAddSubmit}
							className="space-y-5"
							aria-live="polite"
							aria-busy={isProcessingAdd}
						>
							<div className="grid gap-4">
								<div className="grid gap-2">
									<Label htmlFor={`${addFormId}-name`}>Full name</Label>
									<Input
										id={`${addFormId}-name`}
										value={addFormState.name}
										onChange={(event) =>
											setAddFormState((previous) => ({
												...previous,
												name: event.target.value,
											}))
										}
										placeholder="Marko Antić"
										required
										autoFocus
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${addFormId}-email`}>Email</Label>
									<Input
										id={`${addFormId}-email`}
										type="email"
										value={addFormState.email}
										onChange={(event) =>
											setAddFormState((previous) => ({
												...previous,
												email: event.target.value,
											}))
										}
										placeholder="marko@example.com"
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${addFormId}-status`}>Status</Label>
									<Select
										value={addFormState.status}
										onValueChange={(value: LeadStatus) =>
											setAddFormState((previous) => ({
												...previous,
												status: value,
											}))
										}
									>
										<SelectTrigger id={`${addFormId}-status`}>
											<SelectValue placeholder="Choose status" />
										</SelectTrigger>
										<SelectContent>
											{(Object.keys(statusLabels) as LeadStatus[]).map(
												(status) => (
													<SelectItem key={status} value={status}>
														{statusLabels[status]}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${addFormId}-source`}>Source</Label>
									<Input
										id={`${addFormId}-source`}
										value={addFormState.source}
										onChange={(event) =>
											setAddFormState((previous) => ({
												...previous,
												source: event.target.value,
											}))
										}
										placeholder="LinkedIn campaign"
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${addFormId}-notes`}>Notes</Label>
									<Textarea
										id={`${addFormId}-notes`}
										value={addFormState.notes}
										onChange={(event) =>
											setAddFormState((previous) => ({
												...previous,
												notes: event.target.value,
											}))
										}
										placeholder="Add notes from the initial outreach."
										rows={4}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setIsAddDialogOpen(false);
										setAddFormState({
											name: "",
											email: "",
											status: "new",
											source: "",
											notes: "",
										});
									}}
									disabled={isProcessingAdd}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={isProcessingAdd}
									aria-live="assertive"
								>
									{isProcessingAdd ? (
										<>
											<Loader2
												className="mr-2 h-4 w-4 animate-spin"
												aria-hidden="true"
											/>
											Creating…
										</>
									) : (
										"Create lead"
									)}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				) : null}
			</Dialog>

			<Dialog
				open={isDeleteDialogOpen}
				onOpenChange={(open) => {
					setIsDeleteDialogOpen(open);
					if (!open) {
						setDeleteTargets([]);
					}
				}}
			>
				{isDeleteDialogOpen ? (
					<DialogContent
						aria-labelledby={`${deleteDialogId}-title`}
						aria-describedby={`${deleteDialogId}-description`}
						className="sm:max-w-md"
					>
						<DialogHeader>
							<DialogTitle id={`${deleteDialogId}-title`}>
								Delete lead
							</DialogTitle>
							<DialogDescription id={`${deleteDialogId}-description`}>
								This action cannot be undone. Confirm you want to remove{" "}
								{deleteTargets.length === 1
									? deleteTargetNames[0]
									: `${numberFormatter.format(deleteTargets.length)} leads`}
								.
							</DialogDescription>
						</DialogHeader>
						<div className="bg-muted/30 text-muted-foreground rounded-md border p-3 text-sm">
							{deleteTargets.length === 1 ? (
								deleteTargetNames[0]
							) : (
								<ul className="list-disc space-y-1 pl-4">
									{deleteTargets.slice(0, 5).map((lead, index) => (
										<li key={`${lead.id}-${index}`}>{lead.name}</li>
									))}
									{deleteTargets.length > 5 ? (
										<li>{`…plus ${numberFormatter.format(deleteTargets.length - 5)} leads`}</li>
									) : null}
								</ul>
							)}
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsDeleteDialogOpen(false);
									setDeleteTargets([]);
								}}
								disabled={isProcessingDelete}
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant="destructive"
								onClick={handleDeleteConfirm}
								disabled={isProcessingDelete}
								aria-live="assertive"
							>
								{isProcessingDelete ? (
									<>
										<Loader2
											className="mr-2 h-4 w-4 animate-spin"
											aria-hidden="true"
										/>
										Deleting…
									</>
								) : (
									"Delete"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				) : null}
			</Dialog>
		</>
	);
});

LeadsDataTable.displayName = "LeadsDataTable";

type SortIconProps = {
	direction: false | "asc" | "desc";
};

const SortIcon = ({ direction }: SortIconProps) => {
	if (direction === "asc") {
		return <ArrowUp className="ml-2 h-3.5 w-3.5" />;
	}
	if (direction === "desc") {
		return <ArrowDown className="ml-2 h-3.5 w-3.5" />;
	}
	return <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-60" />;
};

type DetailRowProps = {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
};

const DetailRow = ({ icon, label, value }: DetailRowProps) => {
	return (
		<div className="flex items-start gap-3">
			<span className="text-muted-foreground mt-1">{icon}</span>
			<div>
				<dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
					{label}
				</dt>
				<dd className="text-foreground text-sm">{value}</dd>
			</div>
		</div>
	);
};
