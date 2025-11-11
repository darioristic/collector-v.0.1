"use client";

import { QuoteList } from "@/components/quotes/quote-list";
import { useState } from "react";
import { QuoteDetail } from "@/components/quotes/quote-detail";
import { CreateQuoteDialog } from "@/components/quotes/create-quote-dialog";
import { useDeleteQuote } from "@/src/hooks/useQuotes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
    if (confirm("Are you sure you want to delete this quote?")) {
      await deleteQuote.mutateAsync(quoteId);
      if (selectedQuoteId === quoteId) {
        setSelectedQuoteId(null);
        setIsDrawerOpen(false);
      }
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedQuoteId(null);
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground text-sm">
            Manage and track your sales quotes across accounts and stakeholders.
          </p>
        </div>
        <Button type="button" onClick={handleCreateQuote} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          New Quote
        </Button>
      </div>

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

      <CreateQuoteDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}
