"use client";

import type { Account, QuoteItemCreateInput } from "@crm/types";
import { QUOTE_STATUSES } from "@crm/types";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useQuery } from "@tanstack/react-query";
import { Building2, FileText, Globe, Mail, MapPin, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { CompanyAutocomplete } from "@/components/forms/CompanyAutocomplete";
import Logo from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useContacts } from "@/src/hooks/useContacts";
import { useCreateQuote } from "@/src/hooks/useQuotes";
import { ensureResponse } from "@/src/lib/fetch-utils";
import { QuoteActions } from "./QuoteActions";

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

const STATUS_COLORS: Record<
	string,
	{
		variant: "warning" | "info" | "success" | "destructive";
		icon: React.ReactNode;
	}
> = {
	draft: {
		variant: "warning",
		icon: <FileText className="size-3" />,
	},
	sent: {
		variant: "info",
		icon: <Mail className="size-3" />,
	},
	accepted: {
		variant: "success",
		icon: <Phone className="size-3" />,
	},
	rejected: {
		variant: "destructive",
		icon: <Phone className="size-3" />,
	},
};

const getCountryName = (code: string | null | undefined): string => {
	if (!code) return "—";

	const countryMap: Record<string, string> = {
		RS: "Serbia",
		US: "United States",
		GB: "United Kingdom",
		DE: "Germany",
		FR: "France",
		IT: "Italy",
		ES: "Spain",
		NL: "Netherlands",
		BE: "Belgium",
		CH: "Switzerland",
		AT: "Austria",
		PL: "Poland",
		HR: "Croatia",
		BA: "Bosnia and Herzegovina",
		ME: "Montenegro",
		MK: "North Macedonia",
		SI: "Slovenia",
		HU: "Hungary",
		RO: "Romania",
		BG: "Bulgaria",
		GR: "Greece",
		TR: "Turkey",
		CN: "China",
		JP: "Japan",
		KR: "South Korea",
		IN: "India",
		AU: "Australia",
		CA: "Canada",
		MX: "Mexico",
		BR: "Brazil",
		AR: "Argentina",
		ZA: "South Africa",
		AE: "United Arab Emirates",
		SA: "Saudi Arabia",
		IL: "Israel",
		NZ: "New Zealand",
	};

	return countryMap[code.toUpperCase()] || code;
};

async function fetchAccount(id: string): Promise<Account> {
  const response = await ensureResponse(
    fetch(`/api/accounts/${id}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    }),
  );
  const payload = (await response.json()) as { account: Account };
  return payload.account;
}

export function CreateQuote() {
	const router = useRouter();
	const { toast } = useToast();
	const createQuoteMutation = useCreateQuote();
	const { data: contacts = [] } = useContacts();

	const [issueDateOpen, setIssueDateOpen] = useState(false);
	const [expiryDateOpen, setExpiryDateOpen] = useState(false);
	const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
	const [currencyPopoverOpen, setCurrencyPopoverOpen] = useState(false);
	const [contactPopoverOpen, setContactPopoverOpen] = useState(false);

	const [quoteNumber] = useState(() => {
		const year = new Date().getFullYear();
		const random = Math.floor(Math.random() * 1000)
			.toString()
			.padStart(3, "0");
		return `QUO-${year}-${random}`;
	});

	const methods = useForm<QuoteFormData>({
		defaultValues: {
			quoteNumber,
			companyId: "",
			contactId: "",
			issueDate: new Date().toISOString().split("T")[0],
			expiryDate: "",
			currency: "EUR",
			status: "draft",
			notes: "",
			items: [{ description: "", quantity: 1, unitPrice: 0 }],
		},
	});

	const { handleSubmit, control, watch, setValue } = methods;

	const selectedCompanyId = watch("companyId");
	const selectedCurrency = watch("currency");
	const selectedStatus = watch("status");
	const issueDate = watch("issueDate");
	const expiryDate = watch("expiryDate");
	const notes = watch("notes");
	const contactId = watch("contactId");

	const { fields, append, remove } = useFieldArray({
		control,
		name: "items",
	});

	const items = watch("items");

	const { data: company, isLoading: isCompanyLoading } = useQuery({
		queryKey: ["account", selectedCompanyId],
		queryFn: () => fetchAccount(selectedCompanyId),
		enabled: !!selectedCompanyId,
	});

	const filteredContacts = contacts.filter(
		(contact) => !selectedCompanyId || contact.accountId === selectedCompanyId,
	);

	const selectedContact = filteredContacts.find((c) => c.id === contactId);

	const totals = useMemo(() => {
		const subtotal = items.reduce(
			(sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
			0,
		);
		const tax = subtotal * 0.2;
		const total = subtotal + tax;

		return {
			subtotal,
			tax,
			total,
		};
	}, [items]);

	useEffect(() => {
		setValue("quoteNumber", quoteNumber);
	}, [quoteNumber, setValue]);

	const onSubmit = async (data: QuoteFormData) => {
		const validItems = data.items.filter(
			(item) => item.description || item.productId || item.unitPrice > 0,
		);

		if (validItems.length === 0) {
			toast({
				title: "Validation Error",
				description: "Please add at least one item to the quote.",
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

			router.push("/quotes");
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to create quote",
				variant: "destructive",
			});
		}
	};

	const handleSaveDraft = async () => {
		const currentValues = methods.getValues();
		try {
			await createQuoteMutation.mutateAsync({
				quoteNumber: currentValues.quoteNumber,
				companyId: currentValues.companyId || undefined,
				contactId: currentValues.contactId || undefined,
				issueDate: currentValues.issueDate,
				expiryDate: currentValues.expiryDate || undefined,
				currency: currentValues.currency,
				status: "draft",
				notes: currentValues.notes || undefined,
				items: currentValues.items.filter(
					(item) => item.description || item.productId || item.unitPrice > 0,
				),
			});

			toast({
				title: "Draft Saved",
				description: "Your quote has been saved as a draft.",
			});
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to save draft",
				variant: "destructive",
			});
		}
	};

	return (
		<Sheet open={true} onOpenChange={(open) => !open && router.push("/quotes")}>
			<SheetContent
				side="right"
				className="w-full p-0 md:w-[calc(50vw)] md:max-w-[900px] [&>button]:hidden"
			>
				<VisuallyHidden>
					<SheetTitle>Create New Quote</SheetTitle>
				</VisuallyHidden>
				<div className="flex h-full flex-col">
					<header className="bg-background sticky top-0 z-10"></header>

					<div className="flex-1 overflow-y-auto px-3 py-3 pb-20">
						<FormProvider {...methods}>
							<form
								onSubmit={handleSubmit((data) =>
									onSubmit(data as QuoteFormData),
								)}
							>
								<div className="space-y-8">
									<section className="space-y-4">
										<div className="border-border/60 bg-muted/40 rounded-lg border p-3">
											<div className="mb-4 space-y-4 pb-4">
												<div className="flex items-center justify-between gap-3">
													<div className="flex flex-wrap items-center gap-3">
														<h2 className="text-xl leading-tight font-semibold">
															{quoteNumber}
														</h2>
														<Popover
															open={statusPopoverOpen}
															onOpenChange={setStatusPopoverOpen}
														>
															<PopoverTrigger asChild>
																<button type="button">
																	<Badge
																		variant={
																			STATUS_COLORS[selectedStatus]?.variant ||
																			"secondary"
																		}
																		icon={STATUS_COLORS[selectedStatus]?.icon}
																		className="cursor-pointer capitalize"
																	>
																		{selectedStatus.charAt(0).toUpperCase() +
																			selectedStatus.slice(1)}
																	</Badge>
																</button>
															</PopoverTrigger>
															<PopoverContent
																className="w-auto p-0"
																align="start"
															>
																<div className="p-2">
																	{QUOTE_STATUSES.map((status) => (
																		<button
																			key={status}
																			type="button"
																			onClick={() => {
																				setValue("status", status);
																				setStatusPopoverOpen(false);
																			}}
																			className={cn(
																				"hover:bg-accent w-full rounded-md px-3 py-2 text-left text-sm",
																				selectedStatus === status &&
																					"bg-accent",
																			)}
																		>
																			{status.charAt(0).toUpperCase() +
																				status.slice(1)}
																		</button>
																	))}
																</div>
															</PopoverContent>
														</Popover>
													</div>
													<div className="shrink-0">
														<div className="scale-[1.4]">
															<Logo />
														</div>
													</div>
												</div>
												<div className="flex flex-wrap items-center gap-2 text-sm">
													<p className="text-muted-foreground">
														<span className="font-medium">Updated:</span>{" "}
														{formatDate(new Date())}
													</p>
													<span className="text-muted-foreground">•</span>
													<p className="text-muted-foreground">
														<Popover
															open={issueDateOpen}
															onOpenChange={setIssueDateOpen}
														>
															<PopoverTrigger asChild>
																<button
																	type="button"
																	className="text-muted-foreground hover:text-foreground inline"
																>
																	Issued on {formatDate(new Date(issueDate))}
																</button>
															</PopoverTrigger>
															<PopoverContent
																className="w-auto p-0"
																align="start"
															>
																<Calendar
																	mode="single"
																	selected={new Date(issueDate)}
																	onSelect={(date) => {
																		if (date) {
																			setValue(
																				"issueDate",
																				date.toISOString().split("T")[0],
																			);
																			setIssueDateOpen(false);
																		}
																	}}
																	initialFocus
																/>
															</PopoverContent>
														</Popover>
														{expiryDate ? (
															<>
																{" • "}
																<Popover
																	open={expiryDateOpen}
																	onOpenChange={setExpiryDateOpen}
																>
																	<PopoverTrigger asChild>
																		<button
																			type="button"
																			className="text-muted-foreground hover:text-foreground inline"
																		>
																			Expires on{" "}
																			{formatDate(new Date(expiryDate))}
																		</button>
																	</PopoverTrigger>
																	<PopoverContent
																		className="w-auto p-0"
																		align="start"
																	>
																		<Calendar
																			mode="single"
																			selected={new Date(expiryDate)}
																			onSelect={(date) => {
																				if (date) {
																					setValue(
																						"expiryDate",
																						date.toISOString().split("T")[0],
																					);
																					setExpiryDateOpen(false);
																				}
																			}}
																			initialFocus
																		/>
																	</PopoverContent>
																</Popover>
															</>
														) : (
															<>
																{" • "}
																<Popover
																	open={expiryDateOpen}
																	onOpenChange={setExpiryDateOpen}
																>
																	<PopoverTrigger asChild>
																		<button
																			type="button"
																			className="text-muted-foreground hover:text-foreground inline"
																		>
																			Add expiry date
																		</button>
																	</PopoverTrigger>
																	<PopoverContent
																		className="w-auto p-0"
																		align="start"
																	>
																		<Calendar
																			mode="single"
																			onSelect={(date) => {
																				if (date) {
																					setValue(
																						"expiryDate",
																						date.toISOString().split("T")[0],
																					);
																					setExpiryDateOpen(false);
																				}
																			}}
																			initialFocus
																		/>
																	</PopoverContent>
																</Popover>
															</>
														)}
													</p>
												</div>
											</div>
											<div className="flex items-start justify-between gap-4">
												<div className="flex-1 space-y-4">
													<div className="space-y-2">
														<div className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
															<Building2
																className="h-4 w-4"
																aria-hidden="true"
															/>
															Company
														</div>
														{!selectedCompanyId ? (
															<div className="w-full max-w-md">
																<CompanyAutocomplete
																	control={control}
																	name="companyId"
																	onChange={(value) => {
																		setValue("companyId", value);
																		setValue("contactId", "");
																	}}
																	placeholder="Search or add company…"
																/>
															</div>
														) : isCompanyLoading ? (
															<p className="text-muted-foreground text-sm">
																Loading company information…
															</p>
														) : company ? (
															<div className="space-y-3 text-sm">
																<div>
																	<p className="text-foreground text-base font-semibold">
																		{company.name}
																	</p>
																</div>
																<div className="flex flex-wrap items-center gap-6">
																	{/* Address removed - Account type doesn't have address property */}
																	{company.country && (
																		<div className="inline-flex items-center gap-2">
																			<MapPin
																				className="h-4 w-4"
																				aria-hidden="true"
																			/>
																			<span>
																				{getCountryName(company.country)}
																			</span>
																		</div>
																	)}
																	<div className="text-muted-foreground inline-flex items-center gap-2">
																		<Mail
																			className="h-4 w-4"
																			aria-hidden="true"
																		/>
																		<span>{company.email}</span>
																	</div>
																	{company.phone && (
																		<div className="text-muted-foreground inline-flex items-center gap-2">
																			<Phone
																				className="h-4 w-4"
																				aria-hidden="true"
																			/>
																			<span>{company.phone}</span>
																		</div>
																	)}
																</div>
																{company.website && (
																	<div className="text-muted-foreground flex items-center gap-2">
																		<Globe
																			className="h-4 w-4"
																			aria-hidden="true"
																		/>
																		<span className="font-medium">web</span>
																		<span className="truncate">
																			{company.website}
																		</span>
																	</div>
																)}
															</div>
														) : (
															<p className="text-muted-foreground text-sm">
																This quote is not linked to a company.
															</p>
														)}
													</div>

													<div className="border-t pt-4">
														<div className="flex items-start justify-between gap-4">
															<div>
																<p className="text-muted-foreground text-sm font-medium">
																	Totals
																</p>
																<p className="text-foreground text-base font-semibold">
																	{formatCurrency(
																		totals.total,
																		selectedCurrency,
																	)}
																</p>
															</div>
															<div className="text-center">
																<p className="text-muted-foreground text-sm font-medium">
																	Billing contact:
																</p>
																{contactId && selectedContact ? (
																	<p className="text-foreground text-base font-semibold">
																		{selectedContact.name}
																	</p>
																) : (
																	<Popover
																		open={contactPopoverOpen}
																		onOpenChange={setContactPopoverOpen}
																	>
																		<PopoverTrigger asChild>
																			<button
																				type="button"
																				className="text-foreground text-base font-semibold hover:underline"
																				disabled={!selectedCompanyId}
																			>
																				—
																			</button>
																		</PopoverTrigger>
																		<PopoverContent
																			className="w-auto p-0"
																			align="center"
																		>
																			<div className="p-2">
																				{filteredContacts.length > 0 ? (
																					filteredContacts.map((contact) => (
																						<button
																							key={contact.id}
																							type="button"
																							onClick={() => {
																								setValue(
																									"contactId",
																									contact.id,
																								);
																								setContactPopoverOpen(false);
																							}}
																							className="hover:bg-accent w-full rounded-md px-3 py-2 text-left text-sm"
																						>
																							{contact.name}
																						</button>
																					))
																				) : (
																					<p className="text-muted-foreground px-3 py-2 text-sm">
																						No contacts available
																					</p>
																				)}
																			</div>
																		</PopoverContent>
																	</Popover>
																)}
															</div>
															<div>
																<p className="text-muted-foreground text-sm font-medium">
																	Currency
																</p>
																<Popover
																	open={currencyPopoverOpen}
																	onOpenChange={setCurrencyPopoverOpen}
																>
																	<PopoverTrigger asChild>
																		<button
																			type="button"
																			className="text-foreground text-base font-semibold hover:underline"
																		>
																			{selectedCurrency}
																		</button>
																	</PopoverTrigger>
																	<PopoverContent
																		className="w-auto p-0"
																		align="end"
																	>
																		<div className="p-2">
																			{["EUR", "USD", "GBP"].map((currency) => (
																				<button
																					key={currency}
																					type="button"
																					onClick={() => {
																						setValue("currency", currency);
																						setCurrencyPopoverOpen(false);
																					}}
																					className={cn(
																						"hover:bg-accent w-full rounded-md px-3 py-2 text-left text-sm",
																						selectedCurrency === currency &&
																							"bg-accent",
																					)}
																				>
																					{currency}
																				</button>
																			))}
																		</div>
																	</PopoverContent>
																</Popover>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</section>

									<Separator />

									<section className="space-y-4">
										<div className="flex items-center justify-between">
											<h3 className="text-lg font-semibold">Items</h3>
											<p className="text-muted-foreground text-xs tracking-wide uppercase">
												{items.length} line items
											</p>
										</div>
										{items && items.length > 0 ? (
											<div className="relative overflow-x-auto rounded-xl border">
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead className="w-[40px]">#</TableHead>
															<TableHead>Description</TableHead>
															<TableHead className="text-right">Qty</TableHead>
															<TableHead className="text-right">Unit</TableHead>
															<TableHead className="text-right">
																Unit Price
															</TableHead>
															<TableHead className="text-right">
																VAT %
															</TableHead>
															<TableHead className="text-right!">
																Amount
															</TableHead>
															<TableHead className="w-[40px]"></TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{fields.map((field, index) => {
															const item = items[index];
															const itemTotal =
																(item?.quantity || 0) * (item?.unitPrice || 0);
															return (
																<TableRow key={field.id}>
																	<TableCell className="text-muted-foreground align-top text-sm">
																		{index + 1}
																	</TableCell>
																	<TableCell className="align-top">
																		<div className="space-y-1">
																			<Input
																				placeholder="Item description"
																				value={item?.description || ""}
																				onChange={(e) =>
																					setValue(
																						`items.${index}.description`,
																						e.target.value,
																					)
																				}
																				className="hover:bg-muted/50 -mx-1 h-auto rounded border-0 bg-transparent p-0 px-1 font-medium shadow-none focus-visible:ring-0"
																			/>
																		</div>
																	</TableCell>
																	<TableCell className="text-right align-top text-sm">
																		<Input
																			type="number"
																			min="1"
																			value={item?.quantity || 1}
																			onChange={(e) =>
																				setValue(
																					`items.${index}.quantity`,
																					Number.parseInt(e.target.value, 10) ||
																						1,
																				)
																			}
																			className="hover:bg-muted/50 -mx-1 h-auto w-auto min-w-[2ch] rounded border-0 bg-transparent p-0 px-1 text-right shadow-none focus-visible:ring-0"
																		/>
																	</TableCell>
																	<TableCell className="text-right align-top text-sm">
																		pcs
																	</TableCell>
																	<TableCell className="text-right align-top text-sm">
																		<Input
																			type="number"
																			min="0"
																			step="0.01"
																			value={item?.unitPrice || 0}
																			onChange={(e) =>
																				setValue(
																					`items.${index}.unitPrice`,
																					Number.parseFloat(e.target.value) ||
																						0,
																				)
																			}
																			className="hover:bg-muted/50 -mx-1 h-auto w-auto min-w-[4ch] rounded border-0 bg-transparent p-0 px-1 text-right shadow-none focus-visible:ring-0"
																		/>
																	</TableCell>
																	<TableCell className="text-right align-top text-sm">
																		20%
																	</TableCell>
																	<TableCell className="text-right! align-top font-medium">
																		{formatCurrency(
																			itemTotal,
																			selectedCurrency,
																		)}
																	</TableCell>
																	<TableCell className="align-top">
																		{fields.length > 1 && (
																			<Button
																				type="button"
																				variant="ghost"
																				size="sm"
																				onClick={() => remove(index)}
																				className="text-destructive h-8 w-8 p-0"
																			>
																				×
																			</Button>
																		)}
																	</TableCell>
																</TableRow>
															);
														})}
													</TableBody>
													<TableFooter>
														<TableRow className="bg-background">
															<TableCell
																colSpan={6}
																className="text-foreground text-right font-semibold"
															>
																Subtotal
															</TableCell>
															<TableCell className="text-foreground text-right! font-semibold">
																{formatCurrency(
																	totals.subtotal,
																	selectedCurrency,
																)}
															</TableCell>
														</TableRow>
														<TableRow className="bg-background">
															<TableCell
																colSpan={6}
																className="text-foreground text-right font-semibold"
															>
																VAT Amount (20%)
															</TableCell>
															<TableCell className="text-foreground text-right! font-semibold">
																{formatCurrency(totals.tax, selectedCurrency)}
															</TableCell>
														</TableRow>
														<TableRow className="bg-muted/80 border-foreground/10 border-t-2">
															<TableCell
																colSpan={6}
																className="text-foreground text-right text-base font-bold"
															>
																Total
															</TableCell>
															<TableCell className="text-foreground text-right! text-base font-bold">
																{formatCurrency(totals.total, selectedCurrency)}
															</TableCell>
														</TableRow>
													</TableFooter>
												</Table>
											</div>
										) : (
											<p className="text-muted-foreground text-sm">
												No items in this quote.
											</p>
										)}
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onClick={() => {
												append({ description: "", quantity: 1, unitPrice: 0 });
											}}
											className="mt-4"
										>
											Add Item
										</Button>
									</section>

									<section className="space-y-4">
										<div className="border-border/60 bg-muted/40 rounded-lg border p-3">
											<div className="space-y-2">
												<div className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
													<FileText className="h-4 w-4" aria-hidden="true" />
													Notes
												</div>
												<Textarea
													placeholder="Add notes…"
													value={notes || ""}
													onChange={(e) => setValue("notes", e.target.value)}
													className="min-h-[100px] border-0 bg-transparent p-0 text-sm leading-relaxed shadow-none focus-visible:ring-0"
												/>
											</div>
										</div>
									</section>
								</div>
							</form>
						</FormProvider>
					</div>

					<div className="fixed right-6 bottom-8 z-50">
						<QuoteActions
							onSaveDraft={handleSaveDraft}
							onCancel={() => router.push("/quotes")}
							isSubmitting={createQuoteMutation.isPending}
						/>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
