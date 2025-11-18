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

type CRMData = {
	id: string;
	leadName: string;
	company: string;
	email: string;
	phone: string;
	source: string;
	status: "new" | "contacted" | "qualified" | "converted" | "lost";
	value: number;
	createdDate: string;
};

const data: CRMData[] = [
	{
		id: "L001",
		leadName: "John Smith",
		company: "Acme Corp",
		email: "john@acme.com",
		phone: "+1-555-0101",
		source: "Website",
		status: "qualified",
		value: 15000,
		createdDate: "2024-01-15",
	},
	{
		id: "L002",
		leadName: "Jane Doe",
		company: "Tech Solutions",
		email: "jane@tech.com",
		phone: "+1-555-0102",
		source: "Referral",
		status: "contacted",
		value: 25000,
		createdDate: "2024-01-16",
	},
	{
		id: "L003",
		leadName: "Bob Johnson",
		company: "Global Inc",
		email: "bob@global.com",
		phone: "+1-555-0103",
		source: "Social Media",
		status: "new",
		value: 10000,
		createdDate: "2024-01-17",
	},
	{
		id: "L004",
		leadName: "Alice Williams",
		company: "StartupXYZ",
		email: "alice@startup.com",
		phone: "+1-555-0104",
		source: "Website",
		status: "converted",
		value: 35000,
		createdDate: "2024-01-18",
	},
	{
		id: "L005",
		leadName: "Charlie Brown",
		company: "Enterprise Ltd",
		email: "charlie@enterprise.com",
		phone: "+1-555-0105",
		source: "Referral",
		status: "qualified",
		value: 50000,
		createdDate: "2024-01-19",
	},
	{
		id: "L006",
		leadName: "Diana Prince",
		company: "Innovation Co",
		email: "diana@innovation.com",
		phone: "+1-555-0106",
		source: "Social Media",
		status: "contacted",
		value: 18000,
		createdDate: "2024-01-20",
	},
	{
		id: "L007",
		leadName: "Edward Norton",
		company: "Digital Solutions",
		email: "edward@digital.com",
		phone: "+1-555-0107",
		source: "Website",
		status: "new",
		value: 12000,
		createdDate: "2024-01-21",
	},
	{
		id: "L008",
		leadName: "Fiona Apple",
		company: "Creative Agency",
		email: "fiona@creative.com",
		phone: "+1-555-0108",
		source: "Referral",
		status: "converted",
		value: 42000,
		createdDate: "2024-01-22",
	},
];

const columns: ColumnDef<CRMData>[] = [
	{
		accessorKey: "id",
		header: "ID",
		cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
	},
	{
		accessorKey: "leadName",
		header: "Lead Name",
	},
	{
		accessorKey: "company",
		header: "Company",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "phone",
		header: "Phone",
	},
	{
		accessorKey: "source",
		header: "Source",
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			const statusConfig = {
				new: { label: "New", variant: "secondary" as const },
				contacted: { label: "Contacted", variant: "default" as const },
				qualified: { label: "Qualified", variant: "default" as const },
				converted: { label: "Converted", variant: "default" as const },
				lost: { label: "Lost", variant: "destructive" as const },
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
		accessorKey: "value",
		header: "Value",
		cell: ({ row }) => {
			const value = parseFloat(row.getValue("value"));
			return <div>${value.toLocaleString()}</div>;
		},
	},
	{
		accessorKey: "createdDate",
		header: "Created",
		cell: ({ row }) => {
			const date = new Date(row.getValue("createdDate"));
			return <div>{date.toLocaleDateString()}</div>;
		},
	},
];

export function CRMDataTable() {
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
				<CardTitle>CRM Data</CardTitle>
				<CardDescription>Detailed leads and deals information</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="mb-4 flex items-center justify-between">
					<Input
						placeholder="Filter by name, company, or email..."
						value={
							(table.getColumn("leadName")?.getFilterValue() as string) ?? ""
						}
						onChange={(event) =>
							table.getColumn("leadName")?.setFilterValue(event.target.value)
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
