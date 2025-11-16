"use client";

import type { Invoice, InvoiceItem } from "@crm/types";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Mail, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useInvoice, useUpdateInvoice } from "@/src/hooks/useInvoices";
import { HtmlTemplate } from "./templates";
import type { TemplateProps, LineItem, TemplateConfig } from "./templates/types";
import { InvoiceToolbar } from "./invoice-toolbar";

type InvoiceDetailProps = {
  invoiceId: string;
  open?: boolean;
  onClose?: () => void;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoiceId: string) => void;
};

export function InvoiceDetail({
  invoiceId,
  open = true,
  onClose,
  onEdit: _onEdit,
  onDelete
}: InvoiceDetailProps) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { toast } = useToast();
  const [isSending, setIsSending] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const contentId = React.useId();
  const [editFrom, setEditFrom] = React.useState<string>("");
  const [editCustomer, setEditCustomer] = React.useState<string>("");
  const [editPayment, setEditPayment] = React.useState<string>("");
  const [editNotes, setEditNotes] = React.useState<string>("");
  const [editNotesJson, setEditNotesJson] = React.useState<unknown>(undefined);
  const [editLineNames, setEditLineNames] = React.useState<string[]>([]);
  const { mutateAsync: updateInvoice } = useUpdateInvoice();

  React.useEffect(() => {
    if (invoice) {
      console.log("[InvoiceDetail] Invoice data:", invoice);
    }
  }, [invoice]);

  const mapInvoiceToTemplateProps = React.useMemo((): TemplateProps | null => {
    if (!invoice) return null;

    const defaultTemplate: TemplateConfig = {
      logo_url: "/logo.png",
      from_label: "From",
      customer_label: "To",
      description_label: "Description",
      quantity_label: "Quantity",
      price_label: "Price",
      total_label: "Total",
      vat_label: "VAT",
      payment_label: "Payment Details",
      note_label: "Note",
      include_vat: true,
      include_tax: false
    };

    const lineItems: LineItem[] = (invoice.items || []).map((item: InvoiceItem) => ({
      name: item.description || "Product / Service",
      price: item.unitPrice,
      quantity: item.quantity,
      vat: item.vatRate,
      unit: item.unit,
      discountRate: item.discountRate
    }));

    // Create JSON content for editor fields
    const createEditorContent = (text: string): import("./templates/types").EditorDoc => {
      if (!text) {
        return { type: "doc", content: [] };
      }
      const doc = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: text }]
          }
        ]
      };
      return doc;
    };

    const fromDetails = createEditorContent(
      `Your Company\ninfo@yourcompany.com\n+381 60 000 0000\nAddress line\nVAT ID: —`
    );

    const customerDetails = createEditorContent(
      `${invoice.customerName}\n${invoice.customerEmail || ""}\n${invoice.billingAddress || ""}\nVAT ID: —`
    );

    const paymentDetails = createEditorContent("Bank: — | Account number: — | IBAN: —");

    // Handle notes - can be JSON (Tiptap format) or string (backward compatibility)
    const noteDetails: import("./templates/types").EditorDoc | undefined =
      invoice.notes && typeof invoice.notes === "object"
        ? (invoice.notes as unknown as import("./templates/types").EditorDoc)
        : invoice.notes
          ? createEditorContent(String(invoice.notes))
          : undefined;

    return {
      invoice_number: invoice.invoiceNumber,
      issue_date: invoice.issuedAt,
      due_date: invoice.dueDate || undefined,
      template: defaultTemplate,
      line_items: lineItems,
      customer_details: customerDetails,
      from_details: fromDetails,
      payment_details: paymentDetails,
      note_details: noteDetails,
      currency: invoice.currency,
      customer_name: invoice.customerName,
      amountBeforeDiscount: invoice.amountBeforeDiscount,
      discountTotal: invoice.discountTotal,
      subtotal: invoice.subtotal,
      totalVat: invoice.totalVat,
      total: invoice.total
    };
  }, [invoice]);

  // Initialize inline edit state from invoice once data is available
  React.useEffect(() => {
    if (!invoice) return;
    setEditFrom(`Your Company\ninfo@yourcompany.com\n+381 60 000 0000\nAddress line\nVAT ID: —`);
    setEditCustomer(
      `${invoice.customerName}\n${invoice.customerEmail || ""}\n${invoice.billingAddress || ""}\nVAT ID: —`
    );
    setEditPayment(`Bank: — | Account number: — | IBAN: —`);
    setEditNotes(typeof invoice.notes === "string" ? (invoice.notes as string) : "");
    setEditLineNames((invoice.items || []).map((it) => it.description || ""));
  }, [invoice]);

  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
        <SheetContent
          side="right"
          className="w-full p-0 md:w-[calc(50vw-20px)] md:max-w-[calc(900px-20px)]">
          <VisuallyHidden>
            <SheetTitle>Invoice Details</SheetTitle>
            <SheetDescription>Pregled računa</SheetDescription>
          </VisuallyHidden>
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                </div>
                <div className="mt-8 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!invoice) {
    return (
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
        <SheetContent
          side="right"
          className="w-full p-0 md:w-[calc(50vw-20px)] md:max-w-[calc(900px-20px)]">
          <VisuallyHidden>
            <SheetTitle>Invoice Details</SheetTitle>
            <SheetDescription>Pregled računa</SheetDescription>
          </VisuallyHidden>
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground text-sm">Invoice not found</p>
            </CardContent>
          </Card>
        </SheetContent>
      </Sheet>
    );
  }

  const templateProps = mapInvoiceToTemplateProps;

  const handleSaveInline = async () => {
    if (!invoice) return;
    try {
      const customerLines = editCustomer.split("\n");
      const parsedCustomerName = customerLines[0]?.trim() || invoice.customerName;
      const parsedCustomerEmail =
        customerLines[1]?.trim() || (invoice.customerEmail as string | undefined);
      const parsedBillingAddress =
        customerLines[2]?.trim() || (invoice.billingAddress as string | undefined);

      const payload: import("@crm/types").InvoiceUpdateInput = {
        customerName: parsedCustomerName || undefined,
        customerEmail: parsedCustomerEmail || undefined,
        billingAddress: parsedBillingAddress || undefined,
        // We'll set notes as object below to preserve formatting
        notes: undefined,
        items: (() => {
          const existing = invoice.items || [];
          const maxLen = Math.max(existing.length, editLineNames.length);
          const items = [];
          for (let i = 0; i < maxLen; i++) {
            const base = existing[i];
            if (base) {
              const itemId = (base as unknown as { id?: string }).id;
              items.push({
                id: itemId,
                description: editLineNames[i] ?? base.description ?? "",
                unitPrice: base.unitPrice,
                quantity: base.quantity,
                vatRate: base.vatRate ?? undefined,
                unit: base.unit ?? undefined,
                discountRate: base.discountRate ?? undefined
              });
            } else {
              // New row
              items.push({
                description: editLineNames[i] ?? "",
                unitPrice: 0,
                quantity: 1
              });
            }
          }
          // Remove completely empty descriptions to avoid backend validation errors
          return items.filter((it) => (it.description || "").trim().length > 0);
        })()
      };
      const notesDoc =
        editNotesJson && typeof editNotesJson === "object"
          ? (editNotesJson as object)
          : editNotes && editNotes.trim().length > 0
            ? {
                type: "doc",
                content: editNotes.split("\n").map((line) => ({
                  type: "paragraph",
                  content: line ? [{ type: "text", text: line }] : []
                }))
              }
            : undefined;
      await updateInvoice({
        id: invoice.id,
        input: { ...payload, notes: notesDoc } as unknown as any
      });
      setIsEditing(false);
      toast({ title: "Sačuvano", description: "Izmene su uspešno sačuvane." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška pri čuvanju",
        description: error instanceof Error ? error.message : "Nepoznata greška"
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <SheetContent
        side="right"
        className="w-full border-l-0 p-0 md:w-[calc(50vw-20px)] md:max-w-[calc(900px-20px)] [&>button]:hidden"
        style={{ top: 15, right: 15, bottom: 15 }}>
        <VisuallyHidden>
          <SheetTitle>Invoice {invoice.invoiceNumber}</SheetTitle>
          <SheetDescription>Pregled računa</SheetDescription>
        </VisuallyHidden>

        <div className="absolute top-4 right-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isEditing ? (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleSaveInline}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Save
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(invoice.id)} className="text-destructive">
                  Delete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    setIsSending(true);
                    const response = await fetch(`/api/sales/invoices/${invoiceId}/send`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({
                        email: invoice.customerEmail ?? undefined
                      })
                    });

                    if (!response.ok) {
                      const error = await response.json().catch(() => ({ error: "Unknown error" }));
                      throw new Error(error.error || "Failed to send invoice");
                    }

                    await response.json();
                    toast({
                      title: "Invoice sent",
                      description: `Invoice link has been sent to ${invoice.customerEmail || "customer"}`
                    });
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Failed to send invoice",
                      description: error instanceof Error ? error.message : "Unknown error"
                    });
                  } finally {
                    setIsSending(false);
                  }
                }}
                disabled={isSending || !invoice.customerEmail}>
                <Mail className="mr-2 h-4 w-4" />
                {isSending ? "Sending..." : "Send Invoice"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isEditing ? (
          <div
            style={{
              marginTop: "15px",
              marginBottom: "15px",
              height: "100%",
              position: "relative"
            }}
            id={contentId}
            className="pb-[15px]">
            {templateProps ? (
              <HtmlTemplate
                {...templateProps}
                line_items={(() => {
                  const base = templateProps.line_items;
                  const count = Math.max(base.length, editLineNames.length);
                  const out = [];
                  for (let i = 0; i < count; i++) {
                    const li = base[i];
                    if (li) {
                      out.push({
                        ...li,
                        name: editLineNames[i] ?? li.name
                      });
                    } else {
                      out.push({
                        name: editLineNames[i] ?? "",
                        price: 0,
                        quantity: 1
                      });
                    }
                  }
                  return out;
                })()}
                editable
                editors={{
                  from: { value: editFrom, onChange: (v: string) => setEditFrom(v ?? "") },
                  customer: {
                    value: editCustomer,
                    onChange: (v: string) => setEditCustomer(v ?? "")
                  },
                  payment: { value: editPayment, onChange: (v: string) => setEditPayment(v ?? "") },
                  notes: {
                    value: editNotesJson ?? editNotes,
                    onChange: (v: unknown) => {
                      setEditNotesJson(v);
                      try {
                        // also keep a string preview from JSON for safety
                        const doc = v as {
                          content?: Array<{ content?: Array<{ text?: string }> }>;
                        };
                        const str =
                          doc?.content
                            ?.map((p) =>
                              p?.content ? p.content.map((n) => n.text ?? "").join("") : ""
                            )
                            .join("\n") ?? "";
                        setEditNotes(str);
                      } catch {
                        // if it's string already
                        if (typeof v === "string") setEditNotes(v);
                      }
                    }
                  },
                  onLineItemDescriptionChange: (idx: number, text: string) =>
                    setEditLineNames((prev) => {
                      const next = [...prev];
                      next[idx] = text;
                      return next;
                    }),
                  onAddLineItem: () => setEditLineNames((prev) => [...prev, ""])
                }}
              />
            ) : null}
            <InvoiceToolbar
              invoiceId={invoiceId}
              onCopyLink={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
              }}
              onEdit={handleSaveInline}
              anchorId={contentId}
              isEditing
            />
          </div>
        ) : (
          <div
            style={{
              marginTop: "15px",
              marginBottom: "15px",
              height: "100%",
              position: "relative"
            }}
            id={contentId}
            className="pb-[15px]">
            {templateProps ? <HtmlTemplate {...templateProps} /> : null}

            {templateProps && (
              <InvoiceToolbar
                invoiceId={invoiceId}
                onCopyLink={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                }}
                onEdit={() => setIsEditing(true)}
                anchorId={contentId}
                isEditing={false}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
