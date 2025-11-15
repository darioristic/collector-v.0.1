"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { Button } from "@/components/ui/button";
import { TablePageHeader } from "@/components/ui/page-header";
import { useDeleteInvoice } from "@/src/hooks/useInvoices";

export default function InvoicesPage() {
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const deleteInvoice = useDeleteInvoice();

    const handleInvoiceClick = (invoiceId: string) => {
        setSelectedInvoiceId(invoiceId);
        setIsDrawerOpen(true);
    };

	const handleCreateInvoice = () => {
		setIsCreateDialogOpen(true);
	};

    const handleCreateSuccess = () => {
        setIsCreateDialogOpen(false);
        setSelectedInvoiceId(null);
        setIsDrawerOpen(false);
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

            <div className={`transition-all ${isDrawerOpen ? "md:pr-[calc(50vw)]" : ""}`}>
                <InvoiceList
                    onInvoiceClick={handleInvoiceClick}
                    onCreateInvoice={handleCreateInvoice}
                    showCreateAction={false}
                />
            </div>

            {selectedInvoiceId && (
                <InvoiceDetail
                    invoiceId={selectedInvoiceId}
                    open={isDrawerOpen && Boolean(selectedInvoiceId)}
                    onClose={() => {
                        setIsDrawerOpen(false);
                        setSelectedInvoiceId(null);
                    }}
                    onEdit={() => {
                        // TODO: Open edit dialog
                    }}
                    onDelete={handleDeleteInvoice}
                />
            )}

			<CreateInvoiceDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				onSuccess={handleCreateSuccess}
			/>
		</div>
	);
}
