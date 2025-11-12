"use client";

import type { PaymentStatus } from "@crm/types";
import { Plus } from "lucide-react";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { usePaymentsByInvoice } from "@/src/hooks/usePayments";

const statusVariants: Record<
	PaymentStatus,
	"default" | "secondary" | "destructive" | "outline"
> = {
	completed: "default",
	pending: "secondary",
	failed: "destructive",
	refunded: "outline",
};

type PaymentHistoryProps = {
	invoiceId: string;
	currency?: string;
	onAddPayment?: () => void;
};

export function PaymentHistory({
	invoiceId,
	currency = "EUR",
	onAddPayment,
}: PaymentHistoryProps) {
	const { data: paymentsResponse, isLoading } = usePaymentsByInvoice(invoiceId);
	const payments = paymentsResponse?.data || [];

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Payment History</CardTitle>
						<CardDescription>
							All payments recorded for this invoice
						</CardDescription>
					</div>
					{onAddPayment && (
						<Button onClick={onAddPayment} size="sm">
							<Plus className="h-4 w-4 mr-2" />
							Add Payment
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
						Loading payments...
					</div>
				) : payments.length === 0 ? (
					<div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
						<p>No payments recorded yet</p>
						{onAddPayment && (
							<Button onClick={onAddPayment} variant="outline" size="sm">
								<Plus className="h-4 w-4 mr-2" />
								Add First Payment
							</Button>
						)}
					</div>
				) : (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Method</TableHead>
									<TableHead>Reference</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{payments.map((payment) => (
									<TableRow key={payment.id}>
										<TableCell className="font-medium">
											{payment.paymentDate}
										</TableCell>
										<TableCell>
											{formatCurrency(
												payment.amount,
												payment.currency || currency,
											)}
										</TableCell>
										<TableCell className="capitalize">
											{payment.method.replace("_", " ")}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{payment.reference || "—"}
										</TableCell>
										<TableCell>
											<Badge variant={statusVariants[payment.status]}>
												{payment.status}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
