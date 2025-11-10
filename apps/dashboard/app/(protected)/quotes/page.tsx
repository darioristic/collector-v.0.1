"use client";

import { QuoteList } from "@/components/quotes/quote-list";
import { useState } from "react";
import { QuoteDetail } from "@/components/quotes/quote-detail";
import { CreateQuoteDialog } from "@/components/quotes/create-quote-dialog";
import { useDeleteQuote } from "@/src/hooks/useQuotes";

export default function QuotesPage() {
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const deleteQuote = useDeleteQuote();

  const handleQuoteClick = (quoteId: number) => {
    setSelectedQuoteId(quoteId);
  };

  const handleCreateQuote = () => {
    setIsCreateDialogOpen(true);
  };

  const handleDeleteQuote = async (quoteId: number) => {
    if (confirm("Are you sure you want to delete this quote?")) {
      await deleteQuote.mutateAsync(quoteId);
      if (selectedQuoteId === quoteId) {
        setSelectedQuoteId(null);
      }
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
        <p className="text-muted-foreground">Manage and track your sales quotes</p>
      </div>

      <div className={`grid gap-6 ${selectedQuoteId ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        <QuoteList onQuoteClick={handleQuoteClick} onCreateQuote={handleCreateQuote} />

        {selectedQuoteId && (
          <QuoteDetail
            quoteId={selectedQuoteId}
            onEdit={() => {
              // TODO: Open edit dialog
            }}
            onDelete={handleDeleteQuote}
          />
        )}
      </div>

      <CreateQuoteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}