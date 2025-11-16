"use client";

import * as React from "react";
import type { Invoice, InvoiceItem, InvoiceUpdateInput } from "@crm/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MinimalTiptapEditor from "@/components/ui/custom/minimal-tiptap/minimal-tiptap";
import { useUpdateInvoice } from "@/src/hooks/useInvoices";
import { useToast } from "@/hooks/use-toast";

type EditorState = {
  invoiceNumber: string; // read-only
  issuedAt: string | null;
  dueDate: string | null;
  currency: string | null;
  customerName: string | null;
  customerEmail: string | null;
  billingAddress: string | null;
  notes?: string | null;
  paymentDetails?: string | null;
  fromDetails?: string | null;
  lineItems: Array<{
    id?: string;
    description: string;
    unitPrice: number;
    quantity: number;
    vatRate?: number | null;
    unit?: string | null;
    discountRate?: number | null;
  }>;
};

function parseNumber(value: string, fallback = 0): number {
  const v = Number(value.replace(",", "."));
  return Number.isFinite(v) ? v : fallback;
}

type Props = {
  invoice: Invoice;
  onCancel: () => void;
  onSaved?: (invoice: Invoice) => void;
};

export function InvoiceEditor({ invoice, onCancel, onSaved }: Props) {
  const { toast } = useToast();
  const { mutateAsync: updateInvoice, isPending } = useUpdateInvoice();

  const [state, setState] = React.useState<EditorState>(() => ({
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt ?? null,
    dueDate: (invoice.dueDate as string | null) ?? null,
    currency: invoice.currency ?? null,
    customerName: invoice.customerName ?? null,
    customerEmail: (invoice.customerEmail as string | null) ?? null,
    billingAddress: (invoice.billingAddress as string | null) ?? null,
    notes: typeof invoice.notes === "string" ? (invoice.notes as string) : "",
    paymentDetails: "Bank: — | Account number: — | IBAN: —",
    fromDetails: "Your Company\ninfo@yourcompany.com\n+381 60 000 0000\nAddress line\nVAT ID: —",
    lineItems: (invoice.items || []).map((it: InvoiceItem) => ({
      id: it.id,
      description: it.description || "",
      unitPrice: Number(it.unitPrice || 0),
      quantity: Number(it.quantity || 1),
      vatRate: it.vatRate ?? null,
      unit: it.unit ?? null,
      discountRate: it.discountRate ?? null
    }))
  }));

  const updateLineItem = (idx: number, patch: Partial<EditorState["lineItems"][number]>) => {
    setState((prev) => {
      const next = [...prev.lineItems];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, lineItems: next };
    });
  };

  const addLineItem = () => {
    setState((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          description: "",
          unitPrice: 0,
          quantity: 1,
          vatRate: null,
          unit: null,
          discountRate: null
        }
      ]
    }));
  };

  const removeLineItem = (idx: number) => {
    setState((prev) => {
      const next = [...prev.lineItems];
      next.splice(idx, 1);
      return { ...prev, lineItems: next };
    });
  };

  const validate = (): string[] => {
    const errors: string[] = [];
    if (!state.issuedAt) errors.push("Issue date is required");
    if (!state.currency) errors.push("Currency is required");
    if (state.lineItems.length === 0) errors.push("At least one line item is required");
    state.lineItems.forEach((li, i) => {
      if (!li.description?.trim()) errors.push(`Line ${i + 1}: description is required`);
      if (li.quantity <= 0) errors.push(`Line ${i + 1}: quantity must be > 0`);
      if (li.unitPrice < 0) errors.push(`Line ${i + 1}: price must be >= 0`);
    });
    return errors;
  };

  const handleSave = async () => {
    const errs = validate();
    if (errs.length) {
      toast({
        variant: "destructive",
        title: "Validation failed",
        description: errs.join("\n")
      });
      return;
    }

    const payload: InvoiceUpdateInput = {
      // Invoice number stays immutable by requirement (do not include)
      issuedAt: state.issuedAt || undefined,
      dueDate: state.dueDate || undefined,
      currency: state.currency || undefined,
      customerName: state.customerName || undefined,
      customerEmail: state.customerEmail || undefined,
      billingAddress: state.billingAddress || undefined,
      notes: state.notes || undefined,
      items: state.lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        unitPrice: li.unitPrice,
        quantity: li.quantity,
        vatRate: li.vatRate ?? undefined,
        unit: li.unit ?? undefined,
        discountRate: li.discountRate ?? undefined
      }))
    } as InvoiceUpdateInput;

    try {
      const updated = await updateInvoice({ id: invoice.id, input: payload });
      onSaved?.(updated);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Invoice number</Label>
            <Input value={state.invoiceNumber} disabled />
          </div>
          <div className="space-y-2">
            <Label>Issue date</Label>
            <Input
              type="date"
              value={state.issuedAt ? state.issuedAt.slice(0, 10) : ""}
              onChange={(e) => setState((s) => ({ ...s, issuedAt: e.target.value || null }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Due date</Label>
            <Input
              type="date"
              value={state.dueDate ? state.dueDate.slice(0, 10) : ""}
              onChange={(e) => setState((s) => ({ ...s, dueDate: e.target.value || null }))}
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input
              value={state.currency ?? ""}
              onChange={(e) => setState((s) => ({ ...s, currency: e.target.value || null }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Customer name</Label>
            <Input
              value={state.customerName ?? ""}
              onChange={(e) => setState((s) => ({ ...s, customerName: e.target.value || null }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Customer email</Label>
            <Input
              type="email"
              value={state.customerEmail ?? ""}
              onChange={(e) => setState((s) => ({ ...s, customerEmail: e.target.value || null }))}
            />
          </div>
        </div>
        <div className="mt-4">
          <Label>Billing address</Label>
          <MinimalTiptapEditor
            className="mt-2"
            value={state.billingAddress ?? ""}
            onChange={(v) => {
              const next = typeof v === "string" ? v : "";
              setState((s) => ({ ...s, billingAddress: next as string }));
            }}
            editorContentClassName="min-h-24 font-mono text-[11px] leading-4"
            hideToolbar
            unstyled
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label>From details</Label>
            <MinimalTiptapEditor
              className="mt-2"
              value={state.fromDetails ?? ""}
              onChange={(val) =>
                setState((s) => ({ ...s, fromDetails: typeof val === "string" ? val : "" }))
              }
              editorContentClassName="min-h-24 font-mono text-[11px] leading-4"
              hideToolbar
              unstyled
            />
          </div>
          <div>
            <Label>Payment details</Label>
            <MinimalTiptapEditor
              className="mt-2"
              value={state.paymentDetails ?? ""}
              onChange={(val) =>
                setState((s) => ({ ...s, paymentDetails: typeof val === "string" ? val : "" }))
              }
              editorContentClassName="min-h-24 font-mono text-[11px] leading-4"
              hideToolbar
              unstyled
            />
          </div>
        </div>
      </div>

      <div className="mt-4 px-4">
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm">Line items</Label>
              <Button variant="secondary" size="sm" onClick={addLineItem}>
                Add item
              </Button>
            </div>
            <div className="space-y-3">
              {state.lineItems.map((li, idx) => (
                <div
                  key={li.id ?? `idx-${idx}-${li.description}`}
                  className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-6">
                    <textarea
                      placeholder="Description"
                      className="w-full resize-none rounded-md border bg-transparent px-2 py-1 font-mono text-[11px] leading-4 whitespace-pre-wrap outline-none focus:ring-0"
                      rows={2}
                      onInput={(e) => {
                        const t = e.currentTarget;
                        t.style.height = "auto";
                        t.style.height = `${t.scrollHeight}px`;
                      }}
                      value={li.description}
                      onChange={(e) => updateLineItem(idx, { description: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Qty"
                      inputMode="decimal"
                      value={String(li.quantity)}
                      onChange={(e) =>
                        updateLineItem(idx, { quantity: parseNumber(e.target.value, 1) })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Price"
                      inputMode="decimal"
                      value={String(li.unitPrice)}
                      onChange={(e) =>
                        updateLineItem(idx, { unitPrice: parseNumber(e.target.value, 0) })
                      }
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => removeLineItem(idx)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 px-4">
        <Label>Notes</Label>
        <MinimalTiptapEditor
          className="mt-2"
          value={state.notes ?? ""}
          onChange={(val) => setState((s) => ({ ...s, notes: typeof val === "string" ? val : "" }))}
          editorContentClassName="min-h-24 font-mono text-[11px] leading-4"
          hideToolbar
          unstyled
        />
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 border-t p-4">
        <Button variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
