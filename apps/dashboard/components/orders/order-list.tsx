"use client";

import { ORDER_STATUSES, type OrderStatus } from "@crm/types";
import { Plus } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
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
import { useOrders } from "@/src/hooks/useOrders";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	pending: "secondary",
	processing: "default",
	shipped: "default",
	completed: "default",
	cancelled: "destructive",
};

type OrderListProps = {
	companyId?: string;
	contactId?: string;
	onOrderClick?: (orderId: number) => void;
	onCreateOrder?: () => void;
	toolbarActions?: ReactNode | null;
	showCreateAction?: boolean;
};

export function OrderList({
	companyId,
	contactId,
	onOrderClick,
	onCreateOrder,
	toolbarActions: toolbarActionsProp,
	showCreateAction = true,
}: OrderListProps) {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(
		undefined,
	);
	const [page, setPage] = useState(0);
	const limit = 10;

	const { data: ordersResponse, isLoading } = useOrders({
		companyId,
		contactId,
		status: statusFilter,
		search: search || undefined,
		limit,
		offset: page * limit,
	});

	const orders = ordersResponse?.data || [];
	const total = ordersResponse?.total || 0;
	const totalPages = Math.ceil(total / limit);

	const hasActiveFilters = useMemo(
		() => search.trim().length > 0 || Boolean(statusFilter),
		[search, statusFilter],
	);

	const toolbarActions =
		toolbarActionsProp !== undefined ? (
			toolbarActionsProp
		) : onCreateOrder && showCreateAction ? (
			<Button
				type="button"
				onClick={onCreateOrder}
				className="gap-2 md:order-2"
			>
				<Plus className="h-4 w-4" aria-hidden="true" />
				New Order
			</Button>
		) : null;

	return (
		<div className="space-y-6">
			<h2 className="sr-only">Orders</h2>

			<TableToolbar
				search={{
					value: search,
					onChange: (value) => {
						setSearch(value);
						setPage(0);
					},
					placeholder: "Search orders...",
					ariaLabel: "Search orders",
				}}
				filters={
					<Select
						value={statusFilter ?? "all"}
						onValueChange={(value) => {
							const normalized =
								value === "all" ? undefined : (value as OrderStatus);
							setStatusFilter(normalized);
							setPage(0);
						}}
					>
						<SelectTrigger className="md:w-44" aria-label="Filter by status">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All statuses</SelectItem>
							{ORDER_STATUSES.map((status) => (
								<SelectItem key={status} value={status}>
									{status.charAt(0).toUpperCase() + status.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				}
				reset={{
					onReset: () => {
						setSearch("");
						setStatusFilter(undefined);
						setPage(0);
					},
					disabled: !hasActiveFilters,
				}}
				actions={toolbarActions}
			/>

			<div className="bg-background overflow-hidden rounded-xl border shadow-sm">
				{isLoading ? (
					<div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
						Loading orders...
					</div>
				) : orders.length === 0 ? (
					<div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
						<p>No orders found</p>
						{onCreateOrder && showCreateAction && (
							<Button onClick={onCreateOrder} variant="outline" size="sm">
								<Plus className="h-4 w-4 mr-2" aria-hidden="true" />
								Create First Order
							</Button>
						)}
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Order #</TableHead>
										<TableHead>Order Date</TableHead>
										<TableHead>Expected Delivery</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="w-[100px]">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{orders.map((order) => (
										<TableRow
											key={order.id}
											className={onOrderClick ? "cursor-pointer" : ""}
											onClick={() => onOrderClick?.(order.id)}
										>
											<TableCell className="font-medium">
												{order.orderNumber}
											</TableCell>
											<TableCell>{order.orderDate}</TableCell>
											<TableCell>{order.expectedDelivery || "—"}</TableCell>
											<TableCell>
												{formatCurrency(order.total, order.currency)}
											</TableCell>
											<TableCell>
												<Badge variant={statusVariants[order.status]}>
													{order.status}
												</Badge>
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														onOrderClick?.(order.id);
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
									{Math.min((page + 1) * limit, total)} of {total} orders
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
