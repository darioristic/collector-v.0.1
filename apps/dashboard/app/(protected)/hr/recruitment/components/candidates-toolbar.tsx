"use client";

import { Search, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_FILTER_VALUE = "__all__";

const STATUS_OPTIONS = [
  { label: "Applied", value: "applied" },
  { label: "Screening", value: "screening" },
  { label: "Interview", value: "interview" },
  { label: "Offer", value: "offer" },
  { label: "Hired", value: "hired" },
  { label: "Rejected", value: "rejected" },
] as const;

interface CandidatesToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: {
    status?: string;
    position?: string;
  };
  onFiltersChange: (filters: Partial<CandidatesToolbarProps["filters"]>) => void;
  isDisabled?: boolean;
  onResetFilters: () => void;
}

export default function CandidatesToolbar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  isDisabled = false,
  onResetFilters,
}: CandidatesToolbarProps) {
  const hasActiveFilters =
    Boolean(filters.status) ||
    Boolean(filters.position) ||
    Boolean(searchValue);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, email, or position"
            className="pl-10"
            disabled={isDisabled}
            aria-label="Search candidates"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Select
            value={filters.status ?? ALL_FILTER_VALUE}
            onValueChange={(value) =>
              onFiltersChange({
                status: value === ALL_FILTER_VALUE ? undefined : value,
              })
            }
            disabled={isDisabled}
          >
            <SelectTrigger className="sm:w-40" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={filters.position ?? ""}
            onChange={(event) =>
              onFiltersChange({
                position: event.target.value || undefined,
              })
            }
            placeholder="Filter by position"
            className="sm:w-48"
            disabled={isDisabled}
            aria-label="Filter by position"
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              disabled={isDisabled}
              className="gap-2"
            >
              <X className="size-4" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

