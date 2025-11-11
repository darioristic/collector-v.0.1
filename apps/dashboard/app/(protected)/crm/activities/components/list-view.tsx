"use client";

import * as React from "react";

import type { Activity, ActivityStatus } from "@crm/types";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, CalendarClock, MoreHorizontal, PenSquare } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  ACTIVITY_PRIORITY_LABEL,
  ACTIVITY_PRIORITY_STYLES,
  ACTIVITY_STATUS_LABEL,
  ACTIVITY_STATUS_STYLES,
  ACTIVITY_TYPE_LABEL,
  pillClassName
} from "../constants";

type SortKey = "title" | "clientName" | "dueDate" | "status" | "priority" | "assignedToName";

type SortDirection = "asc" | "desc";

interface ListViewProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onStatusChange: (activity: Activity, status: ActivityStatus) => void;
  onDelete?: (activity: Activity) => void;
}

const getInitials = (name?: string | null) => {
  if (!name) return "NA";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const compareValues = (a: string | number, b: string | number) => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

export function ListView({ activities, onEdit, onStatusChange, onDelete }: ListViewProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>("dueDate");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  const sortedActivities = React.useMemo(() => {
    const sorted = [...activities].sort((a, b) => {
      let value = 0;
      switch (sortKey) {
        case "title":
          value = compareValues(a.title.toLowerCase(), b.title.toLowerCase());
          break;
        case "clientName":
          value = compareValues(a.clientName.toLowerCase(), b.clientName.toLowerCase());
          break;
        case "dueDate":
          value = compareValues(new Date(a.dueDate).getTime(), new Date(b.dueDate).getTime());
          break;
        case "status":
          value = compareValues(a.status, b.status);
          break;
        case "priority":
          value = compareValues(a.priority, b.priority);
          break;
        case "assignedToName":
          value = compareValues(
            (a.assignedToName ?? "").toLowerCase(),
            (b.assignedToName ?? "").toLowerCase()
          );
          break;
      }

      return sortDirection === "asc" ? value : -value;
    });

    return sorted;
  }, [activities, sortDirection, sortKey]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  const renderSortIcon = (key: SortKey) => {
    if (key !== sortKey) {
      return <ArrowDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden />;
    }

    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5" aria-hidden />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5" aria-hidden />
    );
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Activities List</h3>
          <p className="text-sm text-muted-foreground">Sortable view of all client activities.</p>
        </div>
        <span className="text-sm text-muted-foreground">
          {sortedActivities.length} activity{sortedActivities.length === 1 ? "" : "ies"}
        </span>
      </div>
      <ScrollArea className="max-h-[520px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort("title")}
                  className="flex w-full items-center text-left font-semibold">
                  Activity
                  {renderSortIcon("title")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort("clientName")}
                  className="flex w-full items-center text-left font-semibold">
                  Client
                  {renderSortIcon("clientName")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort("dueDate")}
                  className="flex w-full items-center text-left font-semibold">
                  Due Date
                  {renderSortIcon("dueDate")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort("status")}
                  className="flex w-full items-center text-left font-semibold">
                  Status
                  {renderSortIcon("status")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort("priority")}
                  className="flex w-full items-center text-left font-semibold">
                  Priority
                  {renderSortIcon("priority")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort("assignedToName")}
                  className="flex w-full items-center text-left font-semibold">
                  Assigned To
                  {renderSortIcon("assignedToName")}
                </button>
              </TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                  No activities match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              sortedActivities.map((activity) => {
                const dueDate = new Date(activity.dueDate);
                return (
                  <TableRow key={activity.id} className="group">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
                            {ACTIVITY_TYPE_LABEL[activity.type]}
                          </Badge>
                          <span className="font-medium">{activity.title}</span>
                        </div>
                        {activity.notes ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                  “{activity.notes}”
                                </p>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">{activity.notes}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{activity.clientName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
                        <div className="flex flex-col">
                          <span>{format(dueDate, "MMM dd, yyyy")}</span>
                          <span className="text-xs text-muted-foreground">{format(dueDate, "HH:mm")}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={pillClassName(ACTIVITY_STATUS_STYLES[activity.status])}>
                        {ACTIVITY_STATUS_LABEL[activity.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={pillClassName(ACTIVITY_PRIORITY_STYLES[activity.priority])}>
                        {ACTIVITY_PRIORITY_LABEL[activity.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(activity.assignedToName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {activity.assignedToName ?? "Unassigned"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {activity.assignedToEmail ?? "No email"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Open actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(activity)}>
                            <PenSquare className="mr-2 h-4 w-4" aria-hidden />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={activity.status === "completed"}
                            onClick={() => onStatusChange(activity, "completed")}>
                            Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={activity.status === "missed"}
                            onClick={() => onStatusChange(activity, "missed")}>
                            Mark Missed
                          </DropdownMenuItem>
                          {onDelete ? (
                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(activity)}>
                              Cancel Activity
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

