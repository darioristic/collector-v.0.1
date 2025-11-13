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
  type VisibilityState
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type SalesData = {
  id: string;
  date: string;
  customer: string;
  product: string;
  quantity: number;
  amount: number;
  status: "completed" | "pending" | "cancelled";
};

const data: SalesData[] = [
  {
    id: "S001",
    date: "2024-01-15",
    customer: "John Doe",
    product: "Product A",
    quantity: 5,
    amount: 1250.0,
    status: "completed"
  },
  {
    id: "S002",
    date: "2024-01-16",
    customer: "Jane Smith",
    product: "Product B",
    quantity: 3,
    amount: 750.0,
    status: "completed"
  },
  {
    id: "S003",
    date: "2024-01-17",
    customer: "Bob Johnson",
    product: "Product C",
    quantity: 10,
    amount: 2500.0,
    status: "pending"
  },
  {
    id: "S004",
    date: "2024-01-18",
    customer: "Alice Williams",
    product: "Product A",
    quantity: 2,
    amount: 500.0,
    status: "completed"
  },
  {
    id: "S005",
    date: "2024-01-19",
    customer: "Charlie Brown",
    product: "Product D",
    quantity: 7,
    amount: 1750.0,
    status: "cancelled"
  },
  {
    id: "S006",
    date: "2024-01-20",
    customer: "Diana Prince",
    product: "Product B",
    quantity: 4,
    amount: 1000.0,
    status: "completed"
  },
  {
    id: "S007",
    date: "2024-01-21",
    customer: "Edward Norton",
    product: "Product C",
    quantity: 6,
    amount: 1500.0,
    status: "pending"
  },
  {
    id: "S008",
    date: "2024-01-22",
    customer: "Fiona Apple",
    product: "Product A",
    quantity: 8,
    amount: 2000.0,
    status: "completed"
  }
];

const columns: ColumnDef<SalesData>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return <div>{date.toLocaleDateString()}</div>;
    }
  },
  {
    accessorKey: "customer",
    header: "Customer"
  },
  {
    accessorKey: "product",
    header: "Product"
  },
  {
    accessorKey: "quantity",
    header: "Quantity"
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return <div>${amount.toFixed(2)}</div>;
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusConfig = {
        completed: { label: "Completed", variant: "default" as const },
        pending: { label: "Pending", variant: "secondary" as const },
        cancelled: { label: "Cancelled", variant: "destructive" as const }
      };
      const config = statusConfig[status as keyof typeof statusConfig];
      return (
        <Badge variant={config.variant} size="xs">
          {config.label}
        </Badge>
      );
    }
  }
];

export function SalesDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
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
      rowSelection
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Data</CardTitle>
        <CardDescription>Detailed sales transaction data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <Input
            placeholder="Filter by customer or product..."
            value={(table.getColumn("customer")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("customer")?.setFilterValue(event.target.value)}
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
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}>
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
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
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
              disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
