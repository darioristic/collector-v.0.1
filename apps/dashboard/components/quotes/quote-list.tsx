"use client";

import { useMemo, useState, type ReactNode } from "react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useQuotes } from "@/src/hooks/useQuotes";
import type { QuoteSortField } from "@crm/types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/table-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { QUOTE_STATUSES } from "@crm/types";

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  sent: "default",
  accepted: "default",
  rejected: "destructive"
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
  const limit = 10;

  const {
    data: quotesResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
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

  const toolbarActions =
    toolbarActionsProp !== undefined ? (
      toolbarActionsProp
    ) : onCreateQuote && showCreateAction ? (
      <Button
        type="button"
        onClick={onCreateQuote}
        disabled={isFetching && !quotes.length}
        className="gap-2 md:order-2">
        <Plus className="size-4" aria-hidden="true" />
        New Quote
      </Button>
    ) : null;

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
          <div className="text-muted-foreground flex h-48 flex-col items-center justify-center gap-2 text-sm">
            <p>No quotes found</p>
            {onCreateQuote && (
              <Button onClick={onCreateQuote} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create First Quote
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow
                      key={quote.id}
                      className={onQuoteClick ? "cursor-pointer" : ""}
                      onClick={() => onQuoteClick?.(quote.id)}>
                      <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                      <TableCell>{quote.companyName || "—"}</TableCell>
                      <TableCell>{quote.issueDate}</TableCell>
                      <TableCell>{quote.expiryDate || "—"}</TableCell>
                      <TableCell>{formatCurrency(quote.total, quote.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[quote.status]}>{quote.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuoteClick?.(quote.id);
                          }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="border-t px-4 py-4">
                <div className="text-muted-foreground flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
                  <div>
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total}{" "}
                    quotes
                  </div>
                  <div className="flex gap-2 md:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}>
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}>
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
