"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useQuotes } from "@/src/hooks/useQuotes";
import { Plus, Search } from "lucide-react";
import { QUOTE_STATUSES } from "@crm/types";

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  sent: "default",
  accepted: "default",
  rejected: "destructive"
};

const STATUS_FILTERS = [
  { value: "all", label: "All Quotes" },
  ...QUOTE_STATUSES.map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1)
  }))
] as const;

type QuoteListProps = {
  companyId?: string;
  contactId?: string;
  onQuoteClick?: (quoteId: number) => void;
  onCreateQuote?: () => void;
};

export function QuoteList({ companyId, contactId, onQuoteClick, onCreateQuote }: QuoteListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
    limit,
    offset: page * limit
  });

  const quotes = quotesResponse?.data || [];
  const total = quotesResponse?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="sr-only">Quotes</h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:w-[360px] md:min-w-[280px] md:flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder="Search quotes by number, company, or contact"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:ml-auto md:justify-end">
            {onCreateQuote && (
              <Button onClick={onCreateQuote} size="sm" className="min-w-[140px]">
                <Plus className="mr-2 h-4 w-4" />
                New Quote
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={statusFilter === filter.value ? "default" : "secondary"}
              onClick={() => {
                setStatusFilter(filter.value);
                setPage(0);
              }}>
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

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
