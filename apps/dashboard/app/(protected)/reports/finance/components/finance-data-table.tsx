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

type FinanceData = {
	id: string;
	date: string;
	description: string;
	category: string;
	type: "income" | "expense";
	amount: number;
	status: "completed" | "pending" | "cancelled";
};

const data: FinanceData[] = [
	{
		id: "F001",
		date: "2024-01-15",
		description: "Client Payment - Acme Corp",
		category: "Revenue",
		type: "income",
		amount: 50000,
		status: "completed",
	},
	{
		id: "F002",
		date: "2024-01-16",
		description: "Office Rent",
		category: "Operations",
		type: "expense",
		amount: 12000,
		status: "completed",
	},
	{
		id: "F003",
		date: "2024-01-17",
		description: "Software Licenses",
		category: "Technology",
		type: "expense",
		amount: 3500,
		status: "completed",
	},
	{
		id: "F004",
		date: "2024-01-18",
		description: "Client Payment - Tech Solutions",
		category: "Revenue",
		type: "income",
		amount: 75000,
		status: "pending",
	},
	{
		id: "F005",
		date: "2024-01-19",
		description: "Employee Salaries",
		category: "HR",
		type: "expense",
		amount: 85000,
		status: "completed",
	},
	{
		id: "F006",
		date: "2024-01-20",
		description: "Marketing Campaign",
		category: "Marketing",
		type: "expense",
		amount: 15000,
		status: "completed",
	},
	{
		id: "F007",
		date: "2024-01-21",
		description: "Client Payment - Global Inc",
		category: "Revenue",
		type: "income",
		amount: 120000,
		status: "completed",
	},
	{
		id: "F008",
		date: "2024-01-22",
		description: "Equipment Purchase",
		category: "Operations",
		type: "expense",
		amount: 25000,
		status: "cancelled",
	},
];

const columns: ColumnDef<FinanceData>[] = [
	{
		accessorKey: "id",
		header: "ID",
		cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
	},
	{
		accessorKey: "date",
		header: "Date",
		cell: ({ row }) => {
			const date = new Date(row.getValue("date"));
			return <div>{date.toLocaleDateString()}</div>;
		},
	},
	{
		accessorKey: "description",
		header: "Description",
	},
	{
		accessorKey: "category",
		header: "Category",
	},
	{
		accessorKey: "type",
		header: "Type",
		cell: ({ row }) => {
			const type = row.getValue("type") as string;
			return (
				<Badge variant={type === "income" ? "default" : "secondary"} size="xs">
					{type === "income" ? "Income" : "Expense"}
				</Badge>
			);
		},
	},
	{
		accessorKey: "amount",
		header: "Amount",
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("amount"));
			const type = row.original.type;
			return (
				<div className={type === "income" ? "text-green-600" : "text-red-600"}>
					{type === "income" ? "+" : "-"}${amount.toLocaleString()}
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			const statusConfig = {
				completed: { label: "Completed", variant: "default" as const },
				pending: { label: "Pending", variant: "secondary" as const },
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
];

export function FinanceDataTable() {
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
				<CardTitle>Financial Transactions</CardTitle>
				<CardDescription>Detailed financial transaction data</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="mb-4 flex items-center justify-between">
					<Input
						placeholder="Filter by description or category..."
						value={
							(table.getColumn("description")?.getFilterValue() as string) ?? ""
						}
						onChange={(event) =>
							table.getColumn("description")?.setFilterValue(event.target.value)
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
