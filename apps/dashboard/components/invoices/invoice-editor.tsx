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
  const itemRefs = React.useRef<Record<number, HTMLTextAreaElement | null>>({});
  const stringToDoc = React.useCallback((text: string) => ({
    type: "doc",
    content: (text ?? "").split("\n").map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : []
    }))
  }), []);
  const contentToString = React.useCallback((content: unknown): string => {
    try {
      const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
      if (!doc?.content) return "";
      return doc.content
        .map((p) => (p?.content ? p.content.map((n) => n.text ?? "").join("") : ""))
        .join("\n");
    } catch {
      return typeof content === "string" ? content : "";
    }
  }, []);
  const [notesJson, setNotesJson] = React.useState<object | null>(() =>
    invoice?.notes && typeof invoice.notes === "object"
      ? (invoice.notes as unknown as object)
      : stringToDoc(String(invoice?.notes ?? ""))
  );

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
      const updated = await updateInvoice({
        id: invoice.id,
        input: {
          ...payload,
          notes:
            notesJson && typeof notesJson === "object"
              ? (notesJson as object)
              : state.notes
                ? stringToDoc(state.notes)
                : undefined
        }
      });
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
            value={stringToDoc(state.billingAddress ?? "")}
            onChange={(val) =>
              setState((s) => ({ ...s, billingAddress: contentToString(val) }))
            }
            output="json"
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
              value={stringToDoc(state.fromDetails ?? "")}
              onChange={(val) =>
                setState((s) => ({ ...s, fromDetails: contentToString(val) }))
              }
              output="json"
              editorContentClassName="min-h-24 font-mono text-[11px] leading-4"
              hideToolbar
              unstyled
            />
          </div>
				<div>
            <Label>Payment details</Label>
            <MinimalTiptapEditor
              className="mt-2"
              value={stringToDoc(state.paymentDetails ?? "")}
              onChange={(val) =>
                setState((s) => ({ ...s, paymentDetails: contentToString(val) }))
              }
              output="json"
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
                  key={li.id ?? `idx-${idx}`}
                  className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-6">
                    <textarea
                      placeholder="Description"
                      className="w-full max-h-64 resize-none overflow-y-auto rounded-md border bg-transparent px-2 py-1 font-mono text-[11px] leading-4 whitespace-pre-wrap outline-none focus:ring-0"
                      rows={3}
                      value={li.description}
                      onChange={(e) => {
                        const start = e.currentTarget.selectionStart ?? e.currentTarget.value.length;
                        const end = e.currentTarget.selectionEnd ?? e.currentTarget.value.length;
                        updateLineItem(idx, { description: e.target.value });
                        requestAnimationFrame(() => {
                          const el = itemRefs.current[idx];
                          if (el) {
                            el.focus();
                            try {
                              el.setSelectionRange(start, end);
                            } catch (_e) {
                              void 0;
                            }
                          }
                        });
                      }}
                      ref={(el) => {
                        itemRefs.current[idx] = el;
                      }}
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
          value={notesJson ?? stringToDoc(state.notes ?? "")}
          onChange={(val) => setNotesJson(val as object)}
          output="json"
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
