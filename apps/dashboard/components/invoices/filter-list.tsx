"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FilterListProps = {
	filters: {
		q?: string | null;
		end?: string | null;
		start?: string | null;
		statuses?: string[] | null;
		customers?: string[] | null;
	};
	loading?: boolean;
	onRemove: (params: {
		q?: string | null;
		start?: string | null;
		end?: string | null;
		statuses?: string[] | null;
		customers?: string[] | null;
	}) => void;
	statusFilters?: Array<{ id: string; name: string }>;
	members?: Array<{ id: string | null; name: string | null }>;
};

export function FilterList({
	filters,
	loading,
	onRemove,
	statusFilters = [],
	members = [],
}: FilterListProps) {
	const activeFilters: Array<{ key: string; label: string; value: string }> =
		[];

	if (filters.q) {
		activeFilters.push({
			key: "q",
			label: "Search",
			value: filters.q,
		});
	}

	if (filters.start || filters.end) {
		const start = filters.start
			? format(new Date(filters.start), "MMM dd")
			: "";
		const end = filters.end ? format(new Date(filters.end), "MMM dd") : "";
		activeFilters.push({
			key: "date",
			label: "Due Date",
			value: start && end ? `${start} - ${end}` : start || end,
		});
	}

	if (filters.statuses && filters.statuses.length > 0) {
		filters.statuses.forEach((status) => {
			const statusFilter = statusFilters.find((s) => s.id === status);
			if (statusFilter) {
				activeFilters.push({
					key: `status-${status}`,
					label: "Status",
					value: statusFilter.name,
				});
			}
		});
	}

	if (filters.customers && filters.customers.length > 0) {
		filters.customers.forEach((customerId) => {
			const customer = members.find((m) => m.id === customerId);
			if (customer?.name) {
				activeFilters.push({
					key: `customer-${customerId}`,
					label: "Customer",
					value: customer.name,
				});
			}
		});
	}

	if (activeFilters.length === 0) {
		return null;
	}

	const handleRemove = (filter: {
		key: string;
		label: string;
		value: string;
	}) => {
		if (filter.key === "q") {
			onRemove({ q: null });
		} else if (filter.key === "date") {
			onRemove({ start: null, end: null });
		} else if (filter.key.startsWith("status-")) {
			const status = filter.key.replace("status-", "");
			const newStatuses = filters.statuses?.filter((s) => s !== status) ?? null;
			onRemove({
				statuses: newStatuses && newStatuses.length > 0 ? newStatuses : null,
			});
		} else if (filter.key.startsWith("customer-")) {
			const customerId = filter.key.replace("customer-", "");
			const newCustomers =
				filters.customers?.filter((c) => c !== customerId) ?? null;
			onRemove({
				customers:
					newCustomers && newCustomers.length > 0 ? newCustomers : null,
			});
		}
	};

	return (
		<div className="flex flex-wrap gap-2">
			{activeFilters.map((filter) => (
				<Badge
					key={filter.key}
					variant="secondary"
					className="flex items-center gap-1 px-2 py-1"
				>
					<span className="text-xs">
						{filter.label}: {filter.value}
					</span>
					<Button
						variant="ghost"
						size="icon"
						className="h-4 w-4 p-0 hover:bg-transparent"
						onClick={() => handleRemove(filter)}
						disabled={loading}
					>
						<X className="h-3 w-3" />
					</Button>
				</Badge>
			))}
		</div>
	);
}
