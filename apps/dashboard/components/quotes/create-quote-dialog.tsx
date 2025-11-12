"use client";

import { QUOTE_STATUSES, type QuoteItemCreateInput } from "@crm/types";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCreateQuote } from "@/src/hooks/useQuotes";

type CreateQuoteDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	companyId?: string;
	contactId?: string;
};

type QuoteFormData = {
	quoteNumber: string;
	companyId: string;
	contactId: string;
	issueDate: string;
	expiryDate: string;
	currency: string;
	status: string;
	notes: string;
	items: QuoteItemCreateInput[];
};

export function CreateQuoteDialog({
	open,
	onOpenChange,
	companyId = "",
	contactId = "",
}: CreateQuoteDialogProps) {
	const {
		register,
		handleSubmit,
		control,
		watch,
		reset,
		formState: { errors },
	} = useForm<QuoteFormData>({
		defaultValues: {
			quoteNumber: "",
			companyId,
			contactId,
			issueDate: new Date().toISOString().split("T")[0],
			expiryDate: "",
			currency: "EUR",
			status: "draft",
			notes: "",
			items: [{ description: "", quantity: 1, unitPrice: 0 }],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "items",
	});

	const createQuoteMutation = useCreateQuote();

	const onSubmit = async (data: QuoteFormData) => {
		// Filter out empty items
		const validItems = data.items.filter(
			(item) => item.description || item.productId || item.unitPrice > 0,
		);

		if (validItems.length === 0) {
			alert("Please add at least one item to the quote");
			return;
		}

		await createQuoteMutation.mutateAsync({
			quoteNumber: data.quoteNumber,
			companyId: data.companyId || undefined,
			contactId: data.contactId || undefined,
			issueDate: data.issueDate,
			expiryDate: data.expiryDate || undefined,
			currency: data.currency,
			status: data.status,
			notes: data.notes || undefined,
			items: validItems,
		});

		reset();
		onOpenChange(false);
	};

	const items = watch("items");
	const subtotal = items.reduce((acc, item) => {
		return acc + (item.quantity || 0) * (item.unitPrice || 0);
	}, 0);
	const tax = subtotal * 0.2;
	const total = subtotal + tax;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<form onSubmit={handleSubmit(onSubmit)}>
					<DialogHeader>
						<DialogTitle>Create New Quote</DialogTitle>
						<DialogDescription>
							Create a new quote with line items. Totals will be calculated
							automatically.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						{/* Basic Information */}
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="quoteNumber">
									Quote Number <span className="text-destructive">*</span>
								</Label>
								<Input
									id="quoteNumber"
									placeholder="Q-2025-001"
									{...register("quoteNumber", {
										required: "Quote number is required",
									})}
								/>
								{errors.quoteNumber && (
									<p className="text-sm text-destructive">
										{errors.quoteNumber.message}
									</p>
								)}
							</div>

							<div className="grid gap-2">
								<Label htmlFor="currency">Currency</Label>
								<Select
									defaultValue="EUR"
									onValueChange={(value) => {
										register("currency").onChange({ target: { value } });
									}}
								>
									<SelectTrigger id="currency">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="EUR">EUR</SelectItem>
										<SelectItem value="USD">USD</SelectItem>
										<SelectItem value="GBP">GBP</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="issueDate">Issue Date</Label>
								<Input id="issueDate" type="date" {...register("issueDate")} />
							</div>

							<div className="grid gap-2">
								<Label htmlFor="expiryDate">Expiry Date</Label>
								<Input
									id="expiryDate"
									type="date"
									{...register("expiryDate")}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="companyId">Company ID</Label>
								<Input
									id="companyId"
									placeholder="Optional"
									{...register("companyId")}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="contactId">Contact ID</Label>
								<Input
									id="contactId"
									placeholder="Optional"
									{...register("contactId")}
								/>
							</div>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="status">Status</Label>
							<Select
								defaultValue="draft"
								onValueChange={(value) => {
									register("status").onChange({ target: { value } });
								}}
							>
								<SelectTrigger id="status">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{QUOTE_STATUSES.map((status) => (
										<SelectItem key={status} value={status}>
											{status.charAt(0).toUpperCase() + status.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="notes">Notes</Label>
							<Textarea
								id="notes"
								placeholder="Add any additional notes..."
								rows={2}
								{...register("notes")}
							/>
						</div>

						{/* Quote Items */}
						<div className="grid gap-2">
							<div className="flex items-center justify-between">
								<Label>
									Items <span className="text-destructive">*</span>
								</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										append({ description: "", quantity: 1, unitPrice: 0 })
									}
								>
									<Plus className="h-4 w-4 mr-2" />
									Add Item
								</Button>
							</div>

							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[40%]">Description</TableHead>
											<TableHead className="w-[15%]">Quantity</TableHead>
											<TableHead className="w-[20%]">Unit Price</TableHead>
											<TableHead className="w-[15%]">Total</TableHead>
											<TableHead className="w-[10%]"></TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{fields.map((field, index) => (
											<TableRow key={field.id}>
												<TableCell>
													<Input
														placeholder="Description"
														{...register(`items.${index}.description`)}
													/>
												</TableCell>
												<TableCell>
													<Input
														type="number"
														min="1"
														{...register(`items.${index}.quantity`, {
															valueAsNumber: true,
															min: 1,
														})}
													/>
												</TableCell>
												<TableCell>
													<Input
														type="number"
														step="0.01"
														min="0"
														{...register(`items.${index}.unitPrice`, {
															valueAsNumber: true,
															min: 0,
														})}
													/>
												</TableCell>
												<TableCell className="font-medium">
													{(
														(items[index]?.quantity || 0) *
														(items[index]?.unitPrice || 0)
													).toFixed(2)}
												</TableCell>
												<TableCell>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => remove(index)}
														disabled={fields.length === 1}
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>

						{/* Totals */}
						<div className="flex flex-col gap-2 items-end">
							<div className="grid grid-cols-2 gap-2 w-64 text-sm">
								<span className="text-muted-foreground">Subtotal:</span>
								<span className="text-right font-medium">
									{subtotal.toFixed(2)}
								</span>
							</div>
							<div className="grid grid-cols-2 gap-2 w-64 text-sm">
								<span className="text-muted-foreground">Tax (20%):</span>
								<span className="text-right font-medium">{tax.toFixed(2)}</span>
							</div>
							<div className="grid grid-cols-2 gap-2 w-64 text-base">
								<span className="font-bold">Total:</span>
								<span className="text-right font-bold">{total.toFixed(2)}</span>
							</div>
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
						<Button type="submit" disabled={createQuoteMutation.isPending}>
							{createQuoteMutation.isPending ? "Creating..." : "Create Quote"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
