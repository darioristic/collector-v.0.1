"use client";

import type { Account, AccountAddress, AccountExecutive, AccountMilestone } from "@crm/types";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SortingState, VisibilityState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import CompanyDrawer from "@/components/company/company-drawer";
import { TableToolbar } from "@/components/table-toolbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
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
import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { createColumns } from "./components/columns";
import { MemoizedTableRow } from "./components/memoized-table-row";
import {
  getDefaultFormValues,
  getFormValuesFromCompany,
  useCompanyDialog
} from "./hooks/use-company-dialog";
import { useDebounce } from "./hooks/use-debounce";
import { useURLParams } from "./hooks/use-url-params";
import {
  type EnhancedCompanyRow,
  enhanceCompanyRow,
  enhanceCompanyRows,
  formatTag,
  shouldHideCompany
} from "./utils/company-helpers";

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
  country: z
    .string()
    .trim()
    .length(2, "Country code must be exactly 2 characters (ISO 3166-1 alpha-2).")
});

type CompanyFormValues = z.infer<typeof formSchema>;

// Helper funkcije su izdvojene u utils/company-helpers.ts

const QUICK_FILTERS = [
  { id: "all", label: "All records", query: "" },
  { id: "customer", label: "Customers", query: "customer" },
  { id: "partner", label: "Partners", query: "partner" },
  { id: "vendor", label: "Vendors", query: "vendor" }
] as const;

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
    // Memoize enhanced rows to avoid unnecessary recalculations
    const [rows, setRows] = React.useState<EnhancedCompanyRow[]>(() => enhanceCompanyRows(data));

    // Update rows when data changes
    React.useEffect(() => {
      setRows(enhanceCompanyRows(data));
    }, [data]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [globalFilter, setGlobalFilter] = React.useState("");
    const debouncedFilter = useDebounce(globalFilter, 300);
    const [activeQuickFilter, setActiveQuickFilter] = React.useState<string>("all");
    const [activeCompany, setActiveCompany] = React.useState<EnhancedCompanyRow | null>(null);
    const [companyDetails, setCompanyDetails] = React.useState<{
      addresses: AccountAddress[];
      contacts: Array<{
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        title?: string | null;
      }>;
      executives: AccountExecutive[];
      milestones: AccountMilestone[];
    } | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
    const dialog = useCompanyDialog();
    const urlParams = useURLParams();
    const [companyToDelete, setCompanyToDelete] = React.useState<EnhancedCompanyRow | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const form = useForm<CompanyFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: getDefaultFormValues()
    });

    const activeCompanyId = activeCompany?.id;

    // Memoize rows lookup map for O(1) access instead of O(n) find
    const rowsMap = React.useMemo(() => {
      const map = new Map<string, EnhancedCompanyRow>();
      for (const row of rows) {
        map.set(row.id, row);
      }
      return map;
    }, [rows]);

    React.useEffect(() => {
      if (!activeCompanyId) {
        return;
      }

      const updated = rowsMap.get(activeCompanyId);
      if (updated) {
        setActiveCompany(updated);
      }
    }, [rowsMap, activeCompanyId]);

    const openSidebar = React.useCallback(
      (company: EnhancedCompanyRow) => {
        // Abort previous request if it exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        setActiveCompany(company);
        setCompanyDetails(null);
        setIsLoadingDetails(true);

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // Load company details
        ensureResponse(
          fetch(getApiUrl(`accounts/${company.id}`), {
            cache: "no-store",
            headers: {
              Accept: "application/json"
            },
            signal: abortController.signal
          })
        )
          .then((response) => response.json())
          .then(
            (data: {
              account: Account;
              addresses: AccountAddress[];
              contacts: Array<{
                id: string;
                name: string;
                fullName?: string | null;
                email?: string | null;
                phone?: string | null;
                title?: string | null;
              }>;
              executives: AccountExecutive[];
              milestones: AccountMilestone[];
            }) => {
              if (!abortController.signal.aborted) {
                // Optimize contact mapping by avoiding unnecessary operations
                const mappedContacts = data.contacts.map((c) => ({
                  id: c.id,
                  name: c.fullName ?? c.name,
                  email: c.email,
                  phone: c.phone,
                  title: c.title
                }));
                setCompanyDetails({
                  addresses: data.addresses,
                  contacts: mappedContacts,
                  executives: data.executives,
                  milestones: data.milestones
                });
              }
            }
          )
          .catch((error) => {
            if (error instanceof Error && error.name === "AbortError") {
              return;
            }
            if (!abortController.signal.aborted) {
              toast({
                variant: "destructive",
                title: "Failed to load details",
                description:
                  error instanceof Error ? error.message : "Unable to load company details."
              });
            }
          })
          .finally(() => {
            if (!abortController.signal.aborted) {
              setIsLoadingDetails(false);
            }
            if (abortControllerRef.current === abortController) {
              abortControllerRef.current = null;
            }
          });
      },
      [toast]
    );

    // Auto-open company from URL parameter or create dialog
    React.useEffect(() => {
      if (!urlParams.params) {
        return;
      }

      const companyName = urlParams.getParam("company");
      const createParam = urlParams.getParam("create");
      const nameParam = urlParams.getParam("name");

      // If create=true and name is provided, open create dialog with pre-filled name
      if (createParam === "true" && nameParam && !dialog.isOpen) {
        dialog.openCreateDialog();
        form.reset({
          ...getDefaultFormValues(),
          name: nameParam
        });
        urlParams.removeParams(["create", "name"]);
        return;
      }

      // Existing logic for opening company sidebar (only if rows are loaded)
      // First try to find by ID (if companyName is an ID), otherwise search by name
      if (rows.length > 0 && companyName && !activeCompany) {
        let company: EnhancedCompanyRow | undefined;

        // Try ID lookup first (O(1))
        company = rowsMap.get(companyName);

        // If not found by ID, search by name (O(n) but only if needed)
        if (!company) {
          const searchLower = companyName.toLowerCase();
          company = rows.find((row) => row.name.toLowerCase().includes(searchLower));
        }

        if (company) {
          openSidebar(company);
          urlParams.removeParam("company");
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      // urlParams and dialog are stable objects from hooks, their methods are memoized
      // Including the full objects would cause unnecessary re-renders
    }, [
      rows,
      rowsMap,
      activeCompany,
      openSidebar,
      dialog.isOpen,
      dialog.openCreateDialog,
      form,
      urlParams.params,
      urlParams.getParam,
      urlParams.removeParam,
      urlParams.removeParams
    ]);

    const closeSidebar = React.useCallback(() => {
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setActiveCompany(null);
      setCompanyDetails(null);
    }, []);

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, []);

    const handleView = React.useCallback(
      (company: EnhancedCompanyRow) => {
        const latest = rowsMap.get(company.id) ?? company;
        openSidebar(latest);
      },
      [openSidebar, rowsMap]
    );

    const handleEdit = React.useCallback(
      (company: EnhancedCompanyRow) => {
        dialog.openEditDialog(company);
        form.reset(getFormValuesFromCompany(company));
      },
      [dialog, form]
    );

    const handleDelete = React.useCallback((company: EnhancedCompanyRow) => {
      setCompanyToDelete(company);
      setIsDeleteDialogOpen(true);
    }, []);

    const openCreateDialog = React.useCallback(() => {
      dialog.openCreateDialog();
      form.reset(getDefaultFormValues());
    }, [dialog, form]);

    const toCompanyRow = React.useCallback(
      (account: Account, fallback?: EnhancedCompanyRow | null): EnhancedCompanyRow => {
        const baseRow: CompanyRow = {
          ...account,
          primaryContactName: fallback?.primaryContactName ?? null,
          primaryContactEmail: fallback?.primaryContactEmail ?? null,
          primaryContactPhone: fallback?.primaryContactPhone ?? null,
          contacts: fallback?.contacts ?? []
        };
        return enhanceCompanyRow(baseRow);
      },
      []
    );

    const handleDialogSubmit = form.handleSubmit(async (values) => {
      if (dialog.mode === "edit" && !dialog.editingCompany) {
        toast({
          variant: "destructive",
          title: "Unable to save",
          description: "No company is selected for editing."
        });
        return;
      }

      // Optimize payload creation by trimming only when needed
      const trimmedName = values.name.trim();
      const trimmedEmail = values.email.trim();
      const trimmedPhone = values.phone?.trim();
      const trimmedWebsite = values.website?.trim();
      const trimmedTaxId = values.taxId.trim();
      const trimmedCountry = values.country.trim().toUpperCase().slice(0, 2);

      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone || undefined,
        website: trimmedWebsite || undefined,
        type: values.type,
        taxId: trimmedTaxId,
        country: trimmedCountry
      };

      dialog.setIsSubmitting(true);
      try {
        const endpoint =
          dialog.mode === "create"
            ? getApiUrl("accounts")
            : getApiUrl(`accounts/${dialog.editingCompany?.id ?? ""}`);

        const response = await ensureResponse(
          fetch(endpoint, {
            method: dialog.mode === "create" ? "POST" : "PUT",
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
        } else if (dialog.mode === "create") {
          const formatted = toCompanyRow(result, null);
          // Use functional update for better performance
          setRows((previous) => {
            // Early return if already exists (optimistic update check)
            if (previous.some((row) => row.id === result.id)) {
              return previous;
            }
            return [formatted, ...previous];
          });
          toast({
            title: "Company created",
            description: `${result.name} has been added.`
          });
        } else {
          // Optimize update by checking if row exists first
          setRows((previous) => {
            const existingIndex = previous.findIndex((row) => row.id === result.id);
            if (existingIndex === -1) {
              // Row doesn't exist, add it
              return [toCompanyRow(result, null), ...previous];
            }
            // Update existing row
            const updated = toCompanyRow(result, previous[existingIndex]);
            const newRows = [...previous];
            newRows[existingIndex] = updated;
            return newRows;
          });
          toast({
            title: "Company updated",
            description: `${result.name} has been updated.`
          });
        }

        dialog.closeDialog();
        form.reset(getDefaultFormValues());
      } catch (error) {
        // Extract error message from response if available
        let errorMessage = "Unable to save company.";
        let statusCode: number | undefined;

        if (error instanceof Error) {
          errorMessage = error.message;
          // Extract status code if available from ensureResponse
          if ("status" in error && typeof error.status === "number") {
            statusCode = error.status;
          }
        } else if (error && typeof error === "object" && "message" in error) {
          errorMessage = String(error.message);
          if ("statusCode" in error && typeof error.statusCode === "number") {
            statusCode = error.statusCode;
          }
        }

        // Determine error type based on status code and message
        const isConflict =
          statusCode === 409 ||
          errorMessage.toLowerCase().includes("already exists") ||
          errorMessage.toLowerCase().includes("conflict");
        const isValidation =
          statusCode === 400 ||
          errorMessage.toLowerCase().includes("validation") ||
          errorMessage.toLowerCase().includes("required") ||
          errorMessage.toLowerCase().includes("invalid") ||
          errorMessage.toLowerCase().includes("provide a valid");

        // Determine toast title based on error type
        let toastTitle = "Failed to save";
        if (isConflict) {
          toastTitle = "Company already exists";
        } else if (isValidation) {
          toastTitle = "Validation error";
        } else if (statusCode === 500) {
          toastTitle = "Server error";
        }

        toast({
          variant: "destructive",
          title: toastTitle,
          description: errorMessage
        });

        // Don't close dialog on error - user should be able to fix and retry
        // Keep dialog open so user can see validation errors or fix issues
        // Only reset form if it's a server error (500) or conflict after showing error
        if (statusCode === 500 || (isConflict && dialog.mode === "create")) {
          // For server errors or conflicts on create, keep dialog open but don't reset
          // User can modify the form and try again
        }
      } finally {
        dialog.setIsSubmitting(false);
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

        // Use functional update for better performance
        setRows((previous) => {
          const filtered = previous.filter((row) => row.id !== companyToDelete.id);
          // Only update if something actually changed
          return filtered.length !== previous.length ? filtered : previous;
        });
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

    const columns = React.useMemo(
      () => createColumns(handleView, handleEdit, handleDelete),
      [handleDelete, handleEdit, handleView]
    );

    // Memoize global filter function to avoid recreating on each render
    const globalFilterFn = React.useCallback(
      (row: { original: EnhancedCompanyRow }, _columnId: string, filterValue: unknown) => {
        if (!filterValue) {
          return true;
        }
        return row.original.searchableText.includes(String(filterValue).toLowerCase());
      },
      []
    );

    const table = useReactTable({
      data: rows,
      columns,
      state: {
        sorting,
        columnVisibility,
        rowSelection,
        globalFilter: debouncedFilter
      },
      onSortingChange: setSorting,
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: setRowSelection,
      onGlobalFilterChange: setGlobalFilter,
      globalFilterFn,
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

    // React Table already optimizes these calls internally
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
        return [] as Array<{
          type: "page" | "ellipsis";
          value: number;
          key: string;
        }>;
      }

      if (pageCount <= 7) {
        return Array.from({ length: pageCount }, (_value, index) => ({
          type: "page" as const,
          value: index,
          key: `page-${index}`
        }));
      }

      const items: Array<{
        type: "page" | "ellipsis";
        value: number;
        key: string;
      }> = [];
      const firstPage = 0;
      const lastPage = pageCount - 1;
      const siblingCount = 1;
      const current = pagination.pageIndex;
      const start = Math.max(firstPage + 1, current - siblingCount);
      const end = Math.min(lastPage - 1, current + siblingCount);

      items.push({ type: "page", value: firstPage, key: `page-${firstPage}` });

      if (start > firstPage + 1) {
        items.push({ type: "ellipsis", value: -1, key: "ellipsis-start" });
      }

      for (let index = start; index <= end; index += 1) {
        if (index > firstPage && index < lastPage) {
          items.push({ type: "page", value: index, key: `page-${index}` });
        }
      }

      if (end < lastPage - 1) {
        items.push({ type: "ellipsis", value: -1, key: "ellipsis-end" });
      }

      if (lastPage !== firstPage) {
        items.push({ type: "page", value: lastPage, key: `page-${lastPage}` });
      }

      return items;
    }, [pageCount, pagination.pageIndex]);

    // Memoize range label to avoid recalculating on each render
    const rangeLabel = React.useMemo(() => {
      if (selectionCount > 0) {
        return selectionCount === 1
          ? "1 company selected"
          : `${numberFormatter.format(selectionCount)} companies selected`;
      }
      if (filteredRowCount === 0) {
        return "Showing 0-0 of 0 companies";
      }
      return `Showing ${numberFormatter.format(pageStart)}-${numberFormatter.format(pageEnd)} of ${numberFormatter.format(filteredRowCount)} companies`;
    }, [selectionCount, filteredRowCount, pageStart, pageEnd, numberFormatter]);

    const handleQuickFilter = React.useCallback((filterId: string, query: string) => {
      setActiveQuickFilter(filterId);
      setGlobalFilter(query);
    }, []);

    const hasToolbarFilters = React.useMemo(
      () => globalFilter.trim().length > 0 || activeQuickFilter !== "all",
      [globalFilter, activeQuickFilter]
    );

    const handleResetToolbar = React.useCallback(() => {
      setGlobalFilter("");
      setActiveQuickFilter("all");
    }, []);

    // Memoize page size options
    const pageSizeOptions = React.useMemo(() => [10, 20, 30, 40, 50], []);

    // Memoize pagination handlers
    const handlePreviousPage = React.useCallback(() => {
      table.previousPage();
    }, [table]);

    const handleNextPage = React.useCallback(() => {
      table.nextPage();
    }, [table]);

    const handleSetPageIndex = React.useCallback(
      (index: number) => {
        table.setPageIndex(index);
      },
      [table]
    );

    const handleSetPageSize = React.useCallback(
      (value: string) => {
        table.setPageSize(Number(value));
      },
      [table]
    );

    // Memoize Sheet handlers
    const handleSheetOpenChange = React.useCallback(
      (open: boolean) => {
        dialog.setIsOpen(open);
        if (!open) {
          dialog.closeDialog();
          form.reset(getDefaultFormValues());
        }
      },
      [dialog, form]
    );

    const handleSheetCancel = React.useCallback(() => {
      dialog.closeDialog();
      form.reset(getDefaultFormValues());
    }, [dialog, form]);

    // Memoize AlertDialog handlers
    const handleDeleteDialogOpenChange = React.useCallback(
      (open: boolean) => {
        setIsDeleteDialogOpen(open);
        if (!open && !isDeleting) {
          setCompanyToDelete(null);
        }
      },
      [isDeleting]
    );

    // Memoize Sheet title
    const sheetTitle = React.useMemo(
      () => (dialog.mode === "create" ? "Create Customer" : "Edit Customer"),
      [dialog.mode]
    );

    // Memoize AlertDialog description
    const deleteDialogDescription = React.useMemo(() => {
      return companyToDelete
        ? `This will permanently remove ${companyToDelete.name} and its related records.`
        : "This will permanently remove the selected company.";
    }, [companyToDelete]);

    // Memoize search onChange handler to avoid recreating on each render
    const handleSearchChange = React.useCallback((value: string) => {
      setGlobalFilter(value);
      setActiveQuickFilter(value.trim() === "" ? "all" : "custom");
    }, []);

    // Memoize table row model and header groups
    // Note: React Table already optimizes these internally, but we memoize to avoid
    // unnecessary recalculations when table state changes
    const rowModel = table.getRowModel();
    const headerGroups = table.getHeaderGroups();
    const visibleColumns = React.useMemo(
      () => table.getAllLeafColumns().filter((column) => column.getCanHide()),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      // table object changes on every render, but columnVisibility is the actual dependency
      [columnVisibility]
    );

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
              onChange: handleSearchChange,
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
                    {visibleColumns.map((column) => (
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
                {headerGroups.map((headerGroup) => (
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
                {rowModel.rows.length ? (
                  rowModel.rows.map((row) => (
                    <MemoizedTableRow key={row.id} row={row} onRowClick={handleView} />
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
                <Select value={String(pagination.pageSize)} onValueChange={handleSetPageSize}>
                  <SelectTrigger className="h-8 w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((pageSize) => (
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
                  onClick={handlePreviousPage}
                  disabled={!table.getCanPreviousPage()}>
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {paginationItems.map((item) =>
                    item.type === "ellipsis" ? (
                      <span key={item.key} className="px-2">
                        …
                      </span>
                    ) : (
                      <Button
                        key={item.key}
                        size="sm"
                        variant={pagination.pageIndex === item.value ? "default" : "ghost"}
                        className="h-8 w-8"
                        onClick={() => handleSetPageIndex(item.value)}>
                        {item.value + 1}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  className="h-8"
                  onClick={handleNextPage}
                  disabled={!table.getCanNextPage()}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Memoize CompanyDrawer props to avoid unnecessary re-renders */}
        {React.useMemo(() => {
          const companyProps = activeCompany
            ? {
                id: activeCompany.id,
                name: activeCompany.name,
                email: activeCompany.email,
                phone: activeCompany.phone,
                website: activeCompany.website,
                legalName: activeCompany.legalName ?? null,
                description: activeCompany.description ?? null,
                type: activeCompany.type ?? null,
                taxId: activeCompany.taxId,
                country: activeCompany.country,
                industry: activeCompany.industry ?? null,
                numberOfEmployees: activeCompany.numberOfEmployees ?? null,
                annualRevenueRange: activeCompany.annualRevenueRange ?? null,
                createdAt: activeCompany.createdAt,
                updatedAt: activeCompany.updatedAt,
                socialMediaLinks: activeCompany.socialMediaLinks ?? null,
                registrationNumber: activeCompany.registrationNumber,
                dateOfIncorporation: activeCompany.dateOfIncorporation ?? null,
                legalStatus: activeCompany.legalStatus ?? null,
                companyType: activeCompany.companyType ?? null
              }
            : null;

          const detailsProps = companyDetails
            ? {
                addresses: companyDetails.addresses,
                executives: companyDetails.executives,
                milestones: companyDetails.milestones
              }
            : null;

          return (
            <CompanyDrawer
              open={Boolean(activeCompany)}
              onClose={closeSidebar}
              company={companyProps}
              details={detailsProps}
              isLoadingDetails={isLoadingDetails}
            />
          );
        }, [activeCompany, companyDetails, isLoadingDetails, closeSidebar])}

        <Sheet open={dialog.isOpen} onOpenChange={handleSheetOpenChange}>
          <SheetContent className="flex h-full flex-col gap-0 p-0 sm:max-w-lg">
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle className="text-lg font-semibold">{sheetTitle}</SheetTitle>
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
                                    maxLength={2}
                                    className="h-9"
                                    onChange={(event) =>
                                      field.onChange(event.target.value.toUpperCase().slice(0, 2))
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
                disabled={dialog.isSubmitting}
                onClick={handleSheetCancel}
                className="h-9 w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={dialog.isSubmitting}
                form={formId}
                className="h-9 w-full sm:w-auto">
                {dialog.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : dialog.mode === "create" ? (
                  "Create"
                ) : (
                  "Save changes"
                )}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete company</AlertDialogTitle>
              <AlertDialogDescription>{deleteDialogDescription}</AlertDialogDescription>
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
