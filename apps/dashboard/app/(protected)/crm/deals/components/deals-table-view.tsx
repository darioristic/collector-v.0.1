"use client";

import * as React from "react";
import type { Deal } from "@/lib/db/schema/deals";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CalendarClock, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEAL_STAGE_BADGE_CLASSNAME, type DealStage } from "../constants";
import { formatCurrency, formatDate } from "../utils";

interface DealsTableViewProps {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

const columns: ColumnDef<Deal>[] = [
  {
    accessorKey: "title",
    header: "Deal Name",
    cell: ({ row }) => {
      const deal = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{deal.title}</span>
          <span className="text-muted-foreground text-sm">{deal.company}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.owner}</span>,
  },
  {
    accessorKey: "value",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right font-semibold">{formatCurrency(row.original.value)}</div>
    ),
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const stage = row.original.stage as DealStage;
      return <Badge className={DEAL_STAGE_BADGE_CLASSNAME[stage]}>{stage}</Badge>;
    },
  },
  {
    accessorKey: "closeDate",
    header: () => (
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4" aria-hidden="true" />
        Close Date
      </div>
    ),
    cell: ({ row }) => <span>{formatDate(row.original.closeDate)}</span>,
  },
];

export default function DealsTableView({ deals, onEdit, onDelete }: DealsTableViewProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data: deals,
    columns: [
      ...columns,
      {
        id: "actions",
        enableSorting: false,
        header: "",
        cell: ({ row }) => {
          const deal = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Open actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(deal)}>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => onDelete(deal)}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue) {
        return true;
      }

      const value = filterValue.toString().toLowerCase();
      const haystack = `${row.original.title} ${row.original.company} ${row.original.owner}`.toLowerCase();

      return haystack.includes(value);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Quick search..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="h-9 w-full sm:w-72"
        />
        <span className="text-sm text-muted-foreground">
          {deals.length} {deals.length === 1 ? "deal" : "deals"}
        </span>
      </div>

      {deals.length === 0 ? (
        <Empty>
          <EmptyContent>
            <EmptyHeader>
              <EmptyTitle>No deals found</EmptyTitle>
              <EmptyDescription>Adjust filters or add a new deal to populate the table.</EmptyDescription>
            </EmptyHeader>
          </EmptyContent>
        </Empty>
      ) : (
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}

