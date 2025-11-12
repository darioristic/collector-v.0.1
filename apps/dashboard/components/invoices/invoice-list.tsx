"use client";

import { INVOICE_STATUSES } from "@crm/types";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { TableToolbar } from "@/components/table-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@/lib/utils";
import { useInvoices } from "@/src/hooks/useInvoices";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	draft: "secondary",
	sent: "default",
	paid: "default",
	overdue: "destructive",
	void: "destructive",
};

type InvoiceListProps = {
	customerId?: string;
	orderId?: number;
	onInvoiceClick?: (invoiceId: string) => void;
	onCreateInvoice?: () => void;
	showCreateAction?: boolean;
};

export function InvoiceList({
	customerId,
	orderId,
	onInvoiceClick,
	onCreateInvoice,
	showCreateAction = true,
}: InvoiceListProps) {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string | undefined>(
		undefined,
	);
	const [page, setPage] = useState(0);
	const limit = 10;

	const { data: invoicesResponse, isLoading } = useInvoices({
		customerId,
		orderId,
		status: statusFilter,
		search: search || undefined,
		limit,
		offset: page * limit,
	});

	const invoices = invoicesResponse?.data || [];
	const total = invoicesResponse?.total || 0;
	const totalPages = Math.ceil(total / limit);
	const hasActiveFilters = useMemo(
		() => search.trim().length > 0 || Boolean(statusFilter),
		[search, statusFilter],
	);
	const isToolbarDisabled = isLoading && invoices.length === 0;

	const handleResetFilters = () => {
		setSearch("");
		setStatusFilter(undefined);
		setPage(0);
	};

	const toolbarActions =
		onCreateInvoice && showCreateAction ? (
			<Button
				type="button"
				onClick={onCreateInvoice}
				size="sm"
				className="gap-2 md:order-2"
				disabled={isToolbarDisabled}
			>
				<Plus className="h-4 w-4" aria-hidden="true" />
				New Invoice
			</Button>
		) : null;

	return (
		<div className="space-y-6">
			<h2 className="sr-only">Invoices</h2>

			<TableToolbar
				search={{
					value: search,
					onChange: (value) => {
						setSearch(value);
						setPage(0);
					},
					placeholder: "Search invoices...",
					ariaLabel: "Search invoices",
					isDisabled: isToolbarDisabled,
				}}
				filters={
					<Select
						value={statusFilter ?? "all"}
						onValueChange={(value) => {
							const normalized = value === "all" ? undefined : value;
							setStatusFilter(normalized);
							setPage(0);
						}}
						disabled={isToolbarDisabled}
					>
						<SelectTrigger className="w-[180px]" aria-label="Filter by status">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All statuses</SelectItem>
							{INVOICE_STATUSES.map((status) => (
								<SelectItem key={status} value={status}>
									{status.charAt(0).toUpperCase() + status.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				}
				reset={{
					onReset: handleResetFilters,
					disabled: !hasActiveFilters,
				}}
				actions={toolbarActions}
			/>

			<div className="bg-background overflow-hidden rounded-xl border shadow-sm">
				{isLoading ? (
					<div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
						Loading invoices...
					</div>
				) : invoices.length === 0 ? (
					<div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
						<p>No invoices found</p>
						{onCreateInvoice && showCreateAction && (
							<Button onClick={onCreateInvoice} variant="outline" size="sm">
								<Plus className="h-4 w-4 mr-2" aria-hidden="true" />
								Create First Invoice
							</Button>
						)}
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Invoice #</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Issued</TableHead>
										<TableHead>Due</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Balance</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="w-[100px]">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{invoices.map((invoice) => (
										<TableRow
											key={invoice.id}
											className={onInvoiceClick ? "cursor-pointer" : ""}
											onClick={() => onInvoiceClick?.(invoice.id)}
										>
											<TableCell className="font-medium">
												{invoice.invoiceNumber}
											</TableCell>
											<TableCell>{invoice.customerName}</TableCell>
											<TableCell>
												{new Date(invoice.issuedAt).toLocaleDateString()}
											</TableCell>
											<TableCell>
												{invoice.dueDate
													? new Date(invoice.dueDate).toLocaleDateString()
													: "—"}
											</TableCell>
											<TableCell>
												{formatCurrency(invoice.total, invoice.currency)}
											</TableCell>
											<TableCell>
												{formatCurrency(invoice.balance, invoice.currency)}
											</TableCell>
											<TableCell>
												<Badge variant={statusVariants[invoice.status]}>
													{invoice.status}
												</Badge>
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														onInvoiceClick?.(invoice.id);
													}}
												>
													View
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{totalPages > 1 && (
							<div className="flex items-center justify-between border-t px-4 py-4 text-sm text-muted-foreground">
								<div>
									Showing {page * limit + 1} to{" "}
									{Math.min((page + 1) * limit, total)} of {total} invoices
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setPage(page - 1)}
										disabled={page === 0}
									>
										Previous
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setPage(page + 1)}
										disabled={page >= totalPages - 1}
									>
										Next
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
