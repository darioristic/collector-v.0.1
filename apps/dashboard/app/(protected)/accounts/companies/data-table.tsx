"use client";

import type { Account } from "@crm/types";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
	ColumnDef,
	HeaderContext,
	SortingState,
	VisibilityState,
} from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Briefcase,
	Building2,
	CalendarClock,
	Clock,
	Eye,
	Facebook,
	FileText,
	Globe,
	Instagram,
	Linkedin,
	Loader2,
	Mail,
	MapPin,
	Pencil,
	Phone,
	ReceiptIcon,
	Trash2,
	TrendingUp,
	Twitter,
	Users,
} from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TableToolbar } from "@/components/table-toolbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from "@/components/ui/empty";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ensureResponse, getApiUrl } from "@/src/lib/fetch-utils";

export type CompanyRow = Account & {
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
    legalName?: string | null;
    description?: string | null;
    socialMediaLinks?: {
        linkedin?: string | null;
        facebook?: string | null;
        twitter?: string | null;
        instagram?: string | null;
    } | null;
    registrationNumber?: string | null;
    dateOfIncorporation?: string | null;
    legalStatus?: string | null;
    companyType?: string | null;
    industry?: string | null;
    numberOfEmployees?: number | null;
    annualRevenueRange?: string | null;
    contacts?: Array<{
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
    title?: string | null;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const ACCOUNT_TAG_OPTIONS = ["customer", "partner", "vendor"] as const;

const formSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  email: z.string().trim().email("Provide a valid email address."),
  billingEmail: z
    .union([z.string().trim().email("Provide a valid email address."), z.literal("")])
    .optional(),
  phone: z.string().trim().optional().or(z.literal("")),
  website: z.string().trim().optional().or(z.literal("")),
  contactPerson: z.string().trim().optional().or(z.literal("")),
  type: z.enum(ACCOUNT_TAG_OPTIONS),
  taxId: z.string().trim().min(1, "Tax ID is required."),
  country: z.string().trim().min(2, "Use ISO country code.").max(3, "Use ISO country code.")
});

type CompanyFormValues = z.infer<typeof formSchema>;

const DEFAULT_FORM_VALUES: CompanyFormValues = {
  name: "",
  email: "",
  billingEmail: "",
  phone: "",
  website: "",
  contactPerson: "",
  type: ACCOUNT_TAG_OPTIONS[0],
  taxId: "",
  country: "RS"
};

const BLOCKED_COUNTRIES = new Set(["netherlands", "nl"]);

const normalizeCountry = (country?: string | null) => country?.trim().toLowerCase() ?? "";

const shouldHideCompany = (country?: string | null) =>
  BLOCKED_COUNTRIES.has(normalizeCountry(country));

const formatTag = (value: CompanyRow["type"]): string => {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getCompanyRegistrationNumber = (company: CompanyRow): string => {
  const taxIdNumericPart = company.taxId?.replace(/\D/g, "") ?? "";

  if (taxIdNumericPart.length > 0) {
    const suffix = taxIdNumericPart.slice(-4);
    return `REG-${suffix.padStart(4, "0")}`;
  }

  const idSuffix = (company.id.split("-").pop() ?? company.id).replace(/\D/g, "");
  const fallback = idSuffix.slice(-4);
  return `REG-${fallback.padStart(4, "0")}`;
};

const companySearch = (company: CompanyRow) =>
  [
    company.name,
    company.email ?? "",
    company.phone ?? "",
    company.taxId,
    getCompanyRegistrationNumber(company),
    company.primaryContactName ?? "",
    company.primaryContactEmail ?? "",
    company.primaryContactPhone ?? "",
    company.country,
    company.type
  ]
    .join(" ")
    .toLowerCase();

const QUICK_FILTERS = [
  { id: "all", label: "All records", query: "" },
  { id: "customer", label: "Customers", query: "customer" },
  { id: "partner", label: "Partners", query: "partner" },
  { id: "vendor", label: "Vendors", query: "vendor" }
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

interface CompaniesDataTableProps {
  data: CompanyRow[];
  showCreateActionInToolbar?: boolean;
}

export type CompaniesDataTableHandle = {
  openCreateDialog: () => void;
};

const CompaniesDataTable = React.forwardRef<CompaniesDataTableHandle, CompaniesDataTableProps>(
  ({ data, showCreateActionInToolbar = true }, ref) => {
    const { toast } = useToast();
    const formId = React.useId();
    const [rows, setRows] = React.useState<CompanyRow[]>(data);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [activeQuickFilter, setActiveQuickFilter] = React.useState<string>("all");
    const [activeCompany, setActiveCompany] = React.useState<CompanyRow | null>(null);
    const [companyDetails, setCompanyDetails] = React.useState<{
      addresses: CompanyAddress[];
      contacts: Array<{
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        title?: string | null;
      }>;
      executives: CompanyExecutive[];
      milestones: CompanyMilestone[];
    } | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
    const [editingCompany, setEditingCompany] = React.useState<CompanyRow | null>(null);
    const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [companyToDelete, setCompanyToDelete] = React.useState<CompanyRow | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
      setRows(data);
    }, [data]);

    const form = useForm<CompanyFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: DEFAULT_FORM_VALUES
    });

    const activeCompanyId = activeCompany?.id;

    React.useEffect(() => {
      if (!activeCompanyId) {
        return;
      }

      const updated = rows.find((row) => row.id === activeCompanyId);

      if (updated) {
        setActiveCompany(updated);
      }
    }, [rows, activeCompanyId]);

    const openSidebar = React.useCallback(
      (company: CompanyRow) => {
        setActiveCompany(company);
        setCompanyDetails(null);
        setIsLoadingDetails(true);

        // Load company details
        ensureResponse(
          fetch(getApiUrl(`accounts/${company.id}`), {
            cache: "no-store",
            headers: {
              Accept: "application/json"
            }
          })
        )
          .then((response) => response.json())
          .then(
            (data: {
              account: Account;
              addresses: CompanyAddress[];
              contacts: Array<{
                id: string;
                name: string;
                fullName?: string | null;
                email?: string | null;
                phone?: string | null;
                title?: string | null;
              }>;
              executives: CompanyExecutive[];
              milestones: CompanyMilestone[];
            }) => {
              setCompanyDetails({
                addresses: data.addresses,
                contacts: data.contacts.map((c) => ({
                  id: c.id,
                  name: c.fullName ?? c.name,
                  email: c.email,
                  phone: c.phone,
                  title: c.title
                })),
                executives: data.executives,
                milestones: data.milestones
              });
            }
          )
          .catch((error) => {
            toast({
              variant: "destructive",
              title: "Failed to load details",
              description:
                error instanceof Error ? error.message : "Unable to load company details."
            });
          })
          .finally(() => {
            setIsLoadingDetails(false);
          });
      },
      [toast]
    );

    // Auto-open company from URL parameter
    React.useEffect(() => {
      if (typeof window === "undefined" || rows.length === 0) {
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const companyName = searchParams.get("company");

      if (companyName && !activeCompany) {
        const company = rows.find((row) =>
          row.name.toLowerCase().includes(companyName.toLowerCase())
        );

        if (company) {
          openSidebar(company);
          // Clean up URL parameter
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("company");
          window.history.replaceState({}, "", newUrl.toString());
        }
      }
    }, [rows, activeCompany, openSidebar]);

    const closeSidebar = React.useCallback(() => {
      setActiveCompany(null);
      setCompanyDetails(null);
    }, []);

    const handleView = React.useCallback(
      (company: CompanyRow) => {
        const latest = rows.find((row) => row.id === company.id) ?? company;
        openSidebar(latest);
      },
      [openSidebar, rows]
    );

    const handleEdit = React.useCallback(
      (company: CompanyRow) => {
        setEditingCompany(company);
        setDialogMode("edit");
        form.reset({
          name: company.name ?? "",
          email: company.email ?? "",
          billingEmail: "",
          phone: company.phone ?? "",
          website: company.website ?? "",
          contactPerson: "",
          type: company.type ?? ACCOUNT_TAG_OPTIONS[0],
          taxId: company.taxId ?? "",
          country: company.country ?? ""
        });
        setIsDialogOpen(true);
      },
      [form]
    );

    const handleDelete = React.useCallback((company: CompanyRow) => {
      setCompanyToDelete(company);
      setIsDeleteDialogOpen(true);
    }, []);

    const openCreateDialog = React.useCallback(() => {
      setDialogMode("create");
      setEditingCompany(null);
      form.reset({ ...DEFAULT_FORM_VALUES });
      setIsDialogOpen(true);
    }, [form]);

    const toCompanyRow = React.useCallback(
      (account: Account, fallback?: CompanyRow | null): CompanyRow => ({
        ...account,
        primaryContactName: fallback?.primaryContactName ?? null,
        primaryContactEmail: fallback?.primaryContactEmail ?? null,
        primaryContactPhone: fallback?.primaryContactPhone ?? null,
        contacts: fallback?.contacts ?? []
      }),
      []
    );

    const handleDialogSubmit = form.handleSubmit(async (values) => {
      if (dialogMode === "edit" && !editingCompany) {
        toast({
          variant: "destructive",
          title: "Unable to save",
          description: "No company is selected for editing."
        });
        return;
      }

      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() ? values.phone.trim() : undefined,
        website: values.website?.trim() ? values.website.trim() : undefined,
        type: values.type,
        taxId: values.taxId.trim(),
        country: values.country.trim().toUpperCase()
      };

      setIsSubmitting(true);
      try {
        const endpoint =
          dialogMode === "create"
            ? getApiUrl("accounts")
            : getApiUrl(`accounts/${editingCompany?.id ?? ""}`);

        const response = await ensureResponse(
          fetch(endpoint, {
            method: dialogMode === "create" ? "POST" : "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          })
        );

        const result = (await response.json()) as Account;
        const hidden = shouldHideCompany(result.country);

        if (hidden) {
          setRows((previous) => previous.filter((row) => row.id !== result.id));
          if (activeCompany?.id === result.id) {
            closeSidebar();
          }
          toast({
            title: "Company saved",
            description: `${result.name} is hidden because Netherlands-based accounts are filtered out.`
          });
        } else if (dialogMode === "create") {
          const formatted = toCompanyRow(result, null);
          setRows((previous) => [formatted, ...previous]);
          toast({
            title: "Company created",
            description: `${result.name} has been added.`
          });
        } else {
          setRows((previous) =>
            previous.map((row) => {
              if (row.id !== result.id) {
                return row;
              }
              return toCompanyRow(result, row);
            })
          );
          toast({
            title: "Company updated",
            description: `${result.name} has been updated.`
          });
        }

        setIsDialogOpen(false);
        setEditingCompany(null);
        setDialogMode("create");
        form.reset({ ...DEFAULT_FORM_VALUES });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to save company.";
        toast({
          variant: "destructive",
          title: "Failed to save",
          description: message
        });
      } finally {
        setIsSubmitting(false);
      }
    });

    const handleDeleteConfirm = React.useCallback(async () => {
      if (!companyToDelete) {
        return;
      }

      setIsDeleting(true);
      try {
        await ensureResponse(
          fetch(getApiUrl(`accounts/${companyToDelete.id}`), {
            method: "DELETE",
            headers: {
              Accept: "application/json"
            }
          })
        );

        setRows((previous) => previous.filter((row) => row.id !== companyToDelete.id));
        if (activeCompany?.id === companyToDelete.id) {
          closeSidebar();
        }
        toast({
          title: "Company deleted",
          description: `${companyToDelete.name} has been removed.`
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to delete company.";
        toast({
          variant: "destructive",
          title: "Failed to delete",
          description: message
        });
      } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setCompanyToDelete(null);
      }
    }, [activeCompany?.id, closeSidebar, companyToDelete, toast]);

    const columns = React.useMemo<ColumnDef<CompanyRow>[]>(() => {
      const renderSortableHeader = (
        column: HeaderContext<CompanyRow, unknown>["column"],
        label: string
      ) => (
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between px-2 text-left font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {label}
          <SortIcon direction={column.getIsSorted()} />
        </Button>
      );

      return [
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
              aria-label="Select all companies"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
              aria-label={`Select company ${row.original.name}`}
            />
          ),
          enableSorting: false,
          enableHiding: false
        },
        {
          accessorKey: "name",
          header: ({ column }) => renderSortableHeader(column, "Company"),
          cell: ({ row }) => {
            const company = row.original;

            return (
              <div className="flex items-start gap-3">
                <div className="bg-muted hidden h-10 w-10 shrink-0 items-center justify-center rounded-full sm:flex">
                  <Building2 className="text-muted-foreground h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="space-y-1">
                    <span className="text-foreground block text-sm leading-tight font-semibold sm:text-sm">
                      {company.name}
                    </span>
                    {company.primaryContactName && (
                      <span className="text-muted-foreground block truncate text-xs sm:text-sm">
                        {company.primaryContactName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        },
        {
          accessorKey: "email",
          header: ({ column }) => renderSortableHeader(column, "Email"),
          cell: ({ row }) => {
            const email = row.original.email;
            return email ? (
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <a href={`mailto:${email}`} className="text-primary font-medium hover:underline">
                  {email}
                </a>
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            );
          }
        },
        {
          accessorKey: "phone",
          header: ({ column }) => renderSortableHeader(column, "Phone"),
          cell: ({ row }) => {
            const phone = row.original.phone;
            return phone ? (
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4" />
                <a href={`tel:${phone}`} className="hover:underline">
                  {phone}
                </a>
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            );
          }
        },
        {
          id: "companyId",
          accessorFn: (row) => getCompanyRegistrationNumber(row as CompanyRow),
          header: ({ column }) => renderSortableHeader(column, "Company ID"),
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <ReceiptIcon className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">{getCompanyRegistrationNumber(row.original)}</span>
            </div>
          )
        },
        {
          accessorKey: "taxId",
          header: ({ column }) => renderSortableHeader(column, "Tax ID"),
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <ReceiptIcon className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">{row.original.taxId}</span>
            </div>
          )
        },
        {
          accessorKey: "createdAt",
          header: ({ column }) => renderSortableHeader(column, "Created"),
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <CalendarClock className="text-muted-foreground h-4 w-4" />
              <span>{dateFormatter.format(new Date(row.original.createdAt))}</span>
            </div>
          )
        },
        {
          accessorKey: "type",
          header: ({ column }) => renderSortableHeader(column, "Tag"),
          cell: ({ row }) => (
            <Badge variant="outline" className="capitalize">
              {formatTag(row.original.type)}
            </Badge>
          )
        },
        {
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          cell: ({ row }) => {
            const company = row.original;

            return (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleView(company)}
                  aria-label="View">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(company)}
                  aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(company)}
                  aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          },
          enableSorting: false,
          enableHiding: false
        }
      ];
    }, [handleDelete, handleEdit, handleView]);

    const table = useReactTable({
      data: rows,
      columns,
      state: {
        sorting,
        columnVisibility,
        rowSelection,
        globalFilter
      },
      onSortingChange: setSorting,
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: setRowSelection,
      onGlobalFilterChange: setGlobalFilter,
      globalFilterFn: (row, _columnId, filterValue) => {
        if (!filterValue) {
          return true;
        }

        return companySearch(row.original).includes(String(filterValue).toLowerCase());
      },
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
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
          ? "1 company selected"
          : `${numberFormatter.format(selectionCount)} companies selected`
        : filteredRowCount === 0
          ? "Showing 0-0 of 0 companies"
          : `Showing ${numberFormatter.format(pageStart)}-${numberFormatter.format(pageEnd)} of ${numberFormatter.format(filteredRowCount)} companies`;

    const handleQuickFilter = (filterId: string, query: string) => {
      setActiveQuickFilter(filterId);
      setGlobalFilter(query);
    };

    const hasToolbarFilters = globalFilter.trim().length > 0 || activeQuickFilter !== "all";

    const handleResetToolbar = () => {
      setGlobalFilter("");
      setActiveQuickFilter("all");
    };

    let ellipsisCounter = 0;

    React.useImperativeHandle(
      ref,
      () => ({
        openCreateDialog
      }),
      [openCreateDialog]
    );

    return (
      <>
        <div className="space-y-6">
          <TableToolbar
            search={{
              value: globalFilter,
              onChange: (value) => {
                setGlobalFilter(value);
                setActiveQuickFilter(value.trim() === "" ? "all" : "custom");
              },
              placeholder: "Search companies by name, email, or country",
              ariaLabel: "Search companies"
            }}
            filters={
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
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
            }
            reset={{
              onReset: handleResetToolbar,
              disabled: !hasToolbarFilters
            }}
            actions={
              showCreateActionInToolbar ? (
                <Button className="w-full md:order-2 md:w-auto" onClick={openCreateDialog}>
                  Add New Company
                </Button>
              ) : null
            }
          />

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
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={(e) => {
                        // Don't open if clicking on action buttons or checkbox
                        const target = e.target as HTMLElement;
                        if (
                          target.closest("button") ||
                          target.closest("input[type='checkbox']") ||
                          target.closest("a")
                        ) {
                          return;
                        }
                        handleView(row.original);
                      }}>
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
                          <EmptyTitle>No companies</EmptyTitle>
                          <EmptyDescription>
                            Create a new company or re-run the seed command to restore demo data.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <p className="text-muted-foreground text-sm">
                            No records match the current filters.
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
                  <SelectTrigger className="h-8 w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={String(pageSize)}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-8"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}>
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {paginationItems.map((item, index) =>
                    item === "ellipsis" ? (
                      <span key={`ellipsis-${index}-${ellipsisCounter++}`} className="px-2">
                        …
                      </span>
                    ) : (
                      <Button
                        key={item}
                        size="sm"
                        variant={pagination.pageIndex === item ? "default" : "ghost"}
                        className="h-8 w-8"
                        onClick={() => table.setPageIndex(item)}>
                        {item + 1}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  className="h-8"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Sheet
          open={Boolean(activeCompany)}
          onOpenChange={(open) => (open ? null : closeSidebar())}>
          <SheetContent className="flex h-full flex-col sm:max-w-2xl">
            {activeCompany && (
              <>
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-foreground text-2xl font-bold">
                    Company Details
                  </SheetTitle>
                  <SheetDescription>
                    Review contact information, registration data, and metadata for the selected
                    company.
                  </SheetDescription>
                </SheetHeader>

                {isLoadingDetails ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ScrollArea className="flex-1 pr-6">
                    <div className="space-y-6 pb-6">
                      {/* Hero Section */}
                      <Card className="overflow-hidden border-2 p-6 transition-all hover:shadow-lg">
                        <div className="flex items-start gap-4">
                          <div className="bg-primary/10 flex h-16 w-16 shrink-0 items-center justify-center rounded-lg">
                            <Building2 className="text-primary h-8 w-8" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h2 className="text-foreground text-2xl font-bold">
                                {activeCompany.name}
                              </h2>
                              <Badge variant="secondary" className="capitalize">
                                {formatTag(activeCompany.type)}
                              </Badge>
                            </div>
                            {activeCompany.legalName && (
                              <p className="text-muted-foreground text-sm">
                                Legal name: {activeCompany.legalName}
                              </p>
                            )}
                            {activeCompany.description && (
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {activeCompany.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>

                      {/* Contact Information Section */}
                      <Card className="p-6 transition-all hover:shadow-md">
                        <div className="mb-4 flex items-center gap-2">
                          <Mail className="text-primary h-5 w-5" />
                          <h3 className="text-foreground text-lg font-semibold">
                            Contact Information
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            {activeCompany.email && (
                              <div className="flex items-start gap-3">
                                <Mail className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <Label className="text-muted-foreground text-xs">Email</Label>
                                  <a
                                    href={`mailto:${activeCompany.email}`}
                                    className="text-primary block truncate text-sm font-medium transition-colors hover:underline">
                                    {activeCompany.email}
                                  </a>
                                </div>
                              </div>
                            )}
                            {activeCompany.phone && (
                              <div className="flex items-start gap-3">
                                <Phone className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <Label className="text-muted-foreground text-xs">Phone</Label>
                                  <a
                                    href={`tel:${activeCompany.phone}`}
                                    className="text-primary block truncate text-sm font-medium transition-colors hover:underline">
                                    {activeCompany.phone}
                                  </a>
                                </div>
                              </div>
                            )}
                            {activeCompany.website && (
                              <div className="flex items-start gap-3">
                                <Globe className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <Label className="text-muted-foreground text-xs">Website</Label>
                                  <a
                                    href={
                                      activeCompany.website.startsWith("http")
                                        ? activeCompany.website
                                        : `https://${activeCompany.website}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary block truncate text-sm font-medium transition-colors hover:underline">
                                    {activeCompany.website}
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Social Media Links */}
                          {activeCompany.socialMediaLinks && (
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-xs">Social Media</Label>
                              <div className="flex flex-wrap gap-2">
                                {activeCompany.socialMediaLinks.linkedin && (
                                  <a
                                    href={activeCompany.socialMediaLinks.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900">
                                    <Linkedin className="h-3.5 w-3.5" />
                                    LinkedIn
                                  </a>
                                )}
                                {activeCompany.socialMediaLinks.facebook && (
                                  <a
                                    href={activeCompany.socialMediaLinks.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900">
                                    <Facebook className="h-3.5 w-3.5" />
                                    Facebook
                                  </a>
                                )}
                                {activeCompany.socialMediaLinks.twitter && (
                                  <a
                                    href={activeCompany.socialMediaLinks.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-md bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:hover:bg-sky-900">
                                    <Twitter className="h-3.5 w-3.5" />
                                    Twitter
                                  </a>
                                )}
                                {activeCompany.socialMediaLinks.instagram && (
                                  <a
                                    href={activeCompany.socialMediaLinks.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-md bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700 transition-colors hover:bg-pink-100 dark:bg-pink-950 dark:text-pink-300 dark:hover:bg-pink-900">
                                    <Instagram className="h-3.5 w-3.5" />
                                    Instagram
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Addresses */}
                          {companyDetails?.addresses && companyDetails.addresses.length > 0 && (
                            <div className="space-y-3">
                              <Label className="text-muted-foreground text-xs">Addresses</Label>
                              {companyDetails.addresses.map((address) => (
                                <div
                                  key={address.id}
                                  className="border-border rounded-lg border p-3">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                    <div className="min-w-0 flex-1 space-y-1">
                                      {address.label && (
                                        <Badge variant="outline" className="text-xs">
                                          {address.label}
                                        </Badge>
                                      )}
                                      <div className="text-foreground text-sm">
                                        {address.street && <div>{address.street}</div>}
                                        <div>
                                          {address.city}
                                          {address.state && `, ${address.state}`}
                                          {address.postalCode && ` ${address.postalCode}`}
                                        </div>
                                        {address.country && <div>{address.country}</div>}
                                      </div>
                                      {/* Map Placeholder */}
                                      {address.latitude && address.longitude && (
                                        <div className="bg-muted mt-2 h-32 w-full rounded-md border">
                                          <div className="flex h-full items-center justify-center">
                                            <div className="text-center">
                                              <MapPin className="text-muted-foreground mx-auto mb-1 h-6 w-6" />
                                              <p className="text-muted-foreground text-xs">
                                                Map placeholder
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Registration Data Section */}
                      <Card className="p-6 transition-all hover:shadow-md">
                        <div className="mb-4 flex items-center gap-2">
                          <FileText className="text-primary h-5 w-5" />
                          <h3 className="text-foreground text-lg font-semibold">
                            Registration Data
                          </h3>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">
                              Registration Number
                            </Label>
                            <p className="text-foreground text-sm font-medium">
                              {activeCompany.registrationNumber ||
                                getCompanyRegistrationNumber(activeCompany)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">Tax ID</Label>
                            <p className="text-foreground text-sm font-medium">
                              {activeCompany.taxId}
                            </p>
                          </div>
                          {activeCompany.dateOfIncorporation && (
                            <div className="space-y-1">
                              <Label className="text-muted-foreground text-xs">
                                Date of Incorporation
                              </Label>
                              <p className="text-foreground text-sm font-medium">
                                {dateFormatter.format(new Date(activeCompany.dateOfIncorporation))}
                              </p>
                            </div>
                          )}
                          <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">Country</Label>
                            <p className="text-foreground text-sm font-medium uppercase">
                              {activeCompany.country}
                            </p>
                          </div>
                          {activeCompany.legalStatus && (
                            <div className="space-y-1">
                              <Label className="text-muted-foreground text-xs">Legal Status</Label>
                              <p className="text-foreground text-sm font-medium">
                                {activeCompany.legalStatus}
                              </p>
                            </div>
                          )}
                          {activeCompany.companyType && (
                            <div className="space-y-1">
                              <Label className="text-muted-foreground text-xs">Company Type</Label>
                              <p className="text-foreground text-sm font-medium">
                                {activeCompany.companyType}
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Business Registration Documents Placeholder */}
                        <div className="mt-4 rounded-lg border border-dashed p-4 text-center">
                          <FileText className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                          <p className="text-muted-foreground text-xs">
                            Business registration documents
                          </p>
                        </div>
                      </Card>

                      {/* Metadata Section */}
                      <Card className="p-6 transition-all hover:shadow-md">
                        <div className="mb-4 flex items-center gap-2">
                          <Briefcase className="text-primary h-5 w-5" />
                          <h3 className="text-foreground text-lg font-semibold">Metadata</h3>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          {activeCompany.industry && (
                            <div className="space-y-1">
                              <Label className="text-muted-foreground text-xs">Industry</Label>
                              <p className="text-foreground text-sm font-medium">
                                {activeCompany.industry}
                              </p>
                            </div>
                          )}
                          {activeCompany.numberOfEmployees !== null &&
                            activeCompany.numberOfEmployees !== undefined && (
                              <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">
                                  Number of Employees
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Users className="text-muted-foreground h-4 w-4" />
                                  <p className="text-foreground text-sm font-medium">
                                    {activeCompany.numberOfEmployees.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                          {activeCompany.annualRevenueRange && (
                            <div className="space-y-1">
                              <Label className="text-muted-foreground text-xs">
                                Annual Revenue Range
                              </Label>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="text-muted-foreground h-4 w-4" />
                                <p className="text-foreground text-sm font-medium">
                                  {activeCompany.annualRevenueRange}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">Created</Label>
                            <div className="flex items-center gap-2">
                              <CalendarClock className="text-muted-foreground h-4 w-4" />
                              <p className="text-foreground text-sm font-medium">
                                {dateFormatter.format(new Date(activeCompany.createdAt))}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">Last Updated</Label>
                            <div className="flex items-center gap-2">
                              <Clock className="text-muted-foreground h-4 w-4" />
                              <p className="text-foreground text-sm font-medium">
                                {dateFormatter.format(
                                  new Date(activeCompany.updatedAt || activeCompany.createdAt)
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Key Executives */}
                        {companyDetails?.executives && companyDetails.executives.length > 0 && (
                          <div className="mt-6 space-y-3">
                            <Label className="text-muted-foreground text-xs">Key Executives</Label>
                            <div className="space-y-2">
                              {companyDetails.executives.map((exec) => (
                                <div key={exec.id} className="border-border rounded-lg border p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-foreground text-sm font-medium">
                                        {exec.name}
                                      </p>
                                      {exec.title && (
                                        <p className="text-muted-foreground text-xs">
                                          {exec.title}
                                        </p>
                                      )}
                                      <div className="mt-1 flex flex-wrap gap-3">
                                        {exec.email && (
                                          <a
                                            href={`mailto:${exec.email}`}
                                            className="text-primary text-xs transition-colors hover:underline">
                                            {exec.email}
                                          </a>
                                        )}
                                        {exec.phone && (
                                          <a
                                            href={`tel:${exec.phone}`}
                                            className="text-primary text-xs transition-colors hover:underline">
                                            {exec.phone}
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Company Milestones */}
                        {companyDetails?.milestones && companyDetails.milestones.length > 0 && (
                          <div className="mt-6 space-y-3">
                            <Label className="text-muted-foreground text-xs">
                              Company Milestones
                            </Label>
                            <div className="relative space-y-4 pl-4">
                              {companyDetails.milestones.map((milestone, index) => (
                                <div key={milestone.id} className="relative">
                                  {index < companyDetails.milestones.length - 1 && (
                                    <div className="bg-border absolute top-6 -left-4 h-full w-0.5" />
                                  )}
                                  <div className="bg-primary border-background absolute top-1.5 -left-6 h-3 w-3 rounded-full border-2" />
                                  <div className="border-border bg-card rounded-lg border p-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-foreground text-sm font-medium">
                                          {milestone.title}
                                        </p>
                                        {milestone.description && (
                                          <p className="text-muted-foreground mt-1 text-xs">
                                            {milestone.description}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex shrink-0 items-center gap-2">
                                        <CalendarClock className="text-muted-foreground h-3.5 w-3.5" />
                                        <span className="text-muted-foreground text-xs">
                                          {dateFormatter.format(new Date(milestone.date))}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>
                  </ScrollArea>
                )}

                <SheetFooter className="border-t pt-4">
                  <Button variant="outline" className="w-full" onClick={closeSidebar}>
                    Close
                  </Button>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>

        <Sheet
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingCompany(null);
              setDialogMode("create");
              form.reset({ ...DEFAULT_FORM_VALUES });
            }
          }}>
          <SheetContent className="flex h-full flex-col gap-0 p-0 sm:max-w-lg">
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle className="text-lg font-semibold">
                {dialogMode === "create" ? "Create Customer" : "Edit Customer"}
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1 px-6">
              <Form {...form}>
                <form
                  id={formId}
                  onSubmit={handleDialogSubmit}
                  className="space-y-4"
                  aria-live="polite">
                  <Accordion type="single" collapsible defaultValue="general" className="w-full">
                    <AccordionItem value="general" className="border-none">
                      <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline">
                        General
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-2.5">
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-sm">Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Acme Inc"
                                    autoFocus
                                    className="h-9"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-sm">Email</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    placeholder="acme@example.com"
                                    className="h-9"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="billingEmail"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-sm">Billing Email</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    placeholder="finance@example.com"
                                    className="h-9"
                                  />
                                </FormControl>
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                  This is an additional email that will be used to send invoices to.
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-sm">Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="+1 (555) 123-4567"
                                    inputMode="tel"
                                    className="h-9"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-sm">Website</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="url"
                                    placeholder="acme.com"
                                    className="h-9"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="contactPerson"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-sm">Contact person</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="John Doe" className="h-9" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="details" className="border-none">
                      <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline">
                        Details
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-2.5">
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-sm">Tag</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {ACCOUNT_TAG_OPTIONS.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {formatTag(option)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="taxId"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-sm">Tax ID</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="RS123456789" className="h-9" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-sm">Country (ISO)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="RS"
                                    maxLength={3}
                                    className="h-9"
                                    onChange={(event) =>
                                      field.onChange(event.target.value.toUpperCase())
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </form>
              </Form>
            </ScrollArea>

            <SheetFooter className="flex flex-col gap-2 border-t px-6 pt-3 pb-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingCompany(null);
                  setDialogMode("create");
                  form.reset({ ...DEFAULT_FORM_VALUES });
                }}
                className="h-9 w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                form={formId}
                className="h-9 w-full sm:w-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : dialogMode === "create" ? (
                  "Create"
                ) : (
                  "Save changes"
                )}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open && !isDeleting) {
              setCompanyToDelete(null);
            }
          }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete company</AlertDialogTitle>
              <AlertDialogDescription>
                {companyToDelete
                  ? `This will permanently remove ${companyToDelete.name} and its related records.`
                  : "This will permanently remove the selected company."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={isDeleting} onClick={handleDeleteConfirm}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);

CompaniesDataTable.displayName = "CompaniesDataTable";

export default CompaniesDataTable;
type CompanyAddress = {
  id: string;
  accountId: string;
  label: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  createdAt: string;
};
type CompanyExecutive = {
  id: string;
  accountId: string;
  name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
};
type CompanyMilestone = {
  id: string;
  accountId: string;
  title: string;
  description?: string | null;
  date: string;
  createdAt: string;
};
