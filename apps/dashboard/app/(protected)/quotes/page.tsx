"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { InvoiceCreateSheet } from "@/components/invoices/invoice-create-sheet";
import { QuoteDetail } from "@/components/quotes/quote-detail";
import { QuoteList } from "@/components/quotes/quote-list";
import { Button } from "@/components/ui/button";
import { TablePageHeader } from "@/components/ui/page-header";
import { useDeleteQuote } from "@/src/hooks/useQuotes";

export default function QuotesPage() {
	const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const deleteQuote = useDeleteQuote();

	const handleQuoteClick = (quoteId: number) => {
		setSelectedQuoteId(quoteId);
		setIsDrawerOpen(true);
	};

  const handleCreateQuote = () => {
    setIsCreateDialogOpen(true);
  };

	const handleDeleteQuote = async (quoteId: number) => {
		// Confirm se već radi u QuoteActions komponenti
		await deleteQuote.mutateAsync(quoteId);
		if (selectedQuoteId === quoteId) {
			setSelectedQuoteId(null);
			setIsDrawerOpen(false);
		}
	};

	const handleCloseDrawer = () => {
		setIsDrawerOpen(false);
		setSelectedQuoteId(null);
	};

  return (
    <div className="space-y-8">
      <TablePageHeader
        title="Offers"
        description="Manage and track your sales offers across accounts and stakeholders."
        actions={
          <Button type="button" onClick={handleCreateQuote} className="gap-2">
            <Plus className="size-4" aria-hidden="true" />
            New Offer
          </Button>
        }
      />

			<QuoteList onQuoteClick={handleQuoteClick} showCreateAction={false} />

			<QuoteDetail
				quoteId={selectedQuoteId}
				open={isDrawerOpen && Boolean(selectedQuoteId)}
				onClose={handleCloseDrawer}
				onEdit={() => {
					// TODO: Open edit dialog
				}}
				onDelete={handleDeleteQuote}
			/>

      {isCreateDialogOpen && (
        <InvoiceCreateSheet open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} />
      )}
    </div>
  );
}
