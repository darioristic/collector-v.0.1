"use client";

import { Copy, Download, ExternalLink, Mail, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
// @ts-expect-error - Module may not have types
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { deleteInvoiceAction } from "@/actions/invoice/delete-invoice-action";
import { FormatAmount } from "@/components/format-amount";
import { InvoiceStatus } from "@/components/invoices/invoice-status";
import type { Invoice } from "@/components/invoices/tables/columns";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { formatDate } from "@/lib/utils";

type InvoiceDetailsSheetProps = {
	data: Invoice;
	isOpen: boolean;
	setOpen: (open: boolean) => void;
};

export function InvoiceDetailsSheet({
	data,
	isOpen,
	setOpen,
}: InvoiceDetailsSheetProps) {
	const router = useRouter();

	const deleteInvoice = useAction(deleteInvoiceAction, {
		onSuccess: () => {
			toast.success("Invoice deleted successfully");
			setOpen(false);
			router.refresh();
		},
		onError: ({ error }: { error?: { serverError?: string } }) => {
			toast.error(error?.serverError || "Failed to delete invoice");
		},
	});

	const handleCopyLink = async () => {
		try {
			const link = `${window.location.origin}/i/${data.token}`;
			await navigator.clipboard.writeText(link);
			toast.success("Link copied to clipboard");
		} catch {
			toast.error("Failed to copy link");
		}
	};

	const handleViewInvoice = () => {
		if (data.token) {
			window.open(`/i/${data.token}`, "_blank");
		}
	};

	const handleDownloadPDF = async () => {
		try {
			const response = await fetch(`/api/invoices/${data.id}/download`);
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${data.invoice_number}.pdf`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} else {
				toast.error("Failed to download PDF");
			}
		} catch {
			toast.error("Failed to download PDF");
		}
	};

	const handleSendEmail = () => {
		// TODO: Implement send email functionality
		toast.info("Send email functionality will be implemented");
	};

	const handleDelete = () => {
		if (confirm("Are you sure you want to delete this invoice?")) {
			deleteInvoice.execute({ id: data.id });
		}
	};

	return (
		<Sheet open={isOpen} onOpenChange={setOpen}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-2xl overflow-y-auto"
			>
				<SheetHeader>
					<SheetTitle>Invoice Details</SheetTitle>
					<SheetDescription>
						View and manage invoice information
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-6">
					{/* Status and Actions */}
					<div className="flex items-center justify-between">
						<InvoiceStatus
							status={
								data.status as
									| "draft"
									| "overdue"
									| "paid"
									| "unpaid"
									| "canceled"
									| "pending"
							}
							isLoading={false}
						/>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={handleCopyLink}>
								<Copy className="h-4 w-4 mr-2" />
								Copy Link
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleViewInvoice}
								disabled={!data.token}
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								View
							</Button>
						</div>
					</div>

					<Separator />

					{/* Invoice Information */}
					<div className="space-y-4">
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Invoice Number
							</p>
							<p className="text-lg font-semibold">{data.invoice_number}</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Issue Date
								</p>
								<p className="text-base">
									{data.invoice_date ? formatDate(data.invoice_date) : "—"}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Due Date
								</p>
								<p className="text-base">{formatDate(data.due_date)}</p>
							</div>
						</div>

						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Customer
							</p>
							<p className="text-base">{data.customer_name || "—"}</p>
						</div>

						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Amount
							</p>
							<p className="text-lg font-semibold">
								<FormatAmount
									amount={data.amount || 0}
									currency={data.currency}
								/>
							</p>
						</div>

						{data.vat && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">VAT</p>
								<p className="text-base">
									<FormatAmount amount={data.vat} currency={data.currency} />
								</p>
							</div>
						)}

						{data.tax && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Tax</p>
								<p className="text-base">
									<FormatAmount amount={data.tax} currency={data.currency} />
								</p>
							</div>
						)}

						{data.paid_at && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Paid At
								</p>
								<p className="text-base">{formatDate(data.paid_at)}</p>
							</div>
						)}

						{data.sent_to && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Sent To
								</p>
								<p className="text-base">{data.sent_to}</p>
							</div>
						)}
					</div>

					<Separator />

					{/* Actions */}
					<div className="space-y-2">
						<Button
							variant="outline"
							className="w-full justify-start"
							onClick={handleDownloadPDF}
						>
							<Download className="h-4 w-4 mr-2" />
							Download PDF
						</Button>
						<Button
							variant="outline"
							className="w-full justify-start"
							onClick={handleSendEmail}
							disabled={!data.sent_to}
						>
							<Mail className="h-4 w-4 mr-2" />
							Send Email
						</Button>
						<Button
							variant="destructive"
							className="w-full justify-start"
							onClick={handleDelete}
							disabled={deleteInvoice.isExecuting}
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete Invoice
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
