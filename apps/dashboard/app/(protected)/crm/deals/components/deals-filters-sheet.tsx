"use client";

import * as React from "react";
import { Filter, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupItem } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DEAL_STAGE_BADGE_CLASSNAME, DEAL_STAGES, type DealStage } from "../constants";
import type { DealFiltersState } from "../store";

interface DealsFiltersSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: DealFiltersState;
  owners: string[];
  onApply: (filters: Partial<DealFiltersState>) => void;
  onReset: () => void;
}

export default function DealsFiltersSheet({
  isOpen,
  onOpenChange,
  filters,
  owners,
  onApply,
  onReset,
}: DealsFiltersSheetProps) {
  const [stage, setStage] = React.useState<string>("all");
  const [owner, setOwner] = React.useState<string>("all");
  const [search, setSearch] = React.useState<string>("");

  React.useEffect(() => {
    setStage(filters.stage ?? "all");
    setOwner(filters.owner ?? "all");
    setSearch(filters.search ?? "");
  }, [filters]);

  const handleApply = React.useCallback(() => {
    const next: Partial<DealFiltersState> = {
      stage: stage === "all" ? undefined : (stage as DealStage),
      owner: owner === "all" ? undefined : owner,
      search: search.trim(),
    };

    onApply(next);
  }, [onApply, owner, search, stage]);

  const handleClearAll = React.useCallback(() => {
    setStage("all");
    setOwner("all");
    setSearch("");
    onReset();
  }, [onReset]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filter deals</SheetTitle>
          <SheetDescription>Refine the list by stage, owner, or search keywords.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Stage</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setStage("all")}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </Button>
            </div>
            <ButtonGroup className="flex flex-wrap gap-2">
              <ButtonGroupItem
                isActive={stage === "all"}
                onClick={() => setStage("all")}
                className="px-3 py-2 text-sm"
              >
                All stages
              </ButtonGroupItem>
              {DEAL_STAGES.map((item) => (
                <ButtonGroupItem
                  key={item}
                  isActive={stage === item}
                  onClick={() => setStage(item)}
                  className="px-3 py-2 text-sm"
                >
                  <Badge className={DEAL_STAGE_BADGE_CLASSNAME[item]}>{item}</Badge>
                </ButtonGroupItem>
              ))}
            </ButtonGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Owner</h3>
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                {owners.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Search</h3>
            <Input
              placeholder="Search by name, company, or owner"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <SheetClose asChild>
            <Button type="button" variant="outline" className="gap-2" onClick={handleApply}>
              <Filter className="h-4 w-4" aria-hidden="true" />
              Apply filters
            </Button>
          </SheetClose>
          <Button type="button" variant="secondary" onClick={handleClearAll}>
            Clear all
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

