"use client";

import { Search, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PerformanceReviewsToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: {
    employeeId?: string;
    reviewerId?: string;
  };
  onFiltersChange: (filters: Partial<PerformanceReviewsToolbarProps["filters"]>) => void;
  isDisabled?: boolean;
  onResetFilters: () => void;
}

export default function PerformanceReviewsToolbar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  isDisabled = false,
  onResetFilters
}: PerformanceReviewsToolbarProps) {
  const hasActiveFilters =
    Boolean(filters.employeeId) || Boolean(filters.reviewerId) || Boolean(searchValue);

  return (
    <div className="border-border bg-card/80 flex flex-col gap-4 rounded-xl border p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by comments or goals"
            className="pl-10"
            disabled={isDisabled}
            aria-label="Search performance reviews"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              disabled={isDisabled}
              className="gap-2">
              <X className="size-4" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
