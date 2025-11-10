"use client";

import { InvoiceList } from "@/components/invoices/invoice-list";
import { useState } from "react";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";
import { useDeleteInvoice } from "@/src/hooks/useInvoices";

export default function InvoicesPage() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
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
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">Manage and track your invoices</p>
      </div>

      <div className={`grid gap-6 ${selectedInvoiceId ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        <InvoiceList onInvoiceClick={handleInvoiceClick} onCreateInvoice={handleCreateInvoice} />

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