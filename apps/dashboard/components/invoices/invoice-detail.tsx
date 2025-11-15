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
				{/* Customer Information */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Customer
						</p>
						<p className="text-sm font-semibold">{invoice.customerName}</p>
						{invoice.customerEmail && (
							<p className="text-sm text-muted-foreground">
								{invoice.customerEmail}
							</p>
						)}
					</div>
					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Currency
						</p>
						<p className="text-sm">{invoice.currency}</p>
					</div>
					{invoice.billingAddress && (
						<div className="col-span-2">
							<p className="text-sm font-medium text-muted-foreground">
								Billing Address
							</p>
							<p className="text-sm">{invoice.billingAddress}</p>
						</div>
					)}
					{invoice.notes && (
						<div className="col-span-2">
							<p className="text-sm font-medium text-muted-foreground">Notes</p>
							<p className="text-sm">{invoice.notes}</p>
						</div>
					)}
				</div>

				<Separator />

				{/* Invoice Items */}
				<div>
					<h3 className="text-lg font-semibold mb-4">Items</h3>
					{invoice.items && invoice.items.length > 0 ? (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[40%]">Description</TableHead>
										<TableHead className="text-right">Qty</TableHead>
										<TableHead className="text-right">Unit Price</TableHead>
										<TableHead className="text-right">Discount %</TableHead>
										<TableHead className="text-right">VAT %</TableHead>
										<TableHead className="text-right">Total</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{invoice.items.map((item) => (
										<TableRow key={item.id}>
											<TableCell>
												{item.description || "—"}
												<span className="text-xs text-muted-foreground block">
													Unit: {item.unit}
												</span>
											</TableCell>
											<TableCell className="text-right">
												{item.quantity}
											</TableCell>
											<TableCell className="text-right">
												{formatCurrency(item.unitPrice, invoice.currency)}
											</TableCell>
											<TableCell className="text-right">
												{item.discountRate}%
											</TableCell>
											<TableCell className="text-right">
												{item.vatRate}%
											</TableCell>
											<TableCell className="text-right font-medium">
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
