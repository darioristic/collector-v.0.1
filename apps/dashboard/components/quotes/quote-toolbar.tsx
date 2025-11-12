"use client";

import { Search, SortAsc, SortDesc, X } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SelectOption = { value: string; label: string };

type SearchConfig = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	ariaLabel?: string;
	isDisabled?: boolean;
	inputProps?: InputHTMLAttributes<HTMLInputElement>;
};

type SortConfig = {
	value: string;
	options: SelectOption[];
	onChange: (value: string) => void;
	order: "asc" | "desc";
	onOrderToggle: () => void;
	disabled?: boolean;
	placeholder?: string;
	ariaLabel?: string;
	ascLabel?: string;
	descLabel?: string;
};

type ResetConfig = {
	onReset: () => void;
	disabled?: boolean;
	label?: string;
	hideUntilActive?: boolean;
};

export type TableToolbarProps = {
	search?: SearchConfig;
	filters?: ReactNode;
	sort?: SortConfig;
	reset?: ResetConfig;
	actions?: ReactNode;
	children?: ReactNode;
	className?: string;
};

export function TableToolbar({
	search,
	filters,
	sort,
	reset,
	actions,
	children,
	className,
}: TableToolbarProps) {
	const searchDisabled = search?.isDisabled ?? false;
	const sortDisabled = sort?.disabled ?? false;
	const resetDisabled = reset?.disabled ?? false;

	const renderSearch = () => {
		if (!search) return null;

		return (
			<div className="relative flex-1">
				<Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
				<Input
					value={search.value}
					onChange={(event) => search.onChange(event.target.value)}
					placeholder={search.placeholder ?? "Search"}
					className="pl-10"
					disabled={searchDisabled}
					aria-label={search.ariaLabel ?? "Search table"}
					{...search.inputProps}
				/>
			</div>
		);
	};

	const renderSort = () => {
		if (!sort) return null;
		const orderLabel =
			sort.order === "asc"
				? (sort.descLabel ?? "Sort descending")
				: (sort.ascLabel ?? "Sort ascending");

		return (
			<div className="flex items-center gap-2">
				<Select
					value={sort.value}
					onValueChange={(value) => sort.onChange(value)}
					disabled={sortDisabled}
				>
					<SelectTrigger
						className="md:w-44"
						aria-label={sort.ariaLabel ?? "Sort table"}
					>
						<SelectValue placeholder={sort.placeholder ?? "Sort by"} />
					</SelectTrigger>
					<SelectContent>
						{sort.options.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Button
					type="button"
					variant="outline"
					onClick={sort.onOrderToggle}
					disabled={sortDisabled}
					aria-label={orderLabel}
					className="size-10"
				>
					{sort.order === "asc" ? (
						<SortAsc className="size-4" aria-hidden="true" />
					) : (
						<SortDesc className="size-4" aria-hidden="true" />
					)}
				</Button>
			</div>
		);
	};

	return (
		<div
			className={cn(
				"rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur",
				className,
			)}
		>
			<div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-3">
				{search ? (
					<div className="flex-1 min-w-[220px]">{renderSearch()}</div>
				) : null}

				{filters ? (
					<div className="flex flex-1 flex-wrap items-center gap-3">
						{filters}
					</div>
				) : null}

				{sort ? renderSort() : null}

				{children ? (
					<div className="flex items-center gap-2">{children}</div>
				) : null}

				{reset && !(reset.hideUntilActive && resetDisabled) ? (
					<Button
						type="button"
						variant="ghost"
						onClick={reset.onReset}
						disabled={resetDisabled}
						className={cn(
							"flex items-center gap-2",
							!resetDisabled
								? "text-primary hover:text-primary"
								: "text-muted-foreground",
						)}
					>
						<X className="size-4" aria-hidden="true" />
						{reset.label ?? "Clear filters"}
					</Button>
				) : null}

				{actions ? (
					<div className="flex items-center gap-2 md:ml-auto">{actions}</div>
				) : null}
			</div>
		</div>
	);
}
