"use client";

import type { Invoice } from "@crm/types";
import * as React from "react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useInvoice } from "@/src/hooks/useInvoices";
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
    onEdit,
    onDelete,
}: InvoiceDetailProps) {
    const { data: invoice, isLoading } = useInvoice(invoiceId);

    React.useEffect(() => {
        if (invoice) {
            console.log("[InvoiceDetail] Invoice data:", invoice);
            console.log("[InvoiceDetail] Invoice items:", invoice.items);
            console.log("[InvoiceDetail] Items count:", invoice.items?.length ?? 0);
        }
    }, [invoice]);

    const mapInvoiceToTemplateProps = React.useMemo((): TemplateProps | null => {
        if (!invoice) return null;

        const defaultTemplate: TemplateConfig = {
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
            include_tax: false,
        };

        const lineItems: LineItem[] = (invoice.items || []).map((item) => ({
            name: item.description || "Product / Service",
            price: item.unitPrice,
            quantity: item.quantity,
            vat: item.vatRate,
            unit: item.unit,
            discountRate: item.discountRate,
        }));

        // Create JSON content for editor fields
        const createEditorContent = (text: string): JSON => {
            if (!text) {
                return {
                    type: "doc",
                    content: [],
                } as JSON;
            }
            return {
                type: "doc",
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                text: text,
                            },
                        ],
                    },
                ],
            } as JSON;
        };

        const fromDetails = createEditorContent(
            `Your Company\ninfo@yourcompany.com\n+381 60 000 0000\nAddress line\nVAT ID: —`
        );

        const customerDetails = createEditorContent(
            `${invoice.customerName}\n${invoice.customerEmail || ""}\n${invoice.billingAddress || ""}\nVAT ID: —`
        );

        const paymentDetails = createEditorContent("Bank: — | Account number: — | IBAN: —");

        // Handle notes - can be JSON (Tiptap format) or string (backward compatibility)
        const noteDetails = invoice.notes 
            ? (typeof invoice.notes === "object" 
                ? invoice.notes as JSON 
                : createEditorContent(String(invoice.notes)))
            : undefined;

        return {
            invoice_number: invoice.invoiceNumber,
            issue_date: invoice.issuedAt,
            due_date: invoice.dueDate,
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
            total: invoice.total,
        };
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
                <SheetContent side="right" className="w-full p-0 md:w-[calc(50vw)] md:max-w-[900px]">
                    <VisuallyHidden>
                        <SheetTitle>Invoice Details</SheetTitle>
                        <SheetDescription>Pregled računa</SheetDescription>
                    </VisuallyHidden>
                    <Card>
                        <CardContent className="flex h-64 items-center justify-center">
                            <p className="text-sm text-muted-foreground">Loading invoice details...</p>
                        </CardContent>
                    </Card>
                </SheetContent>
            </Sheet>
        );
    }

    if (!invoice) {
        return (
            <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
                <SheetContent side="right" className="w-full p-0 md:w-[calc(50vw)] md:max-w-[900px]">
                    <VisuallyHidden>
                        <SheetTitle>Invoice Details</SheetTitle>
                        <SheetDescription>Pregled računa</SheetDescription>
                    </VisuallyHidden>
                    <Card>
                        <CardContent className="flex h-64 items-center justify-center">
                            <p className="text-sm text-muted-foreground">Invoice not found</p>
                        </CardContent>
                    </Card>
                </SheetContent>
            </Sheet>
        );
    }

    const templateProps = mapInvoiceToTemplateProps;

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
            <SheetContent side="right" className="w-full p-0 md:w-[calc(50vw)] md:max-w-[900px] [&>button]:hidden border-l-0">
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
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(invoice)}>
                                    Edit
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem 
                                    onClick={() => onDelete(invoice.id)}
                                    className="text-destructive"
                                >
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
                <div style={{ marginTop: "15px", marginBottom: "15px", height: "100%", position: "relative" }}>
                    {templateProps ? (
                        <HtmlTemplate {...templateProps} />
                    ) : null}
                    
                    {templateProps && (
                        <InvoiceToolbar
                            invoiceId={invoiceId}
                            onCopyLink={() => {
                                const url = window.location.href;
                                navigator.clipboard.writeText(url);
                            }}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
