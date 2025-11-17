"use client";

import * as React from "react";
import {
  Columns3,
  Filter,
  Grid as GridIcon,
  Loader2,
  Plus,
  Table as TableIcon
} from "lucide-react";
import { TableToolbar } from "@/components/table-toolbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { TablePageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Deal } from "@/lib/db/schema/deals";
import {
  createDeal,
  deleteDeal,
  updateDeal,
  updateDealStage,
  type DealStageSummary
} from "./actions";
import DealModal from "./components/deal-modal";
import DealsCompactView from "./components/deals-compact-view";
import DealsFiltersSheet from "./components/deals-filters-sheet";
import DealsKanbanBoard from "./components/deals-kanban-board";
import DealsTableView from "./components/deals-table-view";
import { DEAL_STAGES, type DealStage, type DealView } from "./constants";
import type { DealFormValues } from "./schemas";
import type { DealFiltersState, ModalMode } from "./store";
import { useDealsStore } from "./store";

interface DealsPageClientProps {
  initialDeals: Deal[];
  owners: string[];
  stageSummary: DealStageSummary[];
  error: string | null;
}

const viewOptions: Array<{
  value: DealView;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "kanban",
    label: "Kanban",
    icon: <Columns3 className="h-4 w-4" aria-hidden="true" />
  },
  {
    value: "table",
    label: "Table",
    icon: <TableIcon className="h-4 w-4" aria-hidden="true" />
  },
  {
    value: "compact",
    label: "Compact",
    icon: <GridIcon className="h-4 w-4" aria-hidden="true" />
  }
];

function summarizeStages(deals: Deal[]): DealStageSummary[] {
  const summary = DEAL_STAGES.map<DealStageSummary>((stage) => ({
    stage,
    count: 0
  }));

  deals.forEach((deal) => {
    const index = summary.findIndex((item) => item.stage === (deal.stage as DealStage));
    if (index !== -1) {
      summary[index] = {
        stage: summary[index].stage,
        count: summary[index].count + 1
      };
    }
  });

  return summary;
}

const filterDeals = (deals: Deal[], filters: DealFiltersState): Deal[] => {
  return deals.filter((deal) => {
    if (filters.stage && deal.stage !== filters.stage) {
      return false;
    }

    if (filters.owner && deal.owner !== filters.owner) {
      return false;
    }

    if (filters.search) {
      const haystack = `${deal.title} ${deal.company} ${deal.owner}`.toLowerCase();
      if (!haystack.includes(filters.search.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
};

export default function DealsPageClient({ initialDeals, owners, error }: DealsPageClientProps) {
  const { toast } = useToast();
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const setDeals = useDealsStore((state) => state.setDeals);
  const deals = useDealsStore((state) => state.deals);
  const view = useDealsStore((state) => state.view);
  const setView = useDealsStore((state) => state.setView);
  const filters = useDealsStore((state) => state.filters);
  const setFilters = useDealsStore((state) => state.setFilters);
  const resetFilters = useDealsStore((state) => state.resetFilters);
  const isModalOpen = useDealsStore((state) => state.isModalOpen);
  const modalMode = useDealsStore((state) => state.modalMode);
  const activeDealId = useDealsStore((state) => state.activeDealId);
  const setModal = useDealsStore((state) => state.setModal);
  const addDeal = useDealsStore((state) => state.addDeal);
  const updateDealInStore = useDealsStore((state) => state.updateDeal);
  const removeDeal = useDealsStore((state) => state.removeDeal);
  const moveDeal = useDealsStore((state) => state.moveDeal);
  const setSaving = useDealsStore((state) => state.setSaving);
  const isSaving = useDealsStore((state) => state.isSaving);

  const ownersWithFallback = React.useMemo(() => {
    const unique = new Set<string>();
    owners.forEach((owner) => {
      if (owner) {
        unique.add(owner);
      }
    });

    initialDeals.forEach((deal) => {
      if (deal.owner) {
        unique.add(deal.owner);
      }
    });

    if (unique.size === 0) {
      unique.add("Unassigned");
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [initialDeals, owners]);

  React.useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals, setDeals]);

  const activeDeal = React.useMemo(
    () => deals.find((deal) => deal.id === activeDealId) ?? null,
    [activeDealId, deals]
  );

  const filteredDeals = React.useMemo(() => filterDeals(deals, filters), [deals, filters]);

  const _stageStats = React.useMemo(() => summarizeStages(deals), [deals]);

  const handleOpenModal = React.useCallback(
    (mode: ModalMode, deal?: Deal | null) => {
      setModal(true, mode, deal?.id ?? null);
    },
    [setModal]
  );

  const handleCloseModal = React.useCallback(() => {
    setModal(false, "create", null);
  }, [setModal]);

  const handleCreateDeal = React.useCallback(
    (values: DealFormValues) => {
      setSaving(true);
      startTransition(() => {
        createDeal(values)
          .then((deal) => {
            addDeal(deal);
            handleCloseModal();
            toast({
              title: "Deal created",
              description: `${deal.title} has been added to the ${deal.stage} stage.`
            });
          })
          .catch((err) => {
            const message = err instanceof Error ? err.message : "Unable to create deal.";
            toast({
              variant: "destructive",
              title: "Creation failed",
              description: message
            });
          })
          .finally(() => {
            setSaving(false);
          });
      });
    },
    [handleCloseModal, setSaving, startTransition, toast]
  );

  const handleUpdateDeal = React.useCallback(
    (values: DealFormValues) => {
      if (!activeDeal) {
        toast({
          variant: "destructive",
          title: "Unable to update",
          description: "No deal is selected for editing."
        });
        return;
      }

      setSaving(true);
      startTransition(() => {
        updateDeal(activeDeal.id, values)
          .then((deal) => {
            updateDealInStore(deal);
            handleCloseModal();
            toast({
              title: "Deal updated",
              description: `${deal.title} has been updated.`
            });
          })
          .catch((err) => {
            const message = err instanceof Error ? err.message : "Unable to update deal.";
            toast({
              variant: "destructive",
              title: "Update failed",
              description: message
            });
          })
          .finally(() => {
            setSaving(false);
          });
      });
    },
    [activeDeal, handleCloseModal, setSaving, startTransition, toast]
  );

  const handleDeleteDeal = React.useCallback(
    (deal: Deal) => {
      startTransition(() => {
        deleteDeal(deal.id)
          .then(() => {
            removeDeal(deal.id);
            toast({
              title: "Deal removed",
              description: `${deal.title} has been deleted.`
            });
          })
          .catch((err) => {
            const message = err instanceof Error ? err.message : "Unable to delete deal.";
            toast({
              variant: "destructive",
              title: "Deletion failed",
              description: message
            });
          });
      });
    },
    [startTransition, toast]
  );

  const handleStageChange = React.useCallback(
    (dealId: string, stage: DealStage) => {
      const deal = deals.find((item) => item.id === dealId);
      if (!deal || deal.stage === stage) {
        return;
      }

      const previousStage = deal.stage as DealStage;
      moveDeal(dealId, stage);

      startTransition(() => {
        updateDealStage({ id: dealId, stage })
          .then((updated) => {
            updateDealInStore(updated);
            toast({
              title: "Stage updated",
              description: `${updated.title} moved to ${updated.stage}.`
            });
          })
          .catch((err) => {
            moveDeal(dealId, previousStage);
            const message = err instanceof Error ? err.message : "Unable to change stage.";
            toast({
              variant: "destructive",
              title: "Stage update failed",
              description: message
            });
          });
      });
    },
    [deals, moveDeal, startTransition, toast]
  );

  const currentView = viewOptions.find((option) => option.value === view) ?? viewOptions[0];
  const hasToolbarFilters =
    (filters.search?.trim().length ?? 0) > 0 || Boolean(filters.stage) || Boolean(filters.owner);

  const handleResetToolbar = React.useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <TablePageHeader
          title="Deals"
          description="Manage your sales pipeline and track deal progress."
          actions={
            <Button
              type="button"
              onClick={() => handleOpenModal("create")}
              className="gap-2 sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Deal
            </Button>
          }
        />

        <TableToolbar
          search={{
            value: filters.search ?? "",
            onChange: (value) => setFilters({ search: value }),
            placeholder: "Search deals...",
            ariaLabel: "Search deals"
          }}
          filters={
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFiltersOpen(true)}
              className="gap-2">
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filter
            </Button>
          }
          reset={{
            onReset: handleResetToolbar,
            disabled: !hasToolbarFilters
          }}
          actions={
            <div className="flex flex-wrap items-center gap-2 md:order-2 md:justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="gap-2">
                    {currentView.icon}
                    Switch View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {viewOptions.map((option) => (
                    <DropdownMenuItem key={option.value} onSelect={() => setView(option.value)}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Failed to load deals</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="relative mt-6">
        <Separator className="mb-6" />
        {isPending ? (
          <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center rounded-lg backdrop-blur">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" aria-hidden="true" />
            <span className="sr-only">Updating deals…</span>
          </div>
        ) : null}

        {view === "kanban" ? (
          <DealsKanbanBoard
            deals={filteredDeals}
            onCardClick={(deal) => handleOpenModal("edit", deal)}
            onStageChange={handleStageChange}
          />
        ) : null}

        {view === "table" ? (
          <DealsTableView
            deals={filteredDeals}
            onEdit={(deal) => handleOpenModal("edit", deal)}
            onDelete={handleDeleteDeal}
          />
        ) : null}

        {view === "compact" ? (
          <DealsCompactView
            deals={filteredDeals}
            onEdit={(deal) => handleOpenModal("edit", deal)}
            onDelete={handleDeleteDeal}
          />
        ) : null}
      </div>

      <DealsFiltersSheet
        isOpen={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        filters={filters}
        owners={ownersWithFallback}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setIsFiltersOpen(false);
        }}
        onReset={() => {
          resetFilters();
          setIsFiltersOpen(false);
        }}
      />

      <DealModal
        isOpen={isModalOpen}
        mode={modalMode}
        deal={activeDeal}
        owners={ownersWithFallback}
        isSubmitting={isSaving}
        onClose={handleCloseModal}
        onSubmit={modalMode === "edit" ? handleUpdateDeal : handleCreateDeal}
      />
    </div>
  );
}
