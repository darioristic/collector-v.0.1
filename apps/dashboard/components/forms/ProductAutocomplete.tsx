"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Package } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ensureResponse } from "@/src/lib/fetch-utils";

type Product = {
	id: string;
	name: string;
	sku: string;
	price: number;
	currency: string;
	description?: string | null;
};

type ProductAutocompleteProps = {
	value?: string;
	onChange: (product: Product | null) => void;
	disabled?: boolean;
	placeholder?: string;
	currency?: string;
};

async function searchProducts(
	query: string,
	currency?: string,
): Promise<Product[]> {
	const trimmed = query.trim();
	const safeQuery = trimmed.slice(0, 255);
	const params = new URLSearchParams({
		search: safeQuery,
		limit: "20",
		...(currency && { currency }),
	});

	const response = await ensureResponse(
		fetch(`/api/products?${params.toString()}`, {
			cache: "no-store",
			headers: {
				Accept: "application/json",
			},
		}),
	);

	const data = (await response.json()) as { data: unknown; total?: number };

	type ApiProduct = {
		id: string;
		name: string;
		sku?: string | null;
		price: number | string | null;
		currency?: string | null;
		description?: string | null;
	};

	const rawData = (data as { data?: unknown }).data;
	const rawList: unknown[] = Array.isArray(rawData) ? rawData : [];

	return rawList.map((item) => {
		const p = item as Partial<ApiProduct>;
		const priceVal =
			typeof p.price === "number"
				? p.price
				: p.price
					? Number.parseFloat(String(p.price)) || 0
					: 0;

		return {
			id: String(p.id ?? ""),
			name: String(p.name ?? ""),
			sku: p.sku ?? "",
			price: priceVal,
			currency: p.currency ?? "EUR",
			description: p.description ?? null,
		};
	});
}

export function ProductAutocomplete({
	value,
	onChange,
	disabled = false,
	placeholder = "Search products…",
	currency,
}: ProductAutocompleteProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const { data: products = [], isLoading } = useQuery({
		queryKey: ["products", "search", searchQuery, currency],
		queryFn: () => searchProducts(searchQuery, currency),
		enabled: searchQuery.trim().length > 0,
		staleTime: 1000 * 60 * 5,
	});

	const selectedProduct = useMemo(() => {
		if (!value) return null;
		return products.find((p) => p.id === value) || null;
	}, [value, products]);

	const handleSelect = (product: Product) => {
		onChange(product);
		setOpen(false);
		setSearchQuery("");
	};

	const handleClear = () => {
		onChange(null);
		setSearchQuery("");
	};

	return (
		<div className="w-full">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
						disabled={disabled}
					>
						{selectedProduct ? (
							<div className="flex items-center gap-2">
								<Package className="size-4 shrink-0" />
								<span className="truncate">{selectedProduct.name}</span>
								{selectedProduct.sku && (
									<span className="text-muted-foreground text-xs">
										({selectedProduct.sku})
									</span>
								)}
							</div>
						) : (
							<span className="text-muted-foreground">{placeholder}</span>
						)}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-[var(--radix-popover-trigger-width)] p-0"
					align="start"
				>
					<AnimatePresence>
						{open && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
							>
								<Command shouldFilter={false}>
									<CommandInput
										placeholder={placeholder}
										value={searchQuery}
										onValueChange={setSearchQuery}
									/>
									<CommandList>
										{isLoading ? (
											<div className="flex items-center justify-center py-6">
												<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
											</div>
										) : products.length === 0 &&
											searchQuery.trim().length > 0 ? (
											<CommandEmpty>No products found.</CommandEmpty>
										) : (
											<CommandGroup>
												{products.map((product) => (
													<CommandItem
														key={product.id}
														value={product.id}
														onSelect={() => handleSelect(product)}
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																value === product.id
																	? "opacity-100"
																	: "opacity-0",
															)}
														/>
														<div className="flex flex-1 flex-col">
															<div className="flex items-center justify-between">
																<span className="font-medium">
																	{product.name}
																</span>
																<span className="text-muted-foreground text-xs">
																	{product.currency} {product.price.toFixed(2)}
																</span>
															</div>
															{product.sku && (
																<span className="text-muted-foreground text-xs">
																	SKU: {product.sku}
																</span>
															)}
															{product.description && (
																<span className="text-muted-foreground truncate text-xs">
																	{product.description}
																</span>
															)}
														</div>
													</CommandItem>
												))}
											</CommandGroup>
										)}
									</CommandList>
								</Command>
							</motion.div>
						)}
					</AnimatePresence>
				</PopoverContent>
			</Popover>
			{selectedProduct && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleClear}
					className="mt-2 h-6 text-xs"
				>
					Clear selection
				</Button>
			)}
		</div>
	);
}
