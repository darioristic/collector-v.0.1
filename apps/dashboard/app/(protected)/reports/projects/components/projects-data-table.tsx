"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

type ProjectData = {
	id: string;
	name: string;
	client: string;
	manager: string;
	startDate: string;
	endDate: string;
	status: "active" | "completed" | "on-hold" | "cancelled";
	budget: number;
	spent: number;
	progress: number;
};

const data: ProjectData[] = [
	{
		id: "P001",
		name: "Website Redesign",
		client: "Acme Corp",
		manager: "John Smith",
		startDate: "2024-01-01",
		endDate: "2024-03-31",
		status: "active",
		budget: 50000,
		spent: 32500,
		progress: 65,
	},
	{
		id: "P002",
		name: "Mobile App Development",
		client: "Tech Solutions",
		manager: "Jane Doe",
		startDate: "2024-02-15",
		endDate: "2024-06-30",
		status: "active",
		budget: 120000,
		spent: 78000,
		progress: 55,
	},
	{
		id: "P003",
		name: "E-commerce Platform",
		client: "Global Inc",
		manager: "Bob Johnson",
		startDate: "2023-11-01",
		endDate: "2024-02-29",
		status: "completed",
		budget: 80000,
		spent: 76500,
		progress: 100,
	},
	{
		id: "P004",
		name: "Cloud Migration",
		client: "StartupXYZ",
		manager: "Alice Williams",
		startDate: "2024-03-01",
		endDate: "2024-05-31",
		status: "active",
		budget: 95000,
		spent: 42000,
		progress: 45,
	},
	{
		id: "P005",
		name: "Data Analytics Dashboard",
		client: "Enterprise Ltd",
		manager: "Charlie Brown",
		startDate: "2024-01-20",
		endDate: "2024-04-20",
		status: "on-hold",
		budget: 65000,
		spent: 28000,
		progress: 30,
	},
	{
		id: "P006",
		name: "API Integration",
		client: "Innovation Co",
		manager: "Diana Prince",
		startDate: "2023-12-01",
		endDate: "2024-01-31",
		status: "completed",
		budget: 45000,
		spent: 43200,
		progress: 100,
	},
	{
		id: "P007",
		name: "Security Audit",
		client: "Digital Solutions",
		manager: "Edward Norton",
		startDate: "2024-04-01",
		endDate: "2024-05-15",
		status: "active",
		budget: 35000,
		spent: 18200,
		progress: 52,
	},
	{
		id: "P008",
		name: "Brand Identity",
		client: "Creative Agency",
		manager: "Fiona Apple",
		startDate: "2024-02-01",
		endDate: "2024-03-15",
		status: "cancelled",
		budget: 25000,
		spent: 8500,
		progress: 0,
	},
];

const columns: ColumnDef<ProjectData>[] = [
	{
		accessorKey: "id",
		header: "ID",
		cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
	},
	{
		accessorKey: "name",
		header: "Project Name",
	},
	{
		accessorKey: "client",
		header: "Client",
	},
	{
		accessorKey: "manager",
		header: "Manager",
	},
	{
		accessorKey: "startDate",
		header: "Start Date",
		cell: ({ row }) => {
			const date = new Date(row.getValue("startDate"));
			return <div>{date.toLocaleDateString()}</div>;
		},
	},
	{
		accessorKey: "endDate",
		header: "End Date",
		cell: ({ row }) => {
			const date = new Date(row.getValue("endDate"));
			return <div>{date.toLocaleDateString()}</div>;
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			const statusConfig = {
				active: { label: "Active", variant: "default" as const },
				completed: { label: "Completed", variant: "default" as const },
				"on-hold": { label: "On Hold", variant: "secondary" as const },
				cancelled: { label: "Cancelled", variant: "destructive" as const },
			};
			const config = statusConfig[status as keyof typeof statusConfig];
			return (
				<Badge variant={config.variant} size="xs">
					{config.label}
				</Badge>
			);
		},
	},
	{
		accessorKey: "budget",
		header: "Budget",
		cell: ({ row }) => {
			const budget = parseFloat(row.getValue("budget"));
			return <div>${budget.toLocaleString()}</div>;
		},
	},
	{
		accessorKey: "spent",
		header: "Spent",
		cell: ({ row }) => {
			const spent = parseFloat(row.getValue("spent"));
			return <div>${spent.toLocaleString()}</div>;
		},
	},
	{
		accessorKey: "progress",
		header: "Progress",
		cell: ({ row }) => {
			const progress = row.getValue("progress") as number;
			return <div>{progress}%</div>;
		},
	},
];

export function ProjectsDataTable() {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Projects Data</CardTitle>
				<CardDescription>
					Detailed project information and statistics
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="mb-4 flex items-center justify-between">
					<Input
						placeholder="Filter by name, client, or manager..."
						value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
						onChange={(event) =>
							table.getColumn("name")?.setFilterValue(event.target.value)
						}
						className="max-w-sm"
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="ml-auto">
								Columns <ChevronDown className="ml-2 h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead key={header.id}>
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
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
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
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center justify-end space-x-2 pt-4">
					<div className="text-muted-foreground flex-1 text-sm">
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<div className="space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							Previous
						</Button>
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
			</CardContent>
		</Card>
	);
}
