"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	type Table as TanStackTable,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import * as React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ProjectTask, TaskStatus } from "@/src/types/projects";
import { DataTablePagination } from "./data-table-pagination";

const statusConfig: Record<
	TaskStatus,
	{
		label: string;
		groupLabel: string;
	}
> = {
	todo: {
		label: "Backlog",
		groupLabel: "Backlog",
	},
	in_progress: {
		label: "In Progress",
		groupLabel: "In Progress",
	},
	blocked: {
		label: "In Review",
		groupLabel: "In Review",
	},
	done: {
		label: "Done",
		groupLabel: "Done",
	},
};

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	onTableReady?: (table: TanStackTable<TData>) => void;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	onTableReady,
}: DataTableProps<TData, TValue>) {
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [expanded, setExpanded] = React.useState<Record<string, boolean>>(
		() => {
			// Initialize all groups as expanded by default
			return {
				todo: true,
				in_progress: true,
				blocked: true,
				done: true,
			};
		},
	);

	// Group data by status
	const groupedData = React.useMemo(() => {
		const groups: Record<TaskStatus, ProjectTask[]> = {
			todo: [],
			in_progress: [],
			blocked: [],
			done: [],
		};

		(data as ProjectTask[]).forEach((task) => {
			const status = task.status || "todo";
			if (groups[status]) {
				groups[status].push(task);
			}
		});

		return groups;
	}, [data]);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
		},
		initialState: {
			pagination: {
				pageSize: 25,
			},
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	React.useEffect(() => {
		if (onTableReady) {
			onTableReady(table);
		}
	}, [table, onTableReady]);

	const statusOrder: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

	// Get all table rows for lookup
	const tableRows = React.useMemo(() => {
		const rows = table.getRowModel().rows;
		const rowMap = new Map<string, (typeof rows)[0]>();
		rows.forEach((row) => {
			const task = row.original as ProjectTask;
			rowMap.set(task.id, row);
		});
		return rowMap;
	}, [table]);

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id} colSpan={header.colSpan}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{statusOrder.map((status) => {
							const tasks = groupedData[status];
							const config = statusConfig[status];
							const isExpanded = expanded[status] !== false;

							if (tasks.length === 0) return null;

							return (
								<React.Fragment key={status}>
									<TableRow
										className="bg-muted/50 hover:bg-muted/70 cursor-pointer"
										onClick={() =>
											setExpanded((prev) => ({
												...prev,
												[status]: !isExpanded,
											}))
										}
									>
										<TableCell colSpan={columns.length} className="py-3">
											<div className="flex items-center gap-2">
												<ChevronRight
													className={cn(
														"h-4 w-4 transition-transform",
														isExpanded && "rotate-90",
													)}
												/>
												<span className="font-semibold text-sm">
													{config.groupLabel}
												</span>
												<span className="text-muted-foreground text-xs">
													({tasks.length})
												</span>
											</div>
										</TableCell>
									</TableRow>
									{isExpanded &&
										tasks.map((task) => {
											// Find the actual table row for this task
											const tableRow = tableRows.get(task.id);

											if (!tableRow) {
												return null;
											}

											// Use the actual table row with all TanStack Table methods
											return (
												<TableRow
													key={task.id}
													data-state={tableRow.getIsSelected() && "selected"}
													className="bg-background"
												>
													{tableRow.getVisibleCells().map((cell) => (
														<TableCell key={cell.id}>
															{flexRender(
																cell.column.columnDef.cell,
																cell.getContext(),
															)}
														</TableCell>
													))}
												</TableRow>
											);
										})}
								</React.Fragment>
							);
						})}
						{statusOrder.every(
							(status) => groupedData[status].length === 0,
						) && (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No tasks found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}
