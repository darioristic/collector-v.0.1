/** biome-ignore-all assist/source/organizeImports: Organizacija importa rušno konfigurisana */
"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Columns3,
  FileEdit,
  FileText,
  Plus,
  Send,
  Trash2,
  XCircle
} from "lucide-react";
import type { Account } from "@crm/types";
import type { QuoteSortField } from "@crm/types";
import { QUOTE_STATUSES } from "@crm/types";
import { TableToolbar } from "@/components/table-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
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
import { QuoteActions } from "@/components/quotes/quote-actions";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ensureResponse } from "@/src/lib/fetch-utils";
import { useDeleteQuote, useQuotes } from "@/src/hooks/useQuotes";

type StatusConfig = {
  variant: "warning" | "info" | "success" | "destructive";
  icon: React.ReactNode;
};

const statusConfig: Record<string, StatusConfig> = {
  draft: {
    variant: "warning",
    icon: <FileEdit className="size-3" />
  },
  sent: {
    variant: "info",
    icon: <Send className="size-3" />
  },
  accepted: {
    variant: "success",
    icon: <CheckCircle2 className="size-3" />
  },
  rejected: {
    variant: "destructive",
    icon: <XCircle className="size-3" />
  }
};

const SORT_OPTIONS: Array<{ value: QuoteSortField; label: string }> = [
  { value: "issueDate", label: "Issue date" },
  { value: "expiryDate", label: "Expiry date" },
  { value: "total", label: "Amount" },
  { value: "quoteNumber", label: "Quote #" },
  { value: "createdAt", label: "Created" }
];

const DEFAULT_SORT_FIELD: QuoteSortField = "createdAt";
const DEFAULT_SORT_ORDER: "asc" | "desc" = "desc";

type QuoteListProps = {
  companyId?: string;
  contactId?: string;
  onQuoteClick?: (quoteId: number) => void;
  onCreateQuote?: () => void;
  toolbarActions?: ReactNode | null;
  showCreateAction?: boolean;
};

export function QuoteList({
  companyId,
  contactId,
  onQuoteClick,
  onCreateQuote,
  toolbarActions: toolbarActionsProp,
  showCreateAction = true
}: QuoteListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [sortField, setSortField] = useState<QuoteSortField>(DEFAULT_SORT_FIELD);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(DEFAULT_SORT_ORDER);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [selectedQuotes, setSelectedQuotes] = useState<Set<number>>(new Set());

  const columnDefinitions = [
    { id: "index", label: "#", defaultVisible: true },
    { id: "quoteNumber", label: "Quote #", defaultVisible: true },
    { id: "client", label: "Client", defaultVisible: true },
    { id: "issueDate", label: "Issue Date", defaultVisible: true },
    { id: "expiryDate", label: "Expiry Date", defaultVisible: true },
    { id: "amount", label: "Amount", defaultVisible: true },
    { id: "status", label: "Status", defaultVisible: true }
  ] as const;

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columnDefinitions.map((col) => col.id))
  );

  const {
    data: quotesResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt
  } = useQuotes({
    companyId,
    contactId,
    status: statusFilter,
    search: search || undefined,
    limit,
    offset: page * limit,
    sortField,
    sortOrder
  });

  const quotes = quotesResponse?.data || [];
  const total = quotesResponse?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Učitaj company name za quotes koji imaju companyId ali nemaju companyName
  const quotesNeedingCompany = quotes.filter((q) => q.companyId && !q.companyName);
  const companyIds = Array.from(
    new Set(quotesNeedingCompany.map((q) => q.companyId).filter((id): id is string => Boolean(id)))
  );

  // Učitaj sve potrebne companies odjednom
  const { data: companiesData } = useQuery({
    queryKey: ["accounts", "batch", companyIds],
    queryFn: async () => {
      if (companyIds.length === 0) return {};
      const companies: Record<string, Account> = {};
      await Promise.all(
        companyIds.map(async (id) => {
          try {
            const response = await ensureResponse(
              fetch(`/api/accounts/${id}`, {
                cache: "no-store",
                headers: {
                  Accept: "application/json"
                }
              })
            );
            const account = (await response.json()) as Account;
            companies[id] = account;
          } catch (error) {
            console.error(`Failed to fetch account ${id}:`, error);
          }
        })
      );
      return companies;
    },
    enabled: companyIds.length > 0,
    staleTime: 1000 * 60 * 5
  });

  // Mapiraj quotes sa company name-ovima
  const quotesWithCompanyNames = quotes.map((quote) => {
    if (quote.companyName) return quote;
    if (quote.companyId && companiesData?.[quote.companyId]) {
      return {
        ...quote,
        companyName: companiesData[quote.companyId].name
      };
    }
    return quote;
  });

  const deleteQuote = useDeleteQuote();

  const allQuotesSelected = useMemo(() => {
    return (
      quotesWithCompanyNames.length > 0 &&
      quotesWithCompanyNames.every((quote) => selectedQuotes.has(quote.id))
    );
  }, [quotesWithCompanyNames, selectedQuotes]);

  const someQuotesSelected = useMemo(() => {
    return (
      selectedQuotes.size > 0 &&
      !quotesWithCompanyNames.every((quote) => selectedQuotes.has(quote.id))
    );
  }, [quotesWithCompanyNames, selectedQuotes]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuotes(new Set(quotesWithCompanyNames.map((quote) => quote.id)));
    } else {
      setSelectedQuotes(new Set());
    }
  };

  const handleSelectQuote = (quoteId: number, checked: boolean) => {
    const newSelected = new Set(selectedQuotes);
    if (checked) {
      newSelected.add(quoteId);
    } else {
      newSelected.delete(quoteId);
    }
    setSelectedQuotes(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedQuotes.size} quote(s)?`)) {
      return;
    }

    try {
      await Promise.all(Array.from(selectedQuotes).map((id) => deleteQuote.mutateAsync(id)));
      setSelectedQuotes(new Set());
    } catch (error) {
      console.error("Failed to delete quotes:", error);
    }
  };

  // Izračunaj total amount po valutama
  const totalAmountsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    quotesWithCompanyNames.forEach((quote) => {
      const currency = quote.currency || "USD";
      totals[currency] = (totals[currency] || 0) + quote.total;
    });
    return totals;
  }, [quotesWithCompanyNames]);

  const hasActiveFilters = useMemo(() => {
    return (
      search.trim().length > 0 ||
      Boolean(statusFilter) ||
      sortField !== DEFAULT_SORT_FIELD ||
      sortOrder !== DEFAULT_SORT_ORDER
    );
  }, [search, statusFilter, sortField, sortOrder]);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter(undefined);
    setSortField(DEFAULT_SORT_FIELD);
    setSortOrder(DEFAULT_SORT_ORDER);
    setPage(0);
  };

  const handleToggleColumn = (columnId: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId);
    } else {
      newVisible.add(columnId);
    }
    setVisibleColumns(newVisible);
  };

  const toolbarActions =
    toolbarActionsProp !== undefined ? (
      toolbarActionsProp
    ) : (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isFetching && !quotes.length}>
              <Columns3 className="size-4" aria-hidden="true" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columnDefinitions.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={visibleColumns.has(column.id)}
                onCheckedChange={() => handleToggleColumn(column.id)}>
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {onCreateQuote && showCreateAction && (
          <Button
            type="button"
            onClick={onCreateQuote}
            disabled={isFetching && !quotes.length}
            className="gap-2 md:order-2">
            <Plus className="size-4" aria-hidden="true" />
            New Quote
          </Button>
        )}
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="sr-only">Quotes</h2>

      <TableToolbar
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(0);
          },
          placeholder: "Search by quote number, client, or contact",
          ariaLabel: "Search quotes",
          isDisabled: isFetching && !quotes.length
        }}
        filters={
          <Select
            value={statusFilter ?? "__all__"}
            onValueChange={(value) => {
              setStatusFilter(value === "__all__" ? undefined : value);
              setPage(0);
            }}
            disabled={isFetching && !quotes.length}>
            <SelectTrigger className="md:w-44" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {QUOTE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        sort={{
          value: sortField,
          options: SORT_OPTIONS,
          onChange: (value) => {
            setSortField(value as QuoteSortField);
            setPage(0);
          },
          order: sortOrder,
          onOrderToggle: () => {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            setPage(0);
          },
          disabled: isFetching && !quotes.length,
          placeholder: "Sort by",
          ariaLabel: "Sort quotes",
          ascLabel: "Sort descending",
          descLabel: "Sort ascending"
        }}
        reset={{
          onReset: handleResetFilters,
          disabled: !hasActiveFilters
        }}
        actions={toolbarActions}
      />

      <div className="bg-background overflow-hidden rounded-xl border shadow-sm">
        {isError ? (
          <div className="text-muted-foreground flex h-48 flex-col items-center justify-center gap-3 text-sm">
            <p>Failed to load quotes.</p>
            <p className="text-destructive text-xs">
              {error instanceof Error ? error.message : "An unexpected error occurred."}
            </p>
            <Button onClick={() => refetch()} size="sm" disabled={isFetching}>
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
            Loading quotes...
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex h-96 items-center justify-center p-8">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="text-muted-foreground size-8" />
                </EmptyMedia>
                <EmptyTitle>No quotes found</EmptyTitle>
                <EmptyDescription>
                  Create your first quote to get started with managing your sales quotes.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {onCreateQuote && (
                  <Button onClick={onCreateQuote} className="gap-2">
                    <Plus className="size-4" aria-hidden="true" />
                    New Quote
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <>
            {selectedQuotes.size > 0 && (
              <div className="bg-muted/30 border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm font-medium">
                    {selectedQuotes.size} quote(s) selected
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-2"
                    disabled={deleteQuote.isPending}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            )}
            {quotesWithCompanyNames.length > 0 && (
              <div className="border-b px-4 py-3">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground font-medium">Total:</span>
                  <div className="flex items-center gap-3">
                    {Object.entries(totalAmountsByCurrency).map(([currency, total]) => (
                      <span key={currency} className="font-semibold">
                        {formatCurrency(total, currency)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={allQuotesSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all quotes"
                        className={cn(
                          allQuotesSelected && !someQuotesSelected
                            ? "data-[state=checked]:bg-primary"
                            : ""
                        )}
                      />
                    </TableHead>
                    {visibleColumns.has("index") && <TableHead className="w-[60px]">#</TableHead>}
                    {visibleColumns.has("quoteNumber") && <TableHead>Quote #</TableHead>}
                    {visibleColumns.has("client") && <TableHead>Client</TableHead>}
                    {visibleColumns.has("issueDate") && <TableHead>Issue Date</TableHead>}
                    {visibleColumns.has("expiryDate") && <TableHead>Expiry Date</TableHead>}
                    {visibleColumns.has("amount") && <TableHead>Amount</TableHead>}
                    {visibleColumns.has("status") && <TableHead>Status</TableHead>}
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotesWithCompanyNames.map((quote, index) => (
                    <TableRow
                      key={quote.id}
                      className={cn(
                        onQuoteClick ? "cursor-pointer" : "",
                        index % 2 === 1 ? "bg-muted/30" : "",
                        "hover:bg-muted/50 transition-colors",
                        selectedQuotes.has(quote.id) && "bg-primary/5"
                      )}
                      onClick={() => onQuoteClick?.(quote.id)}>
                      <TableCell
                        className="px-4 py-3 leading-relaxed"
                        onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedQuotes.has(quote.id)}
                          onCheckedChange={(checked) =>
                            handleSelectQuote(quote.id, checked === true)
                          }
                          aria-label={`Select quote ${quote.quoteNumber}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      {visibleColumns.has("index") && (
                        <TableCell className="text-muted-foreground px-4 py-3 leading-relaxed">
                          {page * limit + index + 1}
                        </TableCell>
                      )}
                      {visibleColumns.has("quoteNumber") && (
                        <TableCell className="px-4 py-3 leading-relaxed font-medium">
                          {quote.quoteNumber}
                        </TableCell>
                      )}
                      {visibleColumns.has("client") && (
                        <TableCell className="px-4 py-3 leading-relaxed">
                          {quote.companyName || "—"}
                        </TableCell>
                      )}
                      {visibleColumns.has("issueDate") && (
                        <TableCell className="px-4 py-3 leading-relaxed">
                          {formatDate(quote.issueDate)}
                        </TableCell>
                      )}
                      {visibleColumns.has("expiryDate") && (
                        <TableCell className="px-4 py-3 leading-relaxed">
                          {formatDate(quote.expiryDate)}
                        </TableCell>
                      )}
                      {visibleColumns.has("amount") && (
                        <TableCell className="px-4 py-3 leading-relaxed">
                          {formatCurrency(quote.total, quote.currency)}
                        </TableCell>
                      )}
                      {visibleColumns.has("status") && (
                        <TableCell className="px-4 py-3 leading-relaxed">
                          <Badge
                            variant={statusConfig[quote.status]?.variant || "secondary"}
                            icon={statusConfig[quote.status]?.icon}>
                            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="px-4 py-3 leading-relaxed">
                        <span role="presentation">
                          <QuoteActions quote={quote} onView={onQuoteClick} />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t px-4 py-4">
              <div className="text-muted-foreground flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-end">
                <div className="flex items-center gap-2">
                  <span>Show:</span>
                  <Select
                    value={limit.toString()}
                    onValueChange={(value) => {
                      setLimit(Number.parseInt(value, 10));
                      setPage(0);
                    }}
                    disabled={isFetching && !quotes.length}>
                    <SelectTrigger className="w-[80px]" aria-label="Items per page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total}{" "}
                    quotes
                  </span>
                </div>
                {totalPages > 1 && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        Page {page + 1} of {totalPages}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 0 || (isFetching && !quotes.length)}>
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages - 1 || (isFetching && !quotes.length)}>
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </div>
              {dataUpdatedAt && (
                <div className="border-t px-4 py-2">
                  <p className="text-muted-foreground text-center text-xs">
                    Last updated: {new Date(dataUpdatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
