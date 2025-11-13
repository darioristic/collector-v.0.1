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

type HRData = {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  status: "active" | "on-leave" | "terminated";
  attendance: number;
};

const data: HRData[] = [
  {
    id: "E001",
    name: "John Smith",
    email: "john.smith@company.com",
    department: "Engineering",
    position: "Senior Developer",
    hireDate: "2022-01-15",
    status: "active",
    attendance: 98
  },
  {
    id: "E002",
    name: "Jane Doe",
    email: "jane.doe@company.com",
    department: "Sales",
    position: "Sales Manager",
    hireDate: "2021-06-20",
    status: "active",
    attendance: 95
  },
  {
    id: "E003",
    name: "Bob Johnson",
    email: "bob.johnson@company.com",
    department: "Marketing",
    position: "Marketing Specialist",
    hireDate: "2023-03-10",
    status: "on-leave",
    attendance: 92
  },
  {
    id: "E004",
    name: "Alice Williams",
    email: "alice.williams@company.com",
    department: "HR",
    position: "HR Manager",
    hireDate: "2020-09-05",
    status: "active",
    attendance: 100
  },
  {
    id: "E005",
    name: "Charlie Brown",
    email: "charlie.brown@company.com",
    department: "Finance",
    position: "Financial Analyst",
    hireDate: "2022-11-18",
    status: "active",
    attendance: 97
  },
  {
    id: "E006",
    name: "Diana Prince",
    email: "diana.prince@company.com",
    department: "Operations",
    position: "Operations Manager",
    hireDate: "2021-04-12",
    status: "active",
    attendance: 96
  },
  {
    id: "E007",
    name: "Edward Norton",
    email: "edward.norton@company.com",
    department: "Engineering",
    position: "Junior Developer",
    hireDate: "2023-08-22",
    status: "active",
    attendance: 94
  },
  {
    id: "E008",
    name: "Fiona Apple",
    email: "fiona.apple@company.com",
    department: "Sales",
    position: "Sales Representative",
    hireDate: "2022-05-30",
    status: "terminated",
    attendance: 0
  }
];

const columns: ColumnDef<HRData>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>
  },
  {
    accessorKey: "name",
    header: "Name"
  },
  {
    accessorKey: "email",
    header: "Email"
  },
  {
    accessorKey: "department",
    header: "Department"
  },
  {
    accessorKey: "position",
    header: "Position"
  },
  {
    accessorKey: "hireDate",
    header: "Hire Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("hireDate"));
      return <div>{date.toLocaleDateString()}</div>;
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusConfig = {
        active: { label: "Active", variant: "default" as const },
        "on-leave": { label: "On Leave", variant: "secondary" as const },
        terminated: { label: "Terminated", variant: "destructive" as const }
      };
      const config = statusConfig[status as keyof typeof statusConfig];
      return (
        <Badge variant={config.variant} size="xs">
          {config.label}
        </Badge>
      );
    }
  },
  {
    accessorKey: "attendance",
    header: "Attendance %",
    cell: ({ row }) => {
      const attendance = row.getValue("attendance") as number;
      return <div>{attendance}%</div>;
    }
  }
];

export function HRDataTable() {
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
        <CardTitle>Employee Data</CardTitle>
        <CardDescription>Detailed employee information and statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <Input
            placeholder="Filter by name, email, or department..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
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
