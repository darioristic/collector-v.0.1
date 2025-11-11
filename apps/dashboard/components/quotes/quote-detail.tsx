"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Building2, FileEdit, Globe, Mail, Phone, Trash2, X } from "lucide-react";
import type { Account, Quote } from "@crm/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ensureResponse } from "@/src/lib/fetch-utils";
import { useQuote } from "@/src/hooks/useQuotes";
import { formatCurrency } from "@/lib/utils";

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  sent: "default",
  accepted: "default",
  rejected: "destructive"
};

type QuoteDetailProps = {
  quoteId: number | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (quote: Quote) => void;
  onDelete?: (quoteId: number) => void;
};

async function fetchAccount(accountId: string): Promise<Account> {
  const response = await ensureResponse(
    await fetch(`/api/accounts/${accountId}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    })
  );

  return (await response.json()) as Account;
}

export function QuoteDetail({ quoteId, open, onClose, onEdit, onDelete }: QuoteDetailProps) {
  const {
    data: quote,
    isLoading,
    isError,
    error
  } = useQuote(quoteId ?? 0, {
    enabled: open && Boolean(quoteId)
  });

  const companyId = quote?.companyId ?? null;

  const { data: company, isLoading: isCompanyLoading } = useQuery({
    queryKey: ["account", companyId],
    queryFn: () => fetchAccount(companyId as string),
    enabled: open && Boolean(companyId),
    staleTime: 1000 * 60 * 5
  });

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
    return undefined;
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className="bg-background fixed inset-y-0 right-0 z-[70] h-screen w-full border border-gray-200/40 shadow-xl md:w-[45vw] md:rounded-l-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}>
            <div className="flex h-full flex-col">
              <header className="bg-background/95 supports-[backdrop-filter]:bg-background/75 relative sticky top-0 z-10 border-b px-6 py-5 backdrop-blur">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-muted-foreground hover:border-border hover:text-foreground focus-visible:ring-ring absolute top-5 right-6 rounded-full border border-transparent p-2 transition focus-visible:ring-2 focus-visible:outline-hidden"
                  aria-label="Close quote details">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>

                <div className="space-y-3 pr-12">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl leading-tight font-semibold">
                      Quote {quote?.quoteNumber ?? "—"}
                    </h2>
                    {quote ? (
                      <Badge variant={statusVariants[quote.status]} className="capitalize">
                        {quote.status}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {quote
                      ? `Issued on ${quote.issueDate}${
                          quote.expiryDate ? ` • Expires on ${quote.expiryDate}` : ""
                        }`
                      : "Loading quote metadata..."}
                  </p>
                  {(onEdit || onDelete) && quote ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {onEdit ? (
                        <Button onClick={() => onEdit(quote)} size="sm" variant="outline">
                          <FileEdit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      ) : null}
                      {onDelete ? (
                        <Button
                          onClick={() => onDelete(quote.id)}
                          size="sm"
                          variant="outline"
                          className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-6 py-6 pb-10">
                {isLoading ? (
                  <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                    Loading quote details...
                  </div>
                ) : isError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <p className="text-destructive text-sm font-medium">
                      Failed to load quote details.
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {error instanceof Error ? error.message : "An unexpected error occurred."}
                    </p>
                  </div>
                ) : !quote ? (
                  <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                    Quote not found.
                  </div>
                ) : (
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <div className="border-border/60 bg-muted/40 rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
                              <Building2 className="h-4 w-4" aria-hidden="true" />
                              Company
                            </div>
                            {companyId ? (
                              isCompanyLoading ? (
                                <p className="text-muted-foreground text-sm">
                                  Loading company information…
                                </p>
                              ) : company ? (
                                <div className="space-y-3 text-sm">
                                  <p className="text-foreground text-base font-semibold">
                                    {company.name}
                                  </p>
                                  <div className="text-muted-foreground grid gap-2 sm:grid-cols-2">
                                    <div className="inline-flex items-center gap-2">
                                      <Mail className="h-4 w-4" aria-hidden="true" />
                                      <span>{company.email}</span>
                                    </div>
                                    {company.phone ? (
                                      <div className="inline-flex items-center gap-2">
                                        <Phone className="h-4 w-4" aria-hidden="true" />
                                        <span>{company.phone}</span>
                                      </div>
                                    ) : null}
                                    {company.website ? (
                                      <div className="inline-flex items-center gap-2">
                                        <Globe className="h-4 w-4" aria-hidden="true" />
                                        <span className="truncate">{company.website}</span>
                                      </div>
                                    ) : null}
                                    <div className="inline-flex items-center gap-2">
                                      <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                        Country
                                      </span>
                                      <span>{company.country}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-sm">
                                  Company details unavailable.
                                </p>
                              )
                            ) : (
                              <p className="text-muted-foreground text-sm">
                                This quote is not linked to a company.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-muted-foreground font-medium">Currency</p>
                          <p className="text-foreground text-base font-semibold">
                            {quote.currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Totals</p>
                          <p className="text-foreground text-base font-semibold">
                            {formatCurrency(quote.total, quote.currency)}
                          </p>
                        </div>
                      </div>

                      {quote.notes ? (
                        <div>
                          <p className="text-muted-foreground text-sm font-medium">Notes</p>
                          <p className="text-foreground text-sm leading-relaxed">{quote.notes}</p>
                        </div>
                      ) : null}
                    </section>

                    <Separator />

                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Items</h3>
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">
                          {quote.items?.length ?? 0} line items
                        </p>
                      </div>
                      {quote.items && quote.items.length > 0 ? (
                        <div className="overflow-hidden rounded-xl border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50%]">Description</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {quote.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <p className="font-medium">{item.description || "—"}</p>
                                      {item.productId ? (
                                        <span className="text-muted-foreground text-xs">
                                          Product ID: {item.productId}
                                        </span>
                                      ) : null}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    {item.quantity}
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    {formatCurrency(item.unitPrice, quote.currency)}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(item.total, quote.currency)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                            <TableFooter>
                              <TableRow>
                                <TableCell colSpan={3} className="text-right font-medium">
                                  Subtotal
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(quote.subtotal, quote.currency)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell colSpan={3} className="text-right font-medium">
                                  Tax
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(quote.tax, quote.currency)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell colSpan={3} className="text-right font-bold">
                                  Total
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {formatCurrency(quote.total, quote.currency)}
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No items in this quote.</p>
                      )}
                    </section>

                    <Separator />

                    <section className="text-muted-foreground grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <span className="font-medium">Created:</span>{" "}
                        {new Date(quote.createdAt).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span>{" "}
                        {new Date(quote.updatedAt).toLocaleString()}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
