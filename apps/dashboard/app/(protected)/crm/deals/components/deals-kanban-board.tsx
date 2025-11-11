"use client";

import * as React from "react";
import type { Deal } from "@/lib/db/schema/deals";
import { CalendarClock } from "lucide-react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DEAL_STAGE_BADGE_CLASSNAME, DEAL_STAGE_DESCRIPTIONS, DEAL_STAGES, type DealStage } from "../constants";
import { formatCurrency, formatDate, getInitials } from "../utils";

interface DealsKanbanBoardProps {
  deals: Deal[];
  onCardClick: (deal: Deal) => void;
  onStageChange: (dealId: string, stage: DealStage) => void;
}

const stageTitleClassName =
  "flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium";

export default function DealsKanbanBoard({ deals, onCardClick, onStageChange }: DealsKanbanBoardProps) {
  const columns = React.useMemo(() => {
    const grouped: Record<DealStage, Deal[]> = DEAL_STAGES.reduce(
      (acc, stage) => {
        acc[stage] = [];
        return acc;
      },
      {} as Record<DealStage, Deal[]>,
    );

    deals.forEach((deal) => {
      const stage = (deal.stage as DealStage) ?? DEAL_STAGES[0];
      if (!grouped[stage]) {
        grouped[stage] = [];
      }
      grouped[stage].push(deal);
    });

    return grouped;
  }, [deals]);

  const handleDragEnd = React.useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) {
        return;
      }

      const sourceStage = source.droppableId as DealStage;
      const targetStage = destination.droppableId as DealStage;

      if (sourceStage === targetStage) {
        return;
      }

      onStageChange(draggableId, targetStage);
    },
    [onStageChange],
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {DEAL_STAGES.map((stage) => {
          const items = columns[stage] ?? [];
          return (
            <Droppable key={stage} droppableId={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex h-full min-h-[18rem] flex-col gap-3 rounded-lg border bg-card p-3 transition ${
                    snapshot.isDraggingOver ? "border-primary/60 ring-1 ring-primary/50" : ""
                  }`}
                >
                  <div className={stageTitleClassName}>
                    <div>
                      <span>{stage}</span>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {DEAL_STAGE_DESCRIPTIONS[stage]}
                      </p>
                    </div>
                    <Badge className={DEAL_STAGE_BADGE_CLASSNAME[stage]}>{items.length}</Badge>
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    {items.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
                        Drop deals here
                      </div>
                    ) : null}

                    {items.map((deal, index) => (
                      <Draggable draggableId={deal.id} index={index} key={deal.id}>
                        {(draggableProvided, draggableSnapshot) => (
                          <Card
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                            className={`cursor-grab rounded-lg border bg-background p-4 shadow-sm transition hover:border-primary/70 ${
                              draggableSnapshot.isDragging ? "shadow-lg ring-2 ring-primary/60" : ""
                            }`}
                            onClick={() => onCardClick(deal)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-base font-semibold leading-6">{deal.title}</h3>
                                <p className="text-muted-foreground text-sm">{deal.company}</p>
                              </div>
                              <Badge className="bg-primary/10 text-primary-foreground">
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
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}

