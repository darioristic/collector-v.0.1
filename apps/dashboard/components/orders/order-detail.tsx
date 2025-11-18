"use client";

import type { Order } from "@crm/types";
import { FileEdit, Trash2 } from "lucide-react";
import { useCompanySettings } from "@/app/(protected)/settings/company/use-company-settings";
import Logo from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useOrder } from "@/src/hooks/useOrders";

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

type OrderDetailProps = {
	orderId: number;
	onEdit?: (order: Order) => void;
	onDelete?: (orderId: number) => void;
};

export function OrderDetail({ orderId, onEdit, onDelete }: OrderDetailProps) {
	const { data: order, isLoading } = useOrder(orderId);
	const { company } = useCompanySettings();

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex h-64 items-center justify-center">
					<p className="text-sm text-muted-foreground">
						Loading order details...
					</p>
				</CardContent>
			</Card>
		);
	}

	if (!order) {
		return (
			<Card>
				<CardContent className="flex h-64 items-center justify-center">
					<p className="text-sm text-muted-foreground">Order not found</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-sm">
							<Logo />
						</div>
						<div className="text-sm">
							<div className="font-medium">
								{company?.name ?? "Your Company"}
							</div>
							<div className="text-muted-foreground">
								{company?.email ?? "info@yourcompany.test"}
							</div>
							<div className="text-muted-foreground">
								{company?.streetAddress ?? "Billing Office"}
							</div>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							Order {order.orderNumber}
							<Badge variant={statusVariants[order.status]}>
								{order.status}
							</Badge>
						</CardTitle>
						<CardDescription>
							Ordered on {order.orderDate}
							{order.expectedDelivery &&
								` • Expected delivery: ${order.expectedDelivery}`}
						</CardDescription>
					</div>
					<div className="flex gap-2">
						{onEdit && (
							<Button onClick={() => onEdit(order)} variant="outline" size="sm">
								<FileEdit className="h-4 w-4 mr-2" />
								Edit
							</Button>
						)}
						{onDelete && (
							<Button
								onClick={() => onDelete(order.id)}
								variant="outline"
								size="sm"
								className="text-destructive"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete
							</Button>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				<div className="grid grid-cols-2 gap-8">
					<div className="space-y-1 text-sm">
						<div className="text-muted-foreground">Seller</div>
						<div>{company?.name ?? "Your Company"}</div>
						<div className="text-muted-foreground">
							{company?.email ?? "info@yourcompany.test"}
						</div>
						<div className="text-muted-foreground">
							{company?.streetAddress ?? "Billing Office"}
						</div>
						<div className="text-muted-foreground">
							{company?.taxId ? `VAT ID: ${company.taxId}` : "VAT ID: —"}
						</div>
					</div>
					<div className="space-y-1 text-sm">
						<div className="text-muted-foreground">Customer</div>
						<div>{order.customer?.name ?? "—"}</div>
						<div className="text-muted-foreground">
							{order.customer?.email ?? "—"}
						</div>
						<div className="text-muted-foreground">
							{order.customer?.address ?? "—"}
						</div>
					</div>
				</div>

				{/* Order Information */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Currency
						</p>
						<p className="text-sm">{order.currency}</p>
					</div>
					{order.notes && (
						<div className="col-span-2">
							<p className="text-sm font-medium text-muted-foreground">Notes</p>
							<p className="text-sm">{order.notes}</p>
						</div>
					)}
				</div>

				<Separator />

				{/* Order Items */}
				<div>
					<h3 className="text-lg font-semibold mb-4">Items</h3>
					{order.items && order.items.length > 0 ? (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[60%]">Description</TableHead>
										<TableHead className="text-right">Qty</TableHead>
										<TableHead className="text-right">Unit Price</TableHead>
										<TableHead className="text-right">Total</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{order.items.map((item) => (
										<TableRow key={item.id}>
											<TableCell>
												{item.description || "—"}
												{item.productId && (
													<span className="text-xs text-muted-foreground block">
														Product ID: {item.productId}
													</span>
												)}
											</TableCell>
											<TableCell className="text-right">
												{item.quantity}
											</TableCell>
											<TableCell className="text-right">
												{formatCurrency(item.unitPrice, order.currency)}
											</TableCell>
											<TableCell className="text-right font-medium">
												{formatCurrency(item.total, order.currency)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
								<TableFooter>
									<TableRow>
										<TableCell colSpan={3} className="text-right font-medium">
											Subtotal
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(order.subtotal, order.currency)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell colSpan={3} className="text-right font-medium">
											Tax
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(order.tax, order.currency)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell colSpan={3} className="text-right font-bold">
											Total
										</TableCell>
										<TableCell className="text-right font-bold">
											{formatCurrency(order.total, order.currency)}
										</TableCell>
									</TableRow>
								</TableFooter>
							</Table>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							No items in this order
						</p>
					)}
				</div>

				{/* Metadata */}
				<Separator />
				<div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
					<div>
						<span className="font-medium">Created:</span>{" "}
						{new Date(order.createdAt).toLocaleString()}
					</div>
					<div>
						<span className="font-medium">Updated:</span>{" "}
						{new Date(order.updatedAt).toLocaleString()}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
