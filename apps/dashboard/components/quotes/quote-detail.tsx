"use client";

import type { Account, Quote } from "@crm/types";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useQuery } from "@tanstack/react-query";
import {
	Building2,
	CheckCircle2,
	FileEdit,
	FileText,
	Globe,
	Home,
	Mail,
	MapPin,
	Phone,
	Send,
	XCircle,
} from "lucide-react";
import * as React from "react";
import Logo from "@/components/layout/logo";
import { QuoteActions } from "@/components/quotes/quote-actions";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { useQuote } from "@/src/hooks/useQuotes";
import { ensureResponse } from "@/src/lib/fetch-utils";

// Mapiranje country kodova u pun naziv
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

type StatusConfig = {
	variant: "warning" | "info" | "success" | "destructive";
	icon: React.ReactNode;
};

const statusConfig: Record<string, StatusConfig> = {
	draft: {
		variant: "warning",
		icon: <FileEdit className="size-3" />,
	},
	sent: {
		variant: "info",
		icon: <Send className="size-3" />,
	},
	accepted: {
		variant: "success",
		icon: <CheckCircle2 className="size-3" />,
	},
	rejected: {
		variant: "destructive",
		icon: <XCircle className="size-3" />,
	},
};

type QuoteDetailProps = {
	quoteId: number | null;
	open: boolean;
	onClose: () => void;
	onEdit?: (_quote: Quote) => void;
	onDelete?: (_quoteId: number) => void;
};

async function fetchAccount(accountId: string): Promise<Account> {
	const response = await ensureResponse(
		fetch(`/api/accounts/${accountId}`, {
			cache: "no-store",
			headers: {
				Accept: "application/json",
			},
		}),
	);
	const payload = (await response.json()) as { account: Account };
	return payload.account;
}

export function QuoteDetail({
	quoteId,
	open,
	onClose,
	onEdit,
	onDelete,
}: QuoteDetailProps) {
	const {
		data: quote,
		isLoading,
		isError,
		error,
	} = useQuote(quoteId ?? 0, {
		enabled: open && Boolean(quoteId),
	});

	const companyId = quote?.companyId ?? null;

	const {
		data: company,
		isLoading: isCompanyLoading,
		isError: isCompanyError,
		error: companyError,
	} = useQuery({
		queryKey: ["account", companyId],
		queryFn: () => {
			if (!companyId) {
				throw new Error("No companyId provided");
			}
			console.log("[QuoteDetail] Fetching account:", companyId);
			return fetchAccount(companyId);
		},
		enabled: open && Boolean(companyId),
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});

	React.useEffect(() => {
		if (open && quote) {
			console.log("[QuoteDetail] Quote data:", {
				id: quote.id,
				companyId: quote.companyId,
				companyName: quote.companyName,
				contactId: quote.contactId,
				contactName: quote.contactName,
			});
		}
	}, [open, quote]);

	React.useEffect(() => {
		if (isCompanyError) {
			console.error("[QuoteDetail] Company fetch error:", companyError);
		}
		if (company) {
			console.log("[QuoteDetail] Company loaded:", company);
		}
	}, [isCompanyError, companyError, company]);

	React.useEffect(() => {
		if (!open) {
			return undefined;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose]);

	React.useEffect(() => {
		if (open) {
			const original = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = original;
			};
		}
		return undefined;
	}, [open]);

	return (
		<Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<SheetContent
				side="right"
				className="w-full p-0 md:w-[calc(50vw)] md:max-w-[900px] [&>button]:hidden"
			>
				<VisuallyHidden>
					<SheetTitle>
						{quote?.quoteNumber
							? `Quote ${quote.quoteNumber}`
							: "Quote Details"}
					</SheetTitle>
				</VisuallyHidden>
				<div className="flex h-full flex-col">
					<header className="sticky top-0 z-10 bg-background"></header>

					<div className="flex-1 overflow-y-auto px-3 py-3 pb-20">
						{isLoading ? (
							<div className="text-muted-foreground flex h-full items-center justify-center text-sm">
								Loading quote details...
							</div>
						) : isError ? (
							<div className="flex h-full flex-col items-center justify-center gap-2 text-center">
								<p className="text-destructive text-sm font-medium">
									Failed to load quote details.
								</p>
								<p className="text-muted-foreground text-xs">
									{error instanceof Error
										? error.message
										: "An unexpected error occurred."}
								</p>
							</div>
						) : !quote ? (
							<div className="text-muted-foreground flex h-full items-center justify-center text-sm">
								Quote not found.
							</div>
						) : (
							<div className="space-y-8">
								<section className="space-y-4">
									<div className="border-border/60 bg-muted/40 rounded-lg border p-3">
										<div className="mb-4 space-y-4 pb-4">
											<div className="flex items-center justify-between gap-3">
												<div className="flex flex-wrap items-center gap-3">
													<h2 className="text-xl leading-tight font-semibold">
														{quote.quoteNumber}
													</h2>
													<Badge
														variant={
															statusConfig[quote.status]?.variant || "secondary"
														}
														icon={statusConfig[quote.status]?.icon}
														className="capitalize"
													>
														{quote.status.charAt(0).toUpperCase() +
															quote.status.slice(1)}
													</Badge>
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
													{formatDate(quote.updatedAt)}
												</p>
												<span className="text-muted-foreground">•</span>
												<p className="text-muted-foreground">
													{`Issued on ${formatDate(quote.issueDate)}${
														quote.expiryDate
															? ` • Expires on ${formatDate(quote.expiryDate)}`
															: ""
													}`}
												</p>
											</div>
										</div>
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 space-y-4">
												<div className="space-y-2">
													<div className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
														<Building2 className="h-4 w-4" aria-hidden="true" />
														Company
													</div>
													{companyId ? (
														isCompanyLoading ? (
															<p className="text-muted-foreground text-sm">
																Loading company information…
															</p>
														) : isCompanyError ? (
															<div className="space-y-2">
																{quote.companyName ? (
																	<p className="text-foreground text-base font-semibold">
																		{quote.companyName}
																	</p>
																) : null}
																<p className="text-muted-foreground text-sm">
																	Failed to load company details.
																	{companyError instanceof Error
																		? ` ${companyError.message}`
																		: ""}
																</p>
															</div>
														) : company ? (
															<div className="space-y-3 text-sm">
																<div>
																	<p className="text-foreground text-base font-semibold">
																		{company.name}
																	</p>
																</div>
																<div className="flex items-center gap-6 flex-wrap">
																	<div className="inline-flex items-center gap-2">
																		<Home
																			className="h-4 w-4"
																			aria-hidden="true"
																		/>
																		<span>
																			<span className="font-medium">
																				Address:
																			</span>{" "}
																			<span className="text-muted-foreground">
																				Not provided
																			</span>
																		</span>
																	</div>
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
																	<div className="inline-flex items-center gap-2 text-muted-foreground">
																		<Mail
																			className="h-4 w-4"
																			aria-hidden="true"
																		/>
																		<span>{company.email}</span>
																	</div>
																	{company.phone && (
																		<div className="inline-flex items-center gap-2 text-muted-foreground">
																			<Phone
																				className="h-4 w-4"
																				aria-hidden="true"
																			/>
																			<span>{company.phone}</span>
																		</div>
																	)}
																</div>
																{company.website && (
																	<div className="flex items-center gap-2 text-muted-foreground">
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
															<div className="space-y-2">
																{quote.companyName ? (
																	<p className="text-foreground text-base font-semibold">
																		{quote.companyName}
																	</p>
																) : null}
																<p className="text-muted-foreground text-sm">
																	Company details unavailable.
																</p>
															</div>
														)
													) : quote.companyName ? (
														<p className="text-foreground text-base font-semibold">
															{quote.companyName}
														</p>
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
																{formatCurrency(quote.total, quote.currency)}
															</p>
														</div>
														<div className="text-center">
															<p className="text-muted-foreground text-sm font-medium">
																Billing contact:
															</p>
															<p className="text-foreground text-base font-semibold">
																{quote.contactName || "—"}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground text-sm font-medium">
																Currency
															</p>
															<p className="text-foreground text-base font-semibold">
																{quote.currency}
															</p>
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
											{quote.items?.length ?? 0} line items
										</p>
									</div>
									{quote.items && quote.items.length > 0 ? (
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
														<TableHead className="text-right">Disc %</TableHead>
														<TableHead className="text-right">VAT %</TableHead>
														<TableHead className="text-right!">
															Amount
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{quote.items.map((item, index) => (
														<TableRow key={item.id}>
															<TableCell className="text-muted-foreground text-sm align-top">
																{index + 1}
															</TableCell>
															<TableCell className="align-top">
																<div className="space-y-1">
																	<p className="font-medium">
																		{item.description || "—"}
																	</p>
																	{item.productId && (
																		<span className="text-muted-foreground text-xs">
																			Product ID: {item.productId}
																		</span>
																	)}
																</div>
															</TableCell>
															<TableCell className="text-right text-sm align-top">
																{item.quantity}
															</TableCell>
															<TableCell className="text-right text-sm align-top">
																{"pcs"}
															</TableCell>
															<TableCell className="text-right text-sm align-top">
																{formatCurrency(item.unitPrice, quote.currency)}
															</TableCell>
															<TableCell className="text-right text-sm align-top">
																{"0%"}
															</TableCell>
															<TableCell className="text-right text-sm align-top">
																{"20%"}
															</TableCell>
															<TableCell className="text-right! font-medium align-top">
																{formatCurrency(item.total, quote.currency)}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
												<TableFooter>
													{(() => {
														const amountBeforeDiscount =
															quote.items?.reduce(
																(sum, item) =>
																	sum + item.unitPrice * item.quantity,
																0,
															) ?? 0;
														const discount =
															amountBeforeDiscount - quote.subtotal;
														return (
															<>
																<TableRow className="bg-background">
																	<TableCell
																		colSpan={7}
																		className="text-right font-semibold text-foreground"
																	>
																		Amount before discount
																	</TableCell>
																	<TableCell className="text-right! font-semibold text-foreground">
																		{formatCurrency(
																			amountBeforeDiscount,
																			quote.currency,
																		)}
																	</TableCell>
																</TableRow>
																<TableRow className="bg-background">
																	<TableCell
																		colSpan={7}
																		className="text-right font-semibold text-foreground"
																	>
																		Discount
																	</TableCell>
																	<TableCell className="text-right! font-semibold text-destructive">
																		{discount > 0 ? "-" : ""}
																		{formatCurrency(
																			Math.abs(discount),
																			quote.currency,
																		)}
																	</TableCell>
																</TableRow>
																<TableRow className="bg-background">
																	<TableCell
																		colSpan={7}
																		className="text-right font-semibold text-foreground"
																	>
																		Subtotal
																	</TableCell>
																	<TableCell className="text-right! font-semibold text-foreground">
																		{formatCurrency(
																			quote.subtotal,
																			quote.currency,
																		)}
																	</TableCell>
																</TableRow>
																<TableRow className="bg-background">
																	<TableCell
																		colSpan={7}
																		className="text-right font-semibold text-foreground"
																	>
																		VAT Amount (20%)
																	</TableCell>
																	<TableCell className="text-right! font-semibold text-foreground">
																		{formatCurrency(quote.tax, quote.currency)}
																	</TableCell>
																</TableRow>
																<TableRow className="bg-muted/80 border-t-2 border-foreground/10">
																	<TableCell
																		colSpan={7}
																		className="text-right font-bold text-foreground text-base"
																	>
																		Total
																	</TableCell>
																	<TableCell className="text-right! font-bold text-foreground text-base">
																		{formatCurrency(
																			quote.total,
																			quote.currency,
																		)}
																	</TableCell>
																</TableRow>
															</>
														);
													})()}
												</TableFooter>
											</Table>
										</div>
									) : (
										<p className="text-muted-foreground text-sm">
											No items in this quote.
										</p>
									)}
								</section>

								{quote.notes ? (
									<section className="space-y-4">
										<div className="border-border/60 bg-muted/40 rounded-lg border p-3">
											<div className="space-y-2">
												<div className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
													<FileText className="h-4 w-4" aria-hidden="true" />
													Notes
												</div>
												<p className="text-foreground text-sm leading-relaxed">
													{quote.notes}
												</p>
											</div>
										</div>
									</section>
								) : null}
							</div>
						)}
					</div>

					{quote ? (
						<div className="fixed bottom-8 right-6 z-50">
							<QuoteActions quote={quote} onEdit={onEdit} onDelete={onDelete} />
						</div>
					) : null}
				</div>
			</SheetContent>
		</Sheet>
	);
}
