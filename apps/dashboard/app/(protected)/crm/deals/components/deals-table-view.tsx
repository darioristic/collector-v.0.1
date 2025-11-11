"use client";

import * as React from "react";
import type { Deal } from "@/lib/db/schema/deals";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  useReactTable
} from "@tanstack/react-table";
import { CalendarClock, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DEAL_STAGE_BADGE_CLASSNAME, type DealStage } from "../constants";
import { formatCurrency, formatDate } from "../utils";

interface DealsTableViewProps {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

const baseColumns: ColumnDef<Deal>[] = [
  {
    accessorKey: "title",
    header: "Deal Name",
    cell: ({ row }) => {
      const deal = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{deal.title}</span>
          <span className="text-muted-foreground text-xs">{deal.company}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => <span className="text-sm font-medium text-foreground">{row.original.owner}</span>
  },
  {
    accessorKey: "value",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right font-semibold text-foreground">{formatCurrency(row.original.value)}</div>
    )
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const stage = row.original.stage as DealStage;
      return <Badge className={DEAL_STAGE_BADGE_CLASSNAME[stage]}>{stage}</Badge>;
    }
  },
  {
    accessorKey: "closeDate",
    header: () => (
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4" aria-hidden="true" />
        Close Date
      </div>
    ),
    cell: ({ row }) => <span className="text-sm text-foreground">{formatDate(row.original.closeDate)}</span>
  }
];

const PAGE_SIZE = 10;

export default function DealsTableView({ deals, onEdit, onDelete }: DealsTableViewProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable({
    data: deals,
    columns: [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all deals"
            checked={
              table.getIsSomePageRowsSelected() || table.getIsAllPageRowsSelected()
                ? "indeterminate"
                : table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select deal ${row.original.title}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        )
      },
      {
        id: "index",
        header: "#",
        enableSorting: false,
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          return (
            <span className="text-xs text-muted-foreground">
              {pageIndex * pageSize + row.index + 1}
            </span>
          );
        }
      },
      ...baseColumns,
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
        }
      }
    ],
    state: {
      sorting,
      rowSelection
    },
    initialState: {
      pagination: {
        pageSize: PAGE_SIZE
      }
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);
  const pageSize = table.getState().pagination.pageSize;
  const totalDeals = deals.length;
  const rangeStart = totalDeals === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min(totalDeals, (pageIndex + 1) * pageSize);

  if (deals.length === 0) {
    return (
      <div className="bg-background overflow-hidden rounded-xl border shadow-sm">
        <div className="flex h-40 flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
          <Empty>
            <EmptyContent>
              <EmptyHeader>
                <EmptyTitle>No deals found</EmptyTitle>
                <EmptyDescription>Adjust filters or create a new deal to populate this table.</EmptyDescription>
              </EmptyHeader>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background overflow-hidden rounded-xl border shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-4 text-sm text-muted-foreground">
        <span>
          {selectedCount} selected · {totalDeals} {totalDeals === 1 ? "deal" : "deals"}
        </span>
        <span className="tabular-nums">
          Showing {rangeStart}&ndash;{rangeEnd}
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[820px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                      header.column.id === "value" && "text-right",
                      header.column.id === "actions" && "w-[72px]",
                      header.column.id === "select" && "w-[48px]",
                      header.column.id === "index" && "w-[48px]"
                    )}>
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
              <TableRow
                key={row.id}
                className={cn(
                  "border-b border-border/60 transition-colors hover:bg-muted/40",
                  row.getIsSelected() && "bg-muted/40"
                )}
                data-state={row.getIsSelected() ? "selected" : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "px-4 py-3 text-sm text-foreground",
                      cell.column.id === "value" && "text-right font-semibold",
                      cell.column.id === "select" && "w-[48px]",
                      cell.column.id === "index" && "text-xs text-muted-foreground",
                      cell.column.id === "actions" && "w-[72px]"
                    )}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="border-t px-4 py-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="tabular-nums">
            Showing {rangeStart}&ndash;{rangeEnd} of {totalDeals}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Previous page</span>
            </Button>
            <span className="tabular-nums">
              Page {pageIndex + 1} of {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

