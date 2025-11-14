"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { Button } from "@/components/ui/button";
import { TablePageHeader } from "@/components/ui/page-header";
import { useDeleteInvoice } from "@/src/hooks/useInvoices";

export default function InvoicesPage() {
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
		null,
	);
	const deleteInvoice = useDeleteInvoice();

	const handleInvoiceClick = (invoiceId: string) => {
		setSelectedInvoiceId(invoiceId);
	};

	const handleCreateInvoice = () => {
		// TODO: Implement create invoice dialog
		alert("Create invoice dialog - Coming soon!");
	};

	const handleDeleteInvoice = async (invoiceId: string) => {
		if (confirm("Are you sure you want to delete this invoice?")) {
			await deleteInvoice.mutateAsync(invoiceId);
			if (selectedInvoiceId === invoiceId) {
				setSelectedInvoiceId(null);
			}
		}
	};

	return (
		<div className="space-y-8">
			<TablePageHeader
				title="Invoices"
				description="Manage and track your invoices."
				actions={
					<Button type="button" onClick={handleCreateInvoice} className="gap-2">
						<Plus className="h-4 w-4" aria-hidden="true" />
						New Invoice
					</Button>
				}
			/>

			<div
				className={`grid gap-6 ${selectedInvoiceId ? "lg:grid-cols-2" : "grid-cols-1"}`}
			>
				<InvoiceList
					onInvoiceClick={handleInvoiceClick}
					onCreateInvoice={handleCreateInvoice}
					showCreateAction={false}
				/>

				{selectedInvoiceId && (
					<InvoiceDetail
						invoiceId={selectedInvoiceId}
						onEdit={() => {
							// TODO: Open edit dialog
						}}
						onDelete={handleDeleteInvoice}
					/>
				)}
			</div>
		</div>
	);
}
