"use client";

import type { Invoice } from "@crm/types";
import * as React from "react";
import { FileEdit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useInvoice } from "@/src/hooks/useInvoices";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	draft: "secondary",
	sent: "default",
	paid: "default",
	overdue: "destructive",
	void: "destructive",
};

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

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
            <SheetContent side="right" className="w-full p-0 md:w-[calc(50vw)] md:max-w-[900px]">
                <VisuallyHidden>
                    <SheetTitle>Invoice {invoice.invoiceNumber}</SheetTitle>
                    <SheetDescription>Pregled računa</SheetDescription>
                </VisuallyHidden>
                <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Invoice {invoice.invoiceNumber}
                            <Badge variant={statusVariants[invoice.status]}>
                                {invoice.status}
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Issued on {new Date(invoice.issuedAt).toLocaleDateString()}
                            {invoice.dueDate &&
                                ` • Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button
                                onClick={() => onEdit(invoice)}
                                variant="outline"
                                size="sm"
                            >
                                <FileEdit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                onClick={() => onDelete(invoice.id)}
                                variant="outline"
                                size="sm"
                                className="text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

			<CardContent className="space-y-6">
				{/* From / To */}
				<div className="grid grid-cols-2 gap-16">
					<div className="space-y-2 text-sm">
						<div className="text-muted-foreground">From</div>
						<div>Your Company</div>
						<div className="text-muted-foreground">info@yourcompany.test</div>
						<div className="text-muted-foreground">Billing Office</div>
					</div>
					<div className="space-y-2 text-sm">
						<div className="text-muted-foreground">To</div>
						<div>{invoice.customerName}</div>
						<div className="text-muted-foreground">{invoice.customerEmail || "—"}</div>
						<div className="text-muted-foreground">{invoice.billingAddress || "—"}</div>
					</div>
				</div>

				<Separator />

				{/* Invoice Items */}
				<div>
					<h3 className="text-lg font-semibold mb-4">Items</h3>
					{invoice.items && invoice.items.length > 0 ? (
						<div className="rounded-md border">
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
                                    {invoice.items.map((item, index) => (
                                        <TableRow key={item.id} className="hover:bg-muted/20">
                                            <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                                            <TableCell className="text-sm">
                                                {item.description || "—"}
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                {formatCurrency(item.unitPrice, invoice.currency)}
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-medium">
                                                {formatCurrency(item.totalInclVat, invoice.currency)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
								</TableBody>
								<TableFooter>
									<TableRow>
										<TableCell colSpan={5} className="text-right font-medium">
											Amount Before Discount
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(
												invoice.amountBeforeDiscount,
												invoice.currency,
											)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell colSpan={5} className="text-right font-medium">
											Discount Total
										</TableCell>
										<TableCell className="text-right font-medium text-green-600">
											-{formatCurrency(invoice.discountTotal, invoice.currency)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell colSpan={5} className="text-right font-medium">
											Subtotal (excl. VAT)
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(invoice.subtotal, invoice.currency)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell colSpan={5} className="text-right font-medium">
											Total VAT
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(invoice.totalVat, invoice.currency)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell
											colSpan={5}
											className="text-right font-bold text-lg"
										>
											Total
										</TableCell>
										<TableCell className="text-right font-bold text-lg">
											{formatCurrency(invoice.total, invoice.currency)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell colSpan={5} className="text-right font-medium">
											Amount Paid
										</TableCell>
										<TableCell className="text-right font-medium text-green-600">
											{formatCurrency(invoice.amountPaid, invoice.currency)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell colSpan={5} className="text-right font-bold">
											Balance Due
										</TableCell>
										<TableCell className="text-right font-bold">
											{formatCurrency(invoice.balance, invoice.currency)}
										</TableCell>
									</TableRow>
								</TableFooter>
							</Table>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							No items in this invoice
						</p>
					)}
				</div>

				{/* Metadata */}
				<Separator />
				<div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
					<div>
						<span className="font-medium">Created:</span>{" "}
						{new Date(invoice.createdAt).toLocaleString()}
					</div>
					<div>
						<span className="font-medium">Updated:</span>{" "}
						{new Date(invoice.updatedAt).toLocaleString()}
					</div>
				</div>
            </CardContent>
                </Card>
            </SheetContent>
        </Sheet>
    );
}
