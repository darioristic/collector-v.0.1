"use client";

import type { QuoteItemCreateInput } from "@crm/types";
import { QUOTE_STATUSES } from "@crm/types";
import { format } from "date-fns";
import {
	CalendarIcon,
	Loader2,
	Plus,
	Trash2,
	Building2,
	User,
	FileText,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { FormProvider, useForm, useFieldArray } from "react-hook-form";
import { CompanyAutocomplete } from "@/components/forms/CompanyAutocomplete";
import { ProductAutocomplete } from "@/components/forms/ProductAutocomplete";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { useContacts } from "@/src/hooks/useContacts";
import { useCreateQuote } from "@/src/hooks/useQuotes";
import Logo from "@/components/layout/logo";

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
	const [quoteNumber] = useState(() => {
		const year = new Date().getFullYear();
		const random = Math.floor(Math.random() * 1000)
			.toString()
			.padStart(3, "0");
		return `QUO-${year}-${random}`;
	});

	const [issueDateOpen, setIssueDateOpen] = useState(false);
	const [expiryDateOpen, setExpiryDateOpen] = useState(false);
	const [showPreview, setShowPreview] = useState(false);

	const methods = useForm<QuoteFormData>({
		defaultValues: {
			quoteNumber,
			companyId,
			contactId,
			issueDate: new Date().toISOString().split("T")[0],
			expiryDate: "",
			currency: "EUR",
			status: "draft",
			notes: "",
			items: [{ description: "", quantity: 1, unitPrice: 0 }],
		},
		mode: "onChange",
		criteriaMode: "all",
	});

	const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = methods;

	const { fields, append, remove } = useFieldArray({
		control,
		name: "items",
	});

	useEffect(() => {
		setValue("quoteNumber", quoteNumber);
	}, [quoteNumber, setValue]);

	const createQuoteMutation = useCreateQuote();
	const { toast } = useToast();
	const { data: contacts = [], isLoading: isLoadingContacts } = useContacts();

	useEffect(() => {
		if (!open) {
			reset({
				quoteNumber: "",
				companyId,
				contactId,
				issueDate: new Date().toISOString().split("T")[0],
				expiryDate: "",
				currency: "EUR",
				status: "draft",
				notes: "",
				items: [{ description: "", quantity: 1, unitPrice: 0 }],
			});
		}
	}, [open, reset, companyId, contactId]);

	const selectedCompanyId = watch("companyId");
	const selectedCurrency = watch("currency");
	const items = watch("items");
	const issueDate = watch("issueDate");
	const expiryDate = watch("expiryDate");

	const filteredContacts = contacts.filter(
		(contact) => !selectedCompanyId || contact.accountId === selectedCompanyId,
	);

	const totals = useMemo(() => {
		const subtotal = items.reduce(
			(sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
			0,
		);
		const tax = subtotal * 0.2;
		const total = subtotal + tax;
		return { subtotal, tax, total };
	}, [items]);

	const handleProductSelect = (index: number, product: { id: string; name: string; price: number; description?: string | null } | null) => {
		if (product) {
			setValue(`items.${index}.productId`, product.id);
			setValue(`items.${index}.description`, product.description || product.name);
			setValue(`items.${index}.unitPrice`, product.price);
		}
	};

	const handleAddItem = () => {
		append({ description: "", quantity: 1, unitPrice: 0 });
		// Focus first input of new row after a short delay
		setTimeout(() => {
			const newRow = document.querySelector("tbody tr:last-child input") as HTMLInputElement;
			newRow?.focus();
		}, 100);
	};

	const onSubmit = async (data: QuoteFormData) => {
		const validItems = data.items.filter(
			(item) => item.description || item.productId || item.unitPrice > 0,
		);

		if (validItems.length === 0) {
			toast({
				title: "Validation Error",
				description: "Please add at least one item to the quote",
				variant: "destructive",
			});
			return;
		}

		try {
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

			toast({
				title: "Success",
				description: "Quote created successfully!",
			});

			onOpenChange(false);
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to create quote",
				variant: "destructive",
			});
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex w-full flex-col p-0 md:w-[calc(50vw)] md:max-w-[900px] [&>button]:hidden"
			>
				<FormProvider {...methods}>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="flex h-full flex-col"
					>
						<SheetHeader className="shrink-0 border-b bg-muted/20 px-6 py-5">
							<SheetTitle className="text-2xl font-bold tracking-tight">Create New Quote</SheetTitle>
							<SheetDescription className="mt-1.5 text-sm text-muted-foreground">
								Fill in the details below to create a new quote. All fields marked with <span className="text-destructive">*</span> are required.
							</SheetDescription>
							<div className="mt-3 flex gap-2">
								<Button type="button" variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
									{showPreview ? "Sakrij preview" : "Prikaži preview"}
								</Button>
							</div>
						</SheetHeader>

						<div className="min-h-0 flex-1 overflow-y-auto">
							<div className="space-y-8 p-6">
								{/* Quote Information Section */}
								<section className="space-y-4">
									<div className="flex items-center gap-2 border-b pb-2">
										<FileText className="size-4 text-primary" />
										<h2 className="text-lg font-semibold text-foreground">Quote Information</h2>
									</div>

									{/* First Row - Quote Number & Company */}
									<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
										{/* Quote Number */}
										<div className="lg:col-span-3">
											<Label htmlFor="quoteNumber" className="mb-2 text-sm font-semibold text-foreground">
												Quote Number
											</Label>
											<Input
												id="quoteNumber"
												value={quoteNumber}
												disabled
												className="mt-1.5 h-10 bg-muted/50 text-sm font-medium"
											/>
										</div>

										{/* Company - Expanded */}
										<div className="lg:col-span-9">
											<Label className="mb-2 text-sm font-semibold text-foreground">
												<Building2 className="mr-1.5 inline size-4 text-primary" />
												Company <span className="text-destructive">*</span>
											</Label>
											<div className="mt-1.5">
												<CompanyAutocomplete
													control={control}
													name="companyId"
													onChange={(value) => {
														setValue("companyId", value);
														setValue("contactId", "");
													}}
													placeholder="Search or add company..."
												/>
											</div>
										</div>
									</div>

									{/* Second Row - Contact, Currency, Dates & Status */}
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
										{/* Contact */}
										<div className="lg:col-span-2">
											<Label htmlFor="contactId" className="mb-2 text-sm font-semibold text-foreground">
												<User className="mr-1.5 inline size-4 text-muted-foreground" />
												Contact
											</Label>
											<div className="mt-1.5">
												<Select
													value={watch("contactId") || undefined}
													onValueChange={(value) => {
														setValue("contactId", value);
													}}
													disabled={!selectedCompanyId}
												>
													<SelectTrigger id="contactId" className="h-10 text-sm">
														<SelectValue
															placeholder={
																selectedCompanyId
																	? "Select contact"
																	: "Select company first"
															}
														/>
													</SelectTrigger>
													<SelectContent>
														{isLoadingContacts ? (
															<div className="text-muted-foreground px-2 py-1.5 text-sm">
																Loading...
															</div>
														) : (
															filteredContacts.map((contact) => (
																<SelectItem key={contact.id} value={contact.id}>
																	{contact.name}
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
											</div>
										</div>

										{/* Currency */}
										<div>
											<Label htmlFor="currency" className="mb-2 text-sm font-semibold text-foreground">
												Currency
											</Label>
											<Select
												value={selectedCurrency}
												onValueChange={(value) => {
													setValue("currency", value);
												}}
											>
												<SelectTrigger id="currency" className="mt-1.5 h-10 text-sm">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="EUR">EUR</SelectItem>
													<SelectItem value="USD">USD</SelectItem>
													<SelectItem value="GBP">GBP</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{/* Issue Date */}
										<div>
											<Label className="mb-2 text-sm font-semibold text-foreground">
												<CalendarIcon className="mr-1.5 inline size-4 text-muted-foreground" />
												Issue Date
											</Label>
											<div className="mt-1.5">
												<Popover open={issueDateOpen} onOpenChange={setIssueDateOpen}>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															className={cn(
																"h-10 w-full justify-start text-left text-sm font-normal",
																!issueDate && "text-muted-foreground",
															)}
														>
															{issueDate ? (
																format(new Date(issueDate), "dd.MM.yyyy")
															) : (
																<span>Pick date</span>
															)}
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<Calendar
															mode="single"
															selected={issueDate ? new Date(issueDate) : undefined}
															onSelect={(date) => {
																if (date) {
																	setValue("issueDate", date.toISOString().split("T")[0]);
																	setIssueDateOpen(false);
																}
															}}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
											</div>
										</div>

										{/* Expiry Date */}
										<div>
											<Label className="mb-2 text-sm font-semibold text-foreground">
												<CalendarIcon className="mr-1.5 inline size-4 text-muted-foreground" />
												Expiry Date
											</Label>
											<div className="mt-1.5">
												<Popover open={expiryDateOpen} onOpenChange={setExpiryDateOpen}>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															className={cn(
																"h-10 w-full justify-start text-left text-sm font-normal",
																!expiryDate && "text-muted-foreground",
															)}
														>
															{expiryDate ? (
																format(new Date(expiryDate), "dd.MM.yyyy")
															) : (
																<span>Pick date</span>
															)}
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<Calendar
															mode="single"
															selected={expiryDate ? new Date(expiryDate) : undefined}
															onSelect={(date) => {
																if (date) {
																	setValue("expiryDate", date.toISOString().split("T")[0]);
																	setExpiryDateOpen(false);
																}
															}}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
											</div>
										</div>
									</div>

									{/* Status Row */}
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
										<div>
											<Label htmlFor="status" className="mb-2 text-sm font-semibold text-foreground">
												Status
											</Label>
											<Select
												value={watch("status")}
												onValueChange={(value) => {
													setValue("status", value);
												}}
											>
												<SelectTrigger id="status" className="mt-1.5 h-10 text-sm">
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
									</div>
								</section>
								
								{showPreview && (
									<div className="rounded-lg border">
										<div className="bg-black text-white p-8">
											<div className="flex items-start justify-between">
												<div className="bg-white text-black w-12 h-12 flex items-center justify-center rounded-sm">
													<Logo />
												</div>
												<div className="text-sm space-y-1">
													<div className="flex gap-6">
														<span className="text-zinc-400">Invoice NO:</span>
														<span className="font-medium">{watch("quoteNumber")}</span>
													</div>
													<div className="flex gap-6">
														<span className="text-zinc-400">Issue date:</span>
														<span className="font-medium">{issueDate ? format(new Date(issueDate), "dd/MM/yyyy") : "—"}</span>
													</div>
													<div className="flex gap-6">
														<span className="text-zinc-400">Due date:</span>
														<span className="font-medium">{expiryDate ? format(new Date(expiryDate), "dd/MM/yyyy") : "—"}</span>
													</div>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-16 mt-10">
												<div className="space-y-2 text-sm">
													<div className="text-zinc-400">From</div>
													<div>Your Company</div>
													<div>info@yourcompany.com</div>
													<div>+381 60 000 0000</div>
													<div>Address line</div>
													<div>VAT ID: —</div>
												</div>
												<div className="space-y-2 text-sm">
													<div className="text-zinc-400">To</div>
													<div>{selectedCompanyId ? "Selected company" : "Company"}</div>
													<div>{watch("contactId") ? "Selected contact" : "Contact"}</div>
													<div>—</div>
													<div>—</div>
													<div>VAT ID: —</div>
												</div>
											</div>

											<div className="grid grid-cols-3 gap-8 mt-12">
												<div>
													<div className="text-zinc-400 text-sm">Item</div>
													<div className="mt-2 text-sm">{items[0]?.description || "Product / Service"}</div>
												</div>
												<div>
													<div className="text-zinc-400 text-sm">Quantity</div>
													<div className="mt-2 text-sm">{items[0]?.quantity || 1}</div>
												</div>
												<div className="text-right">
													<div className="text-zinc-400 text-sm">Price</div>
													<div className="mt-2 text-sm">{formatCurrency(items[0]?.unitPrice || 0, selectedCurrency)}</div>
												</div>
											</div>

											<div className="mt-8 border-t border-zinc-800 pt-6">
												<div className="flex items-center justify-between text-sm">
													<span className="text-zinc-400">Sales tax</span>
													<span>{formatCurrency(totals.tax, selectedCurrency)}</span>
												</div>
												<div className="mt-2 border-t border-zinc-800" />
												<div className="flex items-center justify-between mt-6">
													<span className="text-zinc-400">Total</span>
													<span className="text-3xl font-bold">{formatCurrency(totals.total, selectedCurrency)}</span>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-16 mt-16 text-sm">
												<div>
													<div className="text-zinc-400">Payment details</div>
													<div className="mt-2">Bank: —</div>
													<div>Account number: —</div>
													<div>Iban: —</div>
												</div>
												<div>
													<div className="text-zinc-400">Note</div>
													<div className="mt-2">{watch("notes") || "—"}</div>
												</div>
											</div>
										</div>
									</div>
								)}

								<Separator className="my-6" />

								{/* Items Section */}
								<section className="space-y-4">
									<div className="flex items-center justify-between border-b pb-2">
										<div className="flex items-center gap-2">
											<FileText className="size-4 text-primary" />
											<h2 className="text-lg font-semibold text-foreground">Line Items</h2>
											<span className="text-muted-foreground text-sm font-normal">
												({items.length} {items.length === 1 ? "item" : "items"})
											</span>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleAddItem}
											className="h-8 gap-1.5 text-xs"
										>
											<Plus className="size-3.5" />
											Add Item
										</Button>
									</div>

									<div className="rounded-lg border">
										<Table>
											<TableHeader>
												<TableRow className="bg-muted/30">
													<TableHead className="w-[50px] text-[12px] font-semibold tracking-wide text-[#6B7280]">#</TableHead>
													<TableHead className="text-[12px] font-semibold tracking-wide text-[#6B7280]">Product</TableHead>
													<TableHead className="text-[12px] font-semibold tracking-wide text-[#6B7280]">Description</TableHead>
													<TableHead className="w-[100px] text-right text-[12px] font-semibold tracking-wide text-[#6B7280]">Qty</TableHead>
													<TableHead className="w-[120px] text-right text-[12px] font-semibold tracking-wide text-[#6B7280]">Unit Price</TableHead>
													<TableHead className="w-[120px] text-right text-[12px] font-semibold tracking-wide text-[#6B7280]">Total</TableHead>
													<TableHead className="w-[50px]"></TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{fields.length === 0 ? (
													<TableRow>
														<TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
															No items. Click &quot;Add Item&quot; to add one.
														</TableCell>
													</TableRow>
												) : (
													fields.map((field, index) => {
														const item = items[index];
														const itemTotal = (item?.quantity || 0) * (item?.unitPrice || 0);
														const hasError = errors.items?.[index];
														return (
															<TableRow key={field.id} className={cn("hover:bg-muted/20", hasError && "border-l-2 border-l-destructive")}>
																<TableCell className="text-muted-foreground text-xs">
																	{index + 1}
																</TableCell>
																<TableCell className="w-[200px]">
																	<ProductAutocomplete
																		value={item?.productId}
																		onChange={(product) => handleProductSelect(index, product)}
																		currency={selectedCurrency}
																		placeholder="Search product..."
																	/>
																</TableCell>
																<TableCell>
																	<div className="space-y-0.5">
																		<Input
																			placeholder="Item description"
																			value={item?.description || ""}
																			onChange={(e) => {
																				setValue(`items.${index}.description`, e.target.value, { shouldValidate: true });
																			}}
																			className={cn(
																				"h-8 border-0 bg-transparent text-sm shadow-none focus-visible:ring-1",
																				hasError && "ring-1 ring-destructive",
																			)}
																		/>
																		{hasError && (
																			<p className="text-destructive text-xs">
																				{hasError.description?.message || "Description is required"}
																			</p>
																		)}
																	</div>
																</TableCell>
																<TableCell className="text-right">
																	<Input
																		type="number"
																		min="1"
																		value={item?.quantity || 1}
																		onChange={(e) => {
																			const value = Number.parseInt(e.target.value, 10) || 1;
																			setValue(`items.${index}.quantity`, value, { shouldValidate: true });
																		}}
																		className="h-8 w-full border-0 bg-transparent text-right text-sm shadow-none focus-visible:ring-1"
																	/>
																</TableCell>
																<TableCell className="text-right">
																	<Input
																		type="number"
																		min="0"
																		step="0.01"
																		value={item?.unitPrice || 0}
																		onChange={(e) => {
																			const value = Number.parseFloat(e.target.value) || 0;
																			setValue(`items.${index}.unitPrice`, value, { shouldValidate: true });
																		}}
																		className="h-8 w-full border-0 bg-transparent text-right text-sm shadow-none focus-visible:ring-1"
																	/>
																</TableCell>
																<TableCell className="text-right font-medium">
																	{formatCurrency(itemTotal, selectedCurrency)}
																</TableCell>
																<TableCell>
																	{fields.length > 1 && (
																		<Button
																			type="button"
																			variant="ghost"
																			size="sm"
																			onClick={() => remove(index)}
																			className="h-7 w-7 p-0 text-destructive hover:text-destructive"
																		>
																			<Trash2 className="size-3.5" />
																		</Button>
																	)}
																</TableCell>
															</TableRow>
														);
													})
												)}
											</TableBody>
											<TableFooter>
												<TableRow>
													<TableCell colSpan={5} className="text-right font-semibold">
														Subtotal
													</TableCell>
													<TableCell className="text-right font-semibold">
														{formatCurrency(totals.subtotal, selectedCurrency)}
													</TableCell>
													<TableCell></TableCell>
												</TableRow>
												<TableRow>
													<TableCell colSpan={5} className="text-right font-semibold">
														VAT (20%)
													</TableCell>
													<TableCell className="text-right font-semibold">
														{formatCurrency(totals.tax, selectedCurrency)}
													</TableCell>
													<TableCell></TableCell>
												</TableRow>
												<TableRow className="bg-muted/30">
													<TableCell colSpan={5} className="text-right text-base font-bold">
														Total
													</TableCell>
													<TableCell className="text-right text-base font-bold">
														{formatCurrency(totals.total, selectedCurrency)}
													</TableCell>
													<TableCell></TableCell>
												</TableRow>
											</TableFooter>
										</Table>
									</div>
								</section>

								<Separator className="my-6" />

								{/* Notes Section */}
								<section className="space-y-4">
									<div className="flex items-center gap-2 border-b pb-2">
										<FileText className="size-4 text-primary" />
										<h2 className="text-lg font-semibold text-foreground">Additional Notes</h2>
									</div>
									<div className="space-y-2">
										<Textarea
											id="notes"
											placeholder="Add any additional notes, terms, or conditions..."
											rows={4}
											{...register("notes")}
											className="text-sm resize-none"
										/>
									</div>
								</section>
							</div>
						</div>

						<Separator className="shrink-0" />

						<SheetFooter className="flex shrink-0 justify-end gap-2 border-t bg-muted/20 px-6 py-4">
							<SheetClose asChild>
								<Button type="button" variant="ghost" className="h-9">
									Cancel
								</Button>
							</SheetClose>
							<Button type="submit" disabled={createQuoteMutation.isPending} className="h-9">
								{createQuoteMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									"Create Quote"
								)}
							</Button>
						</SheetFooter>
					</form>
				</FormProvider>
			</SheetContent>
		</Sheet>
	);
}
