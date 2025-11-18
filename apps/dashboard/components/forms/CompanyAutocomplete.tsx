"use client";

import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import {
	type Control,
	Controller,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { getCompanyInitials } from "@/lib/utils/company";
import { useAccounts } from "@/src/hooks/useAccounts";
import { useCompanySearch } from "@/src/hooks/useCompanySearch";
import { CompanyCreationModal } from "./CompanyCreationModal";

type CompanyAutocompleteProps<TFieldValues extends FieldValues = FieldValues> =
	{
		value?: string;
		onChange: (companyId: string) => void;
		control?: Control<TFieldValues>;
		name?: FieldPath<TFieldValues>;
		disabled?: boolean;
		placeholder?: string;
	};

const MIN_SEARCH_LENGTH = 2;
const MIN_CREATE_LENGTH = 3;
const MAX_VISIBLE_ITEMS = 50;

function highlightMatch(text: string, query: string): React.ReactNode {
	if (!query || !text) return text;

	const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

	return parts.map((part, i) =>
		part.toLowerCase() === query.toLowerCase() ? (
			<mark
				key={i}
				className="bg-primary/20 text-primary font-medium rounded px-0.5"
			>
				{part}
			</mark>
		) : (
			<span key={i}>{part}</span>
		),
	);
}

function isValidCompanyName(name: string): boolean {
	const trimmed = name.trim();
	return trimmed.length >= MIN_CREATE_LENGTH && trimmed.length <= 255;
}

export function CompanyAutocomplete<
	TFieldValues extends FieldValues = FieldValues,
>({
	value,
	onChange,
	control,
	name,
	disabled = false,
	placeholder = "Search or add company…",
}: CompanyAutocompleteProps<TFieldValues>) {
	if (control && name) {
		return (
			<Controller
				control={control}
				name={name}
				render={({ field }) => (
					<CompanyAutocompleteInner
						value={field.value}
						onChange={field.onChange}
						disabled={disabled}
						placeholder={placeholder}
					/>
				)}
			/>
		);
	}

	return (
		<CompanyAutocompleteInner
			value={value}
			onChange={onChange}
			disabled={disabled}
			placeholder={placeholder}
		/>
	);
}

function CompanyAutocompleteInner({
	value,
	onChange,
	disabled = false,
	placeholder = "Search or add company…",
}: Omit<CompanyAutocompleteProps, "control" | "name">) {
	const [open, setOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const { data: companies = [], isLoading } = useCompanySearch(searchQuery);
	const { data: allAccounts = [] } = useAccounts();

	const selectedCompany = useMemo(() => {
		return (
			companies.find((c) => c.id === value) ||
			allAccounts.find((c) => c.id === value)
		);
	}, [companies, allAccounts, value]);

	const trimmedQuery = searchQuery.trim();

	const sortedCompanies = useMemo(() => {
		if (!companies.length || !trimmedQuery) {
			return companies.slice(0, MAX_VISIBLE_ITEMS);
		}

		const queryLower = trimmedQuery.toLowerCase();

		const sorted = [...companies].sort((a, b) => {
			const aName = a.name.toLowerCase();
			const bName = b.name.toLowerCase();

			if (aName === queryLower) return -1;
			if (bName === queryLower) return 1;

			const aStarts = aName.startsWith(queryLower);
			const bStarts = bName.startsWith(queryLower);
			if (aStarts && !bStarts) return -1;
			if (!aStarts && bStarts) return 1;

			const aContains = aName.includes(queryLower);
			const bContains = bName.includes(queryLower);
			if (aContains && !bContains) return -1;
			if (!aContains && bContains) return 1;

			return aName.length - bName.length;
		});

		return sorted.slice(0, MAX_VISIBLE_ITEMS);
	}, [companies, trimmedQuery]);

	const hasExactMatch = useMemo(() => {
		if (!trimmedQuery || companies.length === 0) return false;
		const queryLower = trimmedQuery.toLowerCase();
		return companies.some((c) => c.name.toLowerCase() === queryLower);
	}, [companies, trimmedQuery]);

	const hasPartialMatch = useMemo(() => {
		if (!trimmedQuery || companies.length === 0) return false;
		const queryLower = trimmedQuery.toLowerCase();
		return companies.some((c) => {
			const name = c.name.toLowerCase();
			return name.startsWith(queryLower) || name.includes(queryLower);
		});
	}, [companies, trimmedQuery]);

	const shouldShowCreate = useMemo(() => {
		if (isLoading) return false;
		if (trimmedQuery.length < MIN_CREATE_LENGTH) return false;
		if (!isValidCompanyName(trimmedQuery)) return false;

		return !hasExactMatch && !hasPartialMatch;
	}, [trimmedQuery, hasExactMatch, hasPartialMatch, isLoading]);

	const visibleCompanies = sortedCompanies;
	const hasMoreResults = companies.length > MAX_VISIBLE_ITEMS;

	const handleSelect = useCallback(
		(companyId: string) => {
			onChange(companyId);
			setOpen(false);
			setSearchQuery("");
		},
		[onChange],
	);

	const handleCreateNew = useCallback(() => {
		if (!isValidCompanyName(trimmedQuery)) return;
		setOpen(false);
		setCreateOpen(true);
	}, [trimmedQuery]);

	const handleOpenChange = useCallback((newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			setSearchQuery("");
		}
	}, []);

	return (
		<div className="w-full">
			<Popover open={open} onOpenChange={handleOpenChange}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
						disabled={disabled}
						type="button"
					>
						{selectedCompany ? (
							<div className="flex items-center gap-2 min-w-0 flex-1">
								<Avatar className="size-6 shrink-0">
									<AvatarFallback className="text-xs">
										{getCompanyInitials(selectedCompany.name)}
									</AvatarFallback>
								</Avatar>
								<span className="truncate">{selectedCompany.name}</span>
							</div>
						) : (
							<span className="text-muted-foreground truncate">
								{placeholder}
							</span>
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
									<CommandList className="max-h-[300px]">
										{isLoading ? (
											<div className="flex items-center justify-center py-6">
												<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
											</div>
										) : (
											<>
												{visibleCompanies.length === 0 &&
													trimmedQuery.length > 0 &&
													trimmedQuery.length < MIN_SEARCH_LENGTH && (
														<CommandEmpty>
															<div className="flex flex-col items-center justify-center py-6 text-center">
																<div className="flex size-10 items-center justify-center rounded-full bg-muted mb-2">
																	<ChevronsUpDown className="h-5 w-5 text-muted-foreground/60" />
																</div>
																<span className="text-sm font-medium text-muted-foreground">
																	Type at least {MIN_SEARCH_LENGTH} characters
																</span>
																<span className="text-xs text-muted-foreground/70 mt-0.5">
																	to search for companies
																</span>
															</div>
														</CommandEmpty>
													)}
												{visibleCompanies.length === 0 &&
													trimmedQuery.length >= MIN_SEARCH_LENGTH &&
													!shouldShowCreate && (
														<CommandEmpty>
															<div className="flex flex-col items-center justify-center py-6 text-center">
																<div className="flex size-10 items-center justify-center rounded-full bg-muted mb-2">
																	<ChevronsUpDown className="h-5 w-5 text-muted-foreground/60" />
																</div>
																<span className="text-sm font-medium text-muted-foreground">
																	No companies found
																</span>
																<span className="text-xs text-muted-foreground/70 mt-0.5">
																	Try a different search term
																</span>
															</div>
														</CommandEmpty>
													)}
												{visibleCompanies.length > 0 && (
													<CommandGroup
														heading={
															<div className="flex items-center justify-between w-full">
																<span>
																	{hasMoreResults
																		? `Showing first ${MAX_VISIBLE_ITEMS} of ${companies.length} companies`
																		: `${companies.length} ${companies.length === 1 ? "company" : "companies"}`}
																</span>
															</div>
														}
													>
														{visibleCompanies.map((company) => (
															<CommandItem
																key={company.id}
																value={company.id}
																onSelect={() => handleSelect(company.id)}
																className="cursor-pointer py-2.5 rounded-lg mx-1 hover:bg-accent focus:bg-accent"
															>
																<Check
																	className={cn(
																		"mr-2 h-4 w-4 shrink-0",
																		value === company.id
																			? "opacity-100"
																			: "opacity-0",
																	)}
																/>
																<Avatar className="mr-3 size-8 shrink-0">
																	<AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
																		{getCompanyInitials(company.name)}
																	</AvatarFallback>
																</Avatar>
																<div className="flex flex-1 flex-col gap-0.5 min-w-0">
																	<span className="font-medium text-sm leading-tight truncate">
																		{highlightMatch(company.name, trimmedQuery)}
																	</span>
																	{company.email && (
																		<span className="text-xs text-muted-foreground/80 truncate">
																			{company.email}
																		</span>
																	)}
																</div>
															</CommandItem>
														))}
													</CommandGroup>
												)}
												{shouldShowCreate && (
													<>
														{visibleCompanies.length > 0 && (
															<div className="h-px bg-border/50 mx-2 my-2" />
														)}
														<CommandGroup>
															<CommandItem
																onSelect={handleCreateNew}
																className="cursor-pointer !bg-gradient-to-r !from-primary/5 !to-primary/10 hover:!from-primary/10 hover:!to-primary/15 !border-t-2 !border-dashed !border-primary/40 !mt-2 !mx-2 !rounded-lg !py-3.5 !px-3"
															>
																<div className="flex items-start gap-3 w-full">
																	<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 ring-2 ring-primary/30 mt-0.5">
																		<Plus className="h-5 w-5 text-primary" />
																	</div>
																	<div className="flex flex-1 flex-col gap-1 min-w-0 overflow-hidden">
																		<span className="font-bold text-sm leading-tight text-primary line-clamp-2 wrap-break-word">
																			Create "{trimmedQuery}"
																		</span>
																		<span className="text-xs leading-relaxed text-muted-foreground/80">
																			Add new company to database
																		</span>
																	</div>
																</div>
															</CommandItem>
														</CommandGroup>
													</>
												)}
											</>
										)}
									</CommandList>
								</Command>
							</motion.div>
						)}
					</AnimatePresence>
				</PopoverContent>
			</Popover>
			<CompanyCreationModal
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCompanyCreated={(company) => {
					onChange(company.id);
				}}
				initialName={trimmedQuery}
			/>
		</div>
	);
}
