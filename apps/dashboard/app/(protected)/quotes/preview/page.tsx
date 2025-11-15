"use client";

import { format } from "date-fns";
import Logo from "@/components/layout/logo";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

type QuoteItemDraft = { description?: string; quantity?: number; unitPrice?: number };
type QuoteDraft = {
  quoteNumber?: string;
  companyId?: string;
  contactId?: string;
  issueDate?: string;
  expiryDate?: string;
  currency?: string;
  status?: string;
  notes?: string;
  items?: QuoteItemDraft[];
  customerName?: string;
  customerEmail?: string;
  billingAddress?: string;
};

export default function QuotePreviewPage() {
  const [draft, setDraft] = useState<QuoteDraft | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("quotePreviewDraft");
      if (raw) {
        setDraft(JSON.parse(raw) as QuoteDraft);
      }
    } catch {}
  }, []);

  const items = draft?.items ?? [];
  const currency = draft?.currency ?? "EUR";

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const qty = Number(item.quantity ?? 0);
      const price = Number(item.unitPrice ?? 0);
      return sum + qty * price;
    }, 0);
    const tax = subtotal * 0.2;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items]);

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-start justify-between">
          <div className="bg-black text-white w-12 h-12 flex items-center justify-center rounded-sm">
            <Logo />
          </div>
          <div className="text-sm space-y-1">
            <div className="flex gap-6">
              <span className="text-muted-foreground">Quote NO:</span>
              <span className="font-medium">{draft?.quoteNumber ?? "—"}</span>
            </div>
            <div className="flex gap-6">
              <span className="text-muted-foreground">Issue date:</span>
              <span className="font-medium">
                {draft?.issueDate ? format(new Date(draft.issueDate), "dd/MM/yyyy") : "—"}
              </span>
            </div>
            <div className="flex gap-6">
              <span className="text-muted-foreground">Due date:</span>
              <span className="font-medium">
                {draft?.expiryDate ? format(new Date(draft.expiryDate), "dd/MM/yyyy") : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-16 mt-10">
          <div className="space-y-2 text-sm">
            <div className="text-muted-foreground">From</div>
            <div>Your Company</div>
            <div className="text-muted-foreground">info@yourcompany.test</div>
            <div className="text-muted-foreground">Billing Office</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="text-muted-foreground">To</div>
            <div>{draft?.customerName ?? "—"}</div>
            <div className="text-muted-foreground">{draft?.customerEmail ?? "—"}</div>
            <div className="text-muted-foreground">{draft?.billingAddress ?? "—"}</div>
          </div>
        </div>

        <div className="rounded-lg border mt-10">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[50px] text-[12px] font-semibold tracking-wide text-muted-foreground">#</TableHead>
                <TableHead className="text-[12px] font-semibold tracking-wide text-muted-foreground">Description</TableHead>
                <TableHead className="w-[100px] text-right text-[12px] font-semibold tracking-wide text-muted-foreground">Qty</TableHead>
                <TableHead className="w-[120px] text-right text-[12px] font-semibold tracking-wide text-muted-foreground">Unit Price</TableHead>
                <TableHead className="w-[120px] text-right text-[12px] font-semibold tracking-wide text-muted-foreground">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    No items
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => {
                  const qty = Number(item.quantity ?? 0);
                  const price = Number(item.unitPrice ?? 0);
                  const total = qty * price;
                  return (
                    <TableRow key={index} className="hover:bg-muted/20">
                      <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                      <TableCell className="text-sm">{item.description ?? ""}</TableCell>
                      <TableCell className="text-right text-sm">{qty}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(price, currency)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(total, currency)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-8">
          <div>
            <div className="text-sm font-medium">Notes</div>
            <div className="text-sm text-muted-foreground whitespace-pre-line">{draft?.notes ?? ""}</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Subtotal</div>
              <div className="text-sm font-medium">{formatCurrency(totals.subtotal, currency)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Tax (20%)</div>
              <div className="text-sm font-medium">{formatCurrency(totals.tax, currency)}</div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm">Total</div>
              <div className="text-sm font-semibold">{formatCurrency(totals.total, currency)}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button variant="outline" onClick={handleClose}>Zatvori</Button>
        </div>
      </div>
    </div>
  );
}