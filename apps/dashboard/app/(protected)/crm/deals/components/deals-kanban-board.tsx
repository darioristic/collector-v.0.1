"use client";

import * as React from "react";
import type { Deal } from "@/lib/db/schema/deals";
import { CalendarClock, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import * as Kanban from "@/components/ui/kanban";
import { DEAL_STAGE_BADGE_CLASSNAME, DEAL_STAGE_DESCRIPTIONS, DEAL_STAGES, type DealStage } from "../constants";
import { formatCurrency, formatDate, getInitials } from "../utils";

interface DealsKanbanBoardProps {
  deals: Deal[];
  onCardClick: (deal: Deal) => void;
  onStageChange: (dealId: string, stage: DealStage) => void;
}

export default function DealsKanbanBoard({ deals, onCardClick, onStageChange }: DealsKanbanBoardProps) {
  const groupedDeals = React.useMemo(() => {
    const grouped = DEAL_STAGES.reduce(
      (acc, stage) => {
        acc[stage] = [] as Deal[];
        return acc;
      },
      {} as Record<DealStage, Deal[]>,
    );

    deals.forEach((deal) => {
      const stage = (deal.stage as DealStage) ?? DEAL_STAGES[0];
      grouped[stage]?.push(deal);
    });

    return grouped;
  }, [deals]);

  const [columns, setColumns] = React.useState<Record<DealStage, Deal[]>>(groupedDeals);

  React.useEffect(() => {
    setColumns(groupedDeals);
  }, [groupedDeals]);

  const dealIndex = React.useMemo(() => {
    const map = new Map<string, Deal>();
    DEAL_STAGES.forEach((stage) => {
      columns[stage]?.forEach((deal) => {
        map.set(deal.id, deal);
      });
    });
    return map;
  }, [columns]);

  const handleValueChange = React.useCallback(
    (nextColumns: Record<DealStage, Deal[]>) => {
      let movedDeal: { id: string; stage: DealStage } | null = null;

      for (const stage of DEAL_STAGES) {
        const nextIds = new Set(nextColumns[stage]?.map((deal) => deal.id) ?? []);
        const prevIds = new Set(columns[stage]?.map((deal) => deal.id) ?? []);

        // deal removed from previous column
        for (const id of prevIds) {
          if (!nextIds.has(id)) {
            // find where it landed
            for (const targetStage of DEAL_STAGES) {
              if (targetStage === stage) continue;
              const targetIds = nextColumns[targetStage]?.map((deal) => deal.id) ?? [];
              if (targetIds.includes(id)) {
                movedDeal = { id, stage: targetStage };
                break;
              }
            }
          }
          if (movedDeal) break;
        }
        if (movedDeal) break;
      }

      setColumns(nextColumns);

      if (movedDeal) {
        onStageChange(movedDeal.id, movedDeal.stage);
      }
    },
    [columns, onStageChange],
  );

  const getProgressForStage = (stage: DealStage) => {
    const index = DEAL_STAGES.indexOf(stage);
    if (index < 0) return 0;
    if (DEAL_STAGES.length === 1) return 100;
    return Math.round((index / (DEAL_STAGES.length - 1)) * 100);
  };

  return (
    <Kanban.Root
      value={columns}
      onValueChange={handleValueChange}
      getItemValue={(deal) => deal.id}
      accessibility={{
        announcements: {
          onDragStart({ active }) {
            return `Selected ${String(active.id)}`;
          },
          onDragEnd({ active, over }) {
            if (!over) return `Dropping ${String(active.id)} canceled`;
            return `${String(active.id)} dropped in ${String(over.id)}`;
          }
        }
      }}
    >
      <Kanban.Board className="flex w-full gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => {
          const items = columns[stage] ?? [];
          const progress = getProgressForStage(stage);

          return (
            <Kanban.Column
              key={stage}
              value={stage}
              className="w-[340px] min-w-[320px] flex-1 rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur transition"
            >
              <div className="flex items-start justify-between gap-2 rounded-lg border border-dashed border-border/60 bg-muted/40 px-3 py-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                      <span>{stage}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">{progress}%</span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-5">
                        {DEAL_STAGE_DESCRIPTIONS[stage]}
                      </p>
                    </div>
                    <Badge className={DEAL_STAGE_BADGE_CLASSNAME[stage]}>{items.length}</Badge>
                  </div>

              <div className="mt-3 flex min-h-[18rem] flex-1 flex-col gap-2">
                    {items.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                        Drop deals here
                      </div>
                    ) : null}

                <div className="flex flex-1 flex-col gap-2">
                  {items.map((deal) => (
                    <Kanban.Item key={deal.id} value={deal.id} asChild>
                          <Card
                        className="cursor-grab rounded-lg border bg-background/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg"
                            onClick={() => onCardClick(deal)}
                          >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                                <h3 className="text-base font-semibold leading-6">{deal.title}</h3>
                                <p className="text-muted-foreground text-sm">{deal.company}</p>
                              </div>
                          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                                {formatCurrency(deal.value)}
                              </Badge>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback>{getInitials(deal.owner)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">{deal.owner}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>{formatDate(deal.closeDate)}</span>
                              </div>
                            </div>
                          </Card>
                    </Kanban.Item>
                    ))}
                </div>
              </div>
            </Kanban.Column>
          );
        })}
      </Kanban.Board>

      <Kanban.Overlay>
        {({ value, variant }) => {
          if (variant === "column") {
            return (
              <Card className="border-primary/60 bg-background/90 px-4 py-3 shadow-xl">
                <div className="animate-pulse text-sm font-semibold text-primary">Reordering stages…</div>
              </Card>
            );
          }

          const deal = dealIndex.get(String(value));
          if (!deal) {
            return null;
          }

          return (
            <Card className="w-[300px] rounded-lg border border-primary/60 bg-background/95 p-4 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold leading-6">{deal.title}</h3>
                  <p className="text-muted-foreground text-sm">{deal.company}</p>
                </div>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                  {formatCurrency(deal.value)}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{getInitials(deal.owner)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{deal.owner}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{formatDate(deal.closeDate)}</span>
                </div>
      </div>
            </Card>
          );
        }}
      </Kanban.Overlay>
    </Kanban.Root>
  );
}

