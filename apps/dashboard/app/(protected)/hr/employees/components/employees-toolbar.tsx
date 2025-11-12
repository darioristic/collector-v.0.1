"use client";

import { Search, SortAsc, SortDesc, X } from "lucide-react";
import * as React from "react";

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
import {
	EMPLOYEE_SORT_OPTIONS,
	EMPLOYMENT_STATUS_OPTIONS,
	EMPLOYMENT_TYPE_OPTIONS,
} from "../constants";
import type { EmployeesQueryState } from "../types";

const ALL_FILTER_VALUE = "__all__";

interface EmployeesToolbarProps {
	searchValue: string;
	onSearchChange: (value: string) => void;
	filters: {
		department?: string;
		status?: string;
		employmentType?: string;
	};
	onFiltersChange: (filters: Partial<EmployeesToolbarProps["filters"]>) => void;
	sortField: EmployeesQueryState["sortField"];
	sortOrder: EmployeesQueryState["sortOrder"];
	onSortFieldChange: (field: EmployeesQueryState["sortField"]) => void;
	onSortOrderToggle: () => void;
	availableDepartments: string[];
	isDisabled?: boolean;
	onResetFilters: () => void;
}

export default function EmployeesToolbar({
	searchValue,
	onSearchChange,
	filters,
	onFiltersChange,
	sortField,
	sortOrder,
	onSortFieldChange,
	onSortOrderToggle,
	availableDepartments,
	isDisabled = false,
	onResetFilters,
}: EmployeesToolbarProps) {
	const hasActiveFilters =
		Boolean(filters.department) ||
		Boolean(filters.status) ||
		Boolean(filters.employmentType) ||
		Boolean(searchValue);

	return (
		<div className="flex flex-col gap-4 rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
			<div className="flex w-full flex-1 flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
					<Input
						value={searchValue}
						onChange={(event) => onSearchChange(event.target.value)}
						placeholder="Search by name, department, or role"
						className="pl-10"
						disabled={isDisabled}
						aria-label="Search employees"
					/>
				</div>

				<div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
					<Select
						value={filters.status ?? ALL_FILTER_VALUE}
						onValueChange={(value) =>
							onFiltersChange({
								status: value === ALL_FILTER_VALUE ? undefined : value,
							})
						}
						disabled={isDisabled}
					>
						<SelectTrigger className="sm:w-40" aria-label="Filter by status">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_FILTER_VALUE}>All statuses</SelectItem>
							{EMPLOYMENT_STATUS_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={filters.employmentType ?? ALL_FILTER_VALUE}
						onValueChange={(value) =>
							onFiltersChange({
								employmentType: value === ALL_FILTER_VALUE ? undefined : value,
							})
						}
						disabled={isDisabled}
					>
						<SelectTrigger
							className="sm:w-40"
							aria-label="Filter by employment type"
						>
							<SelectValue placeholder="Employment type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_FILTER_VALUE}>All types</SelectItem>
							{EMPLOYMENT_TYPE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={filters.department ?? ALL_FILTER_VALUE}
						onValueChange={(value) =>
							onFiltersChange({
								department: value === ALL_FILTER_VALUE ? undefined : value,
							})
						}
						disabled={isDisabled}
					>
						<SelectTrigger
							className="sm:w-40"
							aria-label="Filter by department"
						>
							<SelectValue placeholder="Department" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_FILTER_VALUE}>All departments</SelectItem>
							{availableDepartments.map((department) => (
								<SelectItem key={department} value={department}>
									{department}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
				<div className="flex items-center gap-2">
					<Select
						value={sortField}
						onValueChange={(value) =>
							onSortFieldChange(value as EmployeesQueryState["sortField"])
						}
						disabled={isDisabled}
					>
						<SelectTrigger className="sm:w-40" aria-label="Sort employees">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							{EMPLOYEE_SORT_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button
						type="button"
						variant="outline"
						onClick={onSortOrderToggle}
						disabled={isDisabled}
						aria-label={
							sortOrder === "asc" ? "Sort descending" : "Sort ascending"
						}
						className="size-10"
					>
						{sortOrder === "asc" ? (
							<SortAsc className="size-4" aria-hidden="true" />
						) : (
							<SortDesc className="size-4" aria-hidden="true" />
						)}
					</Button>
				</div>

				<Button
					type="button"
					variant="ghost"
					onClick={onResetFilters}
					disabled={!hasActiveFilters || isDisabled}
					className={cn(
						"justify-start sm:justify-center",
						hasActiveFilters
							? "text-primary hover:text-primary"
							: "text-muted-foreground",
					)}
				>
					<X className="mr-2 size-4" aria-hidden="true" />
					Clear filters
				</Button>
			</div>
		</div>
	);
}
