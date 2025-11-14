"use client";

import { useState } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import type { Account } from "@crm/types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { getCompanyInitials } from "@/lib/utils/company";
import { useCompanySearch } from "@/src/hooks/useCompanySearch";
import { useAccounts } from "@/src/hooks/useAccounts";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompanyCreationModal } from "./CompanyCreationModal";

type CompanyAutocompleteProps<TFieldValues extends FieldValues = FieldValues> = {
	value?: string;
	onChange: (companyId: string) => void;
	control?: Control<TFieldValues>;
	name?: FieldPath<TFieldValues>;
	disabled?: boolean;
	placeholder?: string;
};

export function CompanyAutocomplete<TFieldValues extends FieldValues = FieldValues>({
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
	const [searchQuery, setSearchQuery] = useState("");
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const { data: companies = [], isLoading } = useCompanySearch(searchQuery);
	const { data: allAccounts = [] } = useAccounts();

	const selectedCompany =
		companies.find((c) => c.id === value) ||
		allAccounts.find((c) => c.id === value);

	const handleSelect = (companyId: string) => {
		onChange(companyId);
		setOpen(false);
		setSearchQuery("");
	};

	const handleCreateNew = () => {
		setOpen(false);
		setIsCreateModalOpen(true);
	};

	const handleCompanyCreated = (company: Account) => {
		onChange(company.id);
		setIsCreateModalOpen(false);
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
						{selectedCompany ? (
							<div className="flex items-center gap-2">
								<Avatar className="size-6">
									<AvatarFallback className="text-xs">
										{getCompanyInitials(selectedCompany.name)}
									</AvatarFallback>
								</Avatar>
								<span className="truncate">{selectedCompany.name}</span>
							</div>
						) : (
							<span className="text-muted-foreground">{placeholder}</span>
						)}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
										) : companies.length === 0 && searchQuery.trim().length > 0 ? (
											<>
												<CommandEmpty>No companies found.</CommandEmpty>
												<CommandGroup>
													<CommandItem onSelect={handleCreateNew}>
														<Plus className="mr-2 h-4 w-4" />
														<span className="font-medium">Add new company</span>
													</CommandItem>
												</CommandGroup>
											</>
										) : (
											<CommandGroup>
												{companies.map((company) => (
													<CommandItem
														key={company.id}
														value={company.id}
														onSelect={() => handleSelect(company.id)}
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																value === company.id
																	? "opacity-100"
																	: "opacity-0",
															)}
														/>
														<Avatar className="mr-2 size-6">
															<AvatarFallback className="text-xs">
																{getCompanyInitials(company.name)}
															</AvatarFallback>
														</Avatar>
														<div className="flex flex-col">
															<span>{company.name}</span>
															{company.email && (
																<span className="text-xs text-muted-foreground">
																	{company.email}
																</span>
															)}
														</div>
													</CommandItem>
												))}
												{searchQuery.trim().length > 0 && (
													<CommandItem onSelect={handleCreateNew}>
														<Plus className="mr-2 h-4 w-4" />
														<span className="font-medium">Add new company</span>
													</CommandItem>
												)}
											</CommandGroup>
										)}
									</CommandList>
								</Command>
							</motion.div>
						)}
					</AnimatePresence>
				</PopoverContent>
			</Popover>

			<CompanyCreationModal
				open={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				onCompanyCreated={handleCompanyCreated}
			/>
		</div>
	);
}

