"use client";

import {
	PAYMENT_METHODS,
	PAYMENT_STATUSES,
	type PaymentMethod,
	type PaymentStatus,
} from "@crm/types";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePayment } from "@/src/hooks/usePayments";

type AddPaymentDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoiceId: string;
	invoiceBalance: number;
	currency?: string;
};

type PaymentFormData = {
	amount: string;
	method: PaymentMethod;
	reference: string;
	notes: string;
	paymentDate: string;
	status: PaymentStatus;
};

export function AddPaymentDialog({
	open,
	onOpenChange,
	invoiceId,
	invoiceBalance,
	currency = "EUR",
}: AddPaymentDialogProps) {
	const amountId = useId();
	const methodId = useId();
	const paymentDateId = useId();
	const statusId = useId();
	const referenceId = useId();
	const notesId = useId();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<PaymentFormData>({
		defaultValues: {
			amount: invoiceBalance.toString(),
			method: "bank_transfer",
			reference: "",
			notes: "",
			paymentDate: new Date().toISOString().split("T")[0],
			status: "completed",
		},
	});

	const createPaymentMutation = useCreatePayment();
	const [selectedMethod, setSelectedMethod] =
		useState<PaymentMethod>("bank_transfer");
	const [selectedStatus, setSelectedStatus] =
		useState<PaymentStatus>("completed");

	const onSubmit = async (data: PaymentFormData) => {
		await createPaymentMutation.mutateAsync({
			invoiceId,
			amount: Number(data.amount),
			currency,
			method: selectedMethod,
			reference: data.reference || undefined,
			notes: data.notes || undefined,
			paymentDate: data.paymentDate,
			status: selectedStatus,
		});

		reset();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<form onSubmit={handleSubmit(onSubmit)}>
					<DialogHeader>
						<DialogTitle>Add Payment</DialogTitle>
						<DialogDescription>
							Record a new payment for this invoice. The invoice balance will be
							updated automatically.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor={amountId}>
								Amount ({currency}) <span className="text-destructive">*</span>
							</Label>
							<Input
								id={amountId}
								type="number"
								step="0.01"
								placeholder="0.00"
								{...register("amount", {
									required: "Amount is required",
									min: {
										value: 0.01,
										message: "Amount must be greater than 0",
									},
								})}
							/>
							{errors.amount && (
								<p className="text-sm text-destructive">
									{errors.amount.message}
								</p>
							)}
						</div>

						<div className="grid gap-2">
							<Label htmlFor={methodId}>
								Payment Method <span className="text-destructive">*</span>
							</Label>
							<Select
								value={selectedMethod}
								onValueChange={(value) =>
									setSelectedMethod(value as PaymentMethod)
								}
							>
								<SelectTrigger id={methodId}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PAYMENT_METHODS.map((method) => (
										<SelectItem key={method} value={method}>
											{method
												.replace("_", " ")
												.replace(/\b\w/g, (l) => l.toUpperCase())}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor={paymentDateId}>Payment Date</Label>
							<Input
								id={paymentDateId}
								type="date"
								{...register("paymentDate")}
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor={statusId}>Status</Label>
							<Select
								value={selectedStatus}
								onValueChange={(value) =>
									setSelectedStatus(value as PaymentStatus)
								}
							>
								<SelectTrigger id={statusId}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PAYMENT_STATUSES.map((status) => (
										<SelectItem key={status} value={status}>
											{status.charAt(0).toUpperCase() + status.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor={referenceId}>Reference Number</Label>
							<Input
								id={referenceId}
								placeholder="e.g., TXN-12345"
								{...register("reference")}
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor={notesId}>Notes</Label>
							<Textarea
								id={notesId}
								placeholder="Add any additional notes..."
								rows={3}
								{...register("notes")}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createPaymentMutation.isPending}>
							{createPaymentMutation.isPending ? "Saving..." : "Add Payment"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
