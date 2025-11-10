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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CalendarClock,
  Columns as ColumnsIcon,
  Eye,
  FolderOpen,
  Mail,
  MoreHorizontal,
  MessageCircle,
  Pencil,
  Phone,
  StickyNote,
  Trash2
} from "lucide-react";
import type { AccountContact } from "@crm/types";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { generateAvatarFallback } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

export type Contact = AccountContact;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium"
});

const contactSearch = (contact: Contact) =>
  [
    contact.firstName ?? "",
    contact.lastName ?? "",
    contact.fullName ?? "",
    contact.name,
    contact.email ?? "",
    contact.accountName ?? "",
    contact.title ?? "",
    contact.phone ?? ""
  ]
    .join(" ")
    .toLowerCase();

const QUICK_FILTERS = [
  { id: "mine", label: "My Contacts", query: "Manager" },
  { id: "new", label: "New", query: "2025" },
  { id: "engineering", label: "Engineering", query: "Engineer" },
  { id: "cs", label: "Customer Success", query: "Customer Success" }
] as const;

const SortIcon = ({ direction }: { direction: false | "asc" | "desc" }) => {
  if (direction === "asc") {
    return <ArrowUp className="ml-2 h-3.5 w-3.5" />;
  }

  if (direction === "desc") {
    return <ArrowDown className="ml-2 h-3.5 w-3.5" />;
  }

  return <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-60" />;
};

interface ContactsDataTableProps {
  data: Contact[];
}

export default function ContactsDataTable({ data }: ContactsDataTableProps) {
  const { toast } = useToast();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [activeQuickFilter, setActiveQuickFilter] = React.useState<string>("custom");
  const [activeContact, setActiveContact] = React.useState<Contact | null>(null);
  const [sidebarMode, setSidebarMode] = React.useState<"view" | "edit">("view");

  const openSidebar = React.useCallback((contact: Contact, mode: "view" | "edit" = "view") => {
    setActiveContact(contact);
    setSidebarMode(mode);
  }, []);

  const closeSidebar = React.useCallback(() => {
    setActiveContact(null);
  }, []);

  const handleView = React.useCallback(
    (contact: Contact) => {
      openSidebar(contact, "view");
    },
    [openSidebar]
  );

  const handleEdit = React.useCallback(
    (contact: Contact) => {
      openSidebar(contact, "edit");
    },
    [openSidebar]
  );

  const handleDelete = React.useCallback(
    (contact: Contact) => {
      toast({
        title: "Delete contact is not available",
        description: `The delete action for ${contact.name} will be enabled soon.`
      });
    },
    [toast]
  );

  const handleSendEmail = React.useCallback(
    (contact: Contact) => {
      if (!contact.email) {
        toast({
          title: "No email available",
          description: `${contact.name} does not have an email address yet.`
        });
        return;
      }

      window.open(`mailto:${contact.email}`, "_blank", "noopener,noreferrer");
    },
    [toast]
  );

  const handleCall = React.useCallback(
    (contact: Contact) => {
      if (!contact.phone) {
        toast({
          title: "No phone number available",
          description: `${contact.name} does not have a phone number yet.`
        });
        return;
      }

      window.open(`tel:${contact.phone}`, "_self");
    },
    [toast]
  );

  const handleMessage = React.useCallback(
    (contact: Contact) => {
      toast({
        title: "Messaging is not available",
        description: `Chat integrations for ${contact.name} will be enabled soon.`
      });
    },
    [toast]
  );

  const handleSummarize = React.useCallback(
    (contact: Contact) => {
      toast({
        title: "AI summary is coming soon",
        description: `We'll soon provide AI-generated insights for ${contact.name}.`
      });
    },
    [toast]
  );

  const getDisplayName = React.useCallback(
    (contact: Contact) =>
      contact.firstName
        ? `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ""}`
        : contact.name,
    []
  );

  const getInitialsSource = React.useCallback(
    (contact: Contact) =>
      contact.firstName ? `${contact.firstName} ${contact.lastName ?? ""}`.trim() : contact.name,
    []
  );

  const columns = React.useMemo<ColumnDef<Contact>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
            aria-label="Select all contacts on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label={`Select contact ${row.original.name}`}
          />
        ),
        enableSorting: false,
        enableHiding: false
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-2 h-8 px-2 text-left"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Name
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => {
          const contact = row.original;
          const initialsSource = getInitialsSource(contact);
          const displayName = getDisplayName(contact);

          return (
            <button
              type="button"
              onClick={() => handleView(contact)}
              className="hover:bg-muted/60 focus-visible:ring-ring focus-visible:ring-offset-background group flex w-full items-center gap-3 rounded-md px-1.5 py-1.5 text-left transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback>{generateAvatarFallback(initialsSource)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium group-hover:underline">{displayName}</span>
                {contact.title ? (
                  <span className="text-muted-foreground text-xs">{contact.title}</span>
                ) : null}
              </div>
            </button>
          );
        }
      },
      {
        accessorKey: "accountName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-2 h-8 px-2 text-left"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Company
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => row.original.accountName ?? "—"
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-2 h-8 px-2 text-left"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Email
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => row.original.email ?? "—"
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-2 h-8 px-2 text-left"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Phone
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => row.original.phone ?? "—"
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-2 h-8 px-2 text-left"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Added
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => dateFormatter.format(new Date(row.original.createdAt)),
        sortingFn: "datetime"
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const contact = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => handleEdit(contact)}
                aria-label={`Edit contact ${contact.name}`}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => handleDelete(contact)}
                aria-label={`Delete contact ${contact.name}`}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Delete</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => handleView(contact)}
                aria-label={`View contact ${contact.name}`}>
                <Eye className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">View</span>
              </Button>
            </div>
          );
        }
      }
    ],
    [getDisplayName, getInitialsSource, handleDelete, handleEdit, handleView]
  );

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
  const pageCount = table.getPageCount();
  const pageStart = filteredRowCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const pageEnd =
    filteredRowCount === 0
      ? 0
      : Math.min(filteredRowCount, pagination.pageSize * (pagination.pageIndex + 1));
  const selectionCount = table.getSelectedRowModel().rows.length;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  const numberFormatter = React.useMemo(() => new Intl.NumberFormat("en-US"), []);

  const paginationItems = React.useMemo(() => {
    if (pageCount <= 0) {
      return [] as Array<number | "ellipsis">;
    }

    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_value, index) => index) as Array<
        number | "ellipsis"
      >;
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
        ? "1 contact selected"
        : `${numberFormatter.format(selectionCount)} contacts selected`
      : filteredRowCount === 0
        ? "Showing 0-0 of 0 contacts"
        : `Showing ${numberFormatter.format(pageStart)}-${numberFormatter.format(pageEnd)} of ${numberFormatter.format(filteredRowCount)} contacts`;

  const handleQuickFilter = (filterId: string, query: string) => {
    setActiveQuickFilter(filterId);
    setGlobalFilter(query);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,360px)_auto] md:items-center">
            <Input
              placeholder="Search contacts by name, email, or company"
              value={globalFilter}
              onChange={(event) => {
                const value = event.target.value;
                setGlobalFilter(value);
                setActiveQuickFilter(value === "" ? "custom" : "custom");
              }}
              className="w-full"
            />
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
                      onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}>
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((filter) => (
              <Button
                key={filter.id}
                size="sm"
                variant={activeQuickFilter === filter.id ? "default" : "secondary"}
                onClick={() => handleQuickFilter(filter.id, filter.query)}>
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-background overflow-hidden rounded-xl border shadow-sm">
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} className="p-6">
                    <Empty className="border-none p-0">
                      <EmptyHeader>
                        <EmptyTitle>No contacts found</EmptyTitle>
                        <EmptyDescription>
                          Create a new contact or check whether the seed data was applied
                          successfully.
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <p className="text-muted-foreground text-sm">
                          There are currently no records matching the filters.
                        </p>
                      </EmptyContent>
                    </Empty>
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
              <span className="text-foreground text-sm font-medium">Rows per page</span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) => table.setPageSize(Number(value))}>
                <SelectTrigger className="h-8 w-[90px]">
                  <SelectValue placeholder={pagination.pageSize} />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((pageSizeOption) => (
                    <SelectItem key={pageSizeOption} value={String(pageSizeOption)}>
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
                disabled={!table.getCanPreviousPage()}>
                Previous
              </Button>
              {paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-2">
                    ...
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={pagination.pageIndex === item ? "default" : "outline"}
                    size="sm"
                    onClick={() => table.setPageIndex(item)}>
                    {item + 1}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Sheet
        open={Boolean(activeContact)}
        onOpenChange={(open) => {
          if (!open) {
            closeSidebar();
          }
        }}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden border-l p-0 sm:max-w-xl">
          {activeContact ? (
            <TooltipProvider>
              <div className="flex h-full flex-col">
                <div className="border-b px-6 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <SheetTitle className="text-2xl leading-tight font-semibold">Contact Details</SheetTitle>
                      <SheetDescription>
                        Manage the context and next steps for {getDisplayName(activeContact)}.
                      </SheetDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="size-9">
                            <span className="sr-only">Open quick actions</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleEdit(activeContact)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit contact
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDelete(activeContact)}>
                            <Trash2 className="text-destructive mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleSendEmail(activeContact)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send email
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleCall(activeContact)}>
                            <Phone className="mr-2 h-4 w-4" />
                            Call contact
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleMessage(activeContact)}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-[calc(100vh-200px)] flex-1">
                  <Tabs defaultValue="overview" className="flex h-full flex-col gap-4 py-4">
                    <div className="px-6">
                      <TabsList className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Overview
                        </TabsTrigger>
                        <TabsTrigger value="notes" className="flex items-center gap-2">
                          <StickyNote className="h-4 w-4" />
                          Notes
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4" />
                          Activity
                        </TabsTrigger>
                        <TabsTrigger value="files" className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          Files
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="overview" className="space-y-4 px-6 pb-4">
                      <Card className="shadow-sm">
                        <CardContent className="space-y-6 p-5">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                              <Avatar className="size-16">
                                <AvatarFallback>
                                  {generateAvatarFallback(getInitialsSource(activeContact))}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col gap-1.5">
                                <p className="text-xl leading-tight font-semibold">
                                  {getDisplayName(activeContact)}
                                </p>
                                {activeContact.title ? (
                                  <Badge
                                    variant="secondary"
                                    className="w-fit px-3 py-1 text-xs font-medium uppercase">
                                    {activeContact.title}
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                            <div className="space-y-3">
                              {activeContact.accountName ? (
                                <Link
                                  href={
                                    activeContact.accountId
                                      ? `/accounts/${activeContact.accountId}`
                                      : "/accounts"
                                  }
                                  className="text-primary inline-flex w-fit items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
                                  <Building2 className="h-4 w-4" />
                                  Linked to {activeContact.accountName}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  No linked company
                                </span>
                              )}
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                Keep track of relationship context, internal notes, and recent
                                activities for{" "}
                                <span className="text-foreground font-medium">
                                  {getDisplayName(activeContact)}
                                </span>
                                .
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="gap-2 font-mono text-xs">
                                      ID: {activeContact.id.slice(0, 8)}…
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    <p className="text-xs">Full ID: {activeContact.id}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                          <Separator />
                          <dl className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-start gap-3">
                              <Mail className="text-muted-foreground mt-1 h-4 w-4" />
                              <div>
                                <dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                                  Email
                                </dt>
                                <dd className="text-foreground text-sm break-all">
                                  {activeContact.email ?? "Not available"}
                                </dd>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Phone className="text-muted-foreground mt-1 h-4 w-4" />
                              <div>
                                <dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                                  Phone
                                </dt>
                                <dd className="text-foreground text-sm">
                                  {activeContact.phone ?? "Not available"}
                                </dd>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <CalendarClock className="text-muted-foreground mt-1 h-4 w-4" />
                              <div>
                                <dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                                  Created
                                </dt>
                                <dd className="text-foreground text-sm">
                                  {dateFormatter.format(new Date(activeContact.createdAt))}
                                </dd>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <CalendarClock className="text-muted-foreground mt-1 h-4 w-4" />
                              <div>
                                <dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                                  Updated
                                </dt>
                                <dd className="text-foreground text-sm">
                                  {dateFormatter.format(new Date(activeContact.updatedAt))}
                                </dd>
                              </div>
                            </div>
                          </dl>
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm">
                        <CardHeader className="gap-2">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <MessageCircle className="h-4 w-4" />
                            AI Insights
                          </CardTitle>
                          <p className="text-muted-foreground text-sm">
                            Automated suggestions will help you decide the next best action for this
                            contact.
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                          <p>
                            Suggestion: Follow up with {getDisplayName(activeContact)} via email to
                            confirm the latest engagement details.
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="w-fit"
                            onClick={() => handleSummarize(activeContact)}>
                            Generate insights
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="notes" className="px-6 pb-4">
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <StickyNote className="h-4 w-4" />
                            Notes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                          <p className="text-muted-foreground">
                            Keep internal notes to inform teammates about the latest conversations
                            and commitments.
                          </p>
                          <Button type="button" variant="secondary" size="sm">
                            Add note
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="px-6 pb-4">
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarClock className="h-4 w-4" />
                            Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                          <p className="text-muted-foreground">
                            Calls, emails, and tasks will appear here as activity tracking is
                            connected.
                          </p>
                          <Button type="button" variant="outline" size="sm">
                            Log activity
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="files" className="px-6 pb-4">
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <FolderOpen className="h-4 w-4" />
                            Files
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                          <p className="text-muted-foreground">
                            Store proposals, contracts, and supporting documents for quick access.
                          </p>
                          <Button type="button" variant="outline" size="sm">
                            Upload file
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </ScrollArea>
              </div>
            </TooltipProvider>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
