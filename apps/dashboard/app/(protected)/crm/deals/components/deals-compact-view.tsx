"use client";

import * as React from "react";
import type { Deal } from "@/lib/db/schema/deals";
import { Building2, MoreHorizontal, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DEAL_STAGE_BADGE_CLASSNAME, type DealStage } from "../constants";
import { formatCurrency, formatDate } from "../utils";

interface DealsCompactViewProps {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

export default function DealsCompactView({ deals, onEdit, onDelete }: DealsCompactViewProps) {
  if (deals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
        No deals match your criteria. Try adjusting filters or add a new deal to get started.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {deals.map((deal) => {
        const stage = deal.stage as DealStage;
        return (
          <Card key={deal.id} className="flex flex-col gap-3 rounded-lg border p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1">
                <h3 className="text-lg font-semibold leading-tight">{deal.title}</h3>
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {deal.company}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Open deal actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onEdit(deal)}>View / Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onSelect={() => onDelete(deal)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between">
              <Badge className={DEAL_STAGE_BADGE_CLASSNAME[stage]}>{stage}</Badge>
              <span className="font-semibold text-foreground">{formatCurrency(deal.value)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">Owner</span>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  {deal.owner}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">Close date</span>
                <span>{formatDate(deal.closeDate)}</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

