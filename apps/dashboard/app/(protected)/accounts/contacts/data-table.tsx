"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { Columns as ColumnsIcon, MoreHorizontal } from "lucide-react";
import type { AccountContact } from "@crm/types";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { generateAvatarFallback } from "@/lib/utils";

export type Contact = AccountContact;

const dateFormatter = new Intl.DateTimeFormat("sr-RS", {
  dateStyle: "medium"
});

const contactSearch = (contact: Contact) =>
  [
    contact.firstName ?? "",
    contact.lastName ?? "",
    contact.name,
    contact.email ?? "",
    contact.accountName ?? "",
    contact.title ?? "",
    contact.phone ?? ""
  ]
    .join(" ")
    .toLowerCase();

const columns: ColumnDef<Contact>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
        aria-label="Označi sve kontakte na stranici"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        aria-label={`Označi kontakt ${row.original.name}`}
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "name",
    header: "Ime i prezime",
    cell: ({ row }) => {
      const contact = row.original;
      const initialsSource = contact.firstName ? `${contact.firstName} ${contact.lastName ?? ""}`.trim() : contact.name;
      const displayName = contact.firstName
        ? `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ""}`
        : contact.name;

      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback>{generateAvatarFallback(initialsSource)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{displayName}</span>
            {contact.title ? (
              <span className="text-muted-foreground text-xs">{contact.title}</span>
            ) : null}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "accountName",
    header: "Account",
    cell: ({ row }) => row.original.accountName ?? "—"
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email ?? "—"
  },
  {
    accessorKey: "phone",
    header: "Telefon",
    cell: ({ row }) => row.original.phone ?? "—"
  },
  {
    accessorKey: "createdAt",
    header: "Dodat",
    cell: ({ row }) => dateFormatter.format(new Date(row.original.createdAt)),
    sortingFn: "datetime"
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const contact = row.original;

      const copyEmail = async () => {
        if (!contact.email) {
          return;
        }

        try {
          await navigator.clipboard?.writeText(contact.email);
        } catch (error) {
          console.error("Copy email failed", error);
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Otvori meni akcija</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={!contact.email} onSelect={copyEmail}>
              Kopiraj email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

interface ContactsDataTableProps {
  data: Contact[];
}

export default function ContactsDataTable({ data }: ContactsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      globalFilter
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue) {
        return true;
      }

      return contactSearch(row.original).includes(String(filterValue).toLowerCase());
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const pagination = table.getState().pagination;
  const pageStart = filteredRowCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const pageEnd = filteredRowCount === 0 ? 0 : Math.min(filteredRowCount, pagination.pageSize * (pagination.pageIndex + 1));
  const selectionCount = table.getSelectedRowModel().rows.length;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          placeholder="Pretraži kontakte prema imenu, emailu ili accountu"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="w-full max-w-md"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <ColumnsIcon className="h-4 w-4" />
              Kolone
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
                  onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="p-6">
                  <Empty className="border-none p-0">
                    <EmptyHeader>
                      <EmptyTitle>Nema kontakata</EmptyTitle>
                      <EmptyDescription>
                        Kreiraj novi kontakt ili proveri da li su seed podaci uspešno upisani u bazu.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <p className="text-muted-foreground text-sm">
                        Trenutno nema zapisa koji odgovaraju filteru.
                      </p>
                    </EmptyContent>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          {selectionCount > 0
            ? `Odabrano ${selectionCount} kontakt${selectionCount === 1 ? "" : "a"}`
            : `Prikazano ${filteredRowCount === 0 ? 0 : `${pageStart}-${pageEnd}`} od ${filteredRowCount} kontakata`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prethodna
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sledeća
          </Button>
        </div>
      </div>
    </div>
  );
}
