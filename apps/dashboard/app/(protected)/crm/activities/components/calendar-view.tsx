"use client";

import * as React from "react";

import type { Activity, ActivityStatus } from "@crm/types";
import {
  addMonths,
  format,
  isSameDay,
  isToday,
  startOfDay
} from "date-fns";
import {
  Calendar as CalendarIcon,
  Check,
  Clock,
  MoreHorizontal,
  PenSquare,
  XCircle
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  ACTIVITY_PRIORITY_LABEL,
  ACTIVITY_PRIORITY_STYLES,
  ACTIVITY_STATUS_LABEL,
  ACTIVITY_STATUS_STYLES,
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_TYPE_LABEL,
  pillClassName
} from "../constants";
import { useActivitiesStore } from "../store";

interface CalendarViewProps {
  onCreate: (dueDate: Date) => void;
  onEdit: (activity: Activity) => void;
  onStatusChange: (activity: Activity, status: ActivityStatus) => void;
}

const getActivityInitials = (activity: Activity) => {
  if (activity.assignedToName) {
    return activity.assignedToName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return activity.clientName
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const formatTimeLabel = (date: Date) => format(date, "HH:mm");

export function CalendarView({ onCreate, onEdit, onStatusChange }: CalendarViewProps) {
  const activities = useActivitiesStore((state) => state.activities);
  const selectedDateIso = useActivitiesStore((state) => state.selectedDate);
  const setSelectedDate = useActivitiesStore((state) => state.setSelectedDate);

  const selectedDate = React.useMemo(() => {
    if (selectedDateIso) {
      return new Date(selectedDateIso);
    }

    return startOfDay(new Date());
  }, [selectedDateIso]);

  const groupedByDay = React.useMemo(() => {
    return activities.reduce<Record<string, Activity[]>>((accumulator, activity) => {
      const key = format(new Date(activity.dueDate), "yyyy-MM-dd");
      if (!accumulator[key]) {
        accumulator[key] = [];
      }

      accumulator[key]?.push(activity);
      accumulator[key]?.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      return accumulator;
    }, {});
  }, [activities]);

  const eventsDates = React.useMemo(
    () => Object.keys(groupedByDay).map((key) => new Date(key)),
    [groupedByDay]
  );

  const selectedDayKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayActivities = groupedByDay[selectedDayKey] ?? [];

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      return;
    }

    const normalized = startOfDay(day);
    const normalizedIso = normalized.toISOString();

    if (selectedDateIso && isSameDay(normalized, new Date(selectedDateIso))) {
      onCreate(normalized);
      return;
    }

    setSelectedDate(normalizedIso);
  };

  const handleStatusChange = (activity: Activity, status: ActivityStatus) => {
    if (activity.status === status) {
      return;
    }
    onStatusChange(activity, status);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Calendar</h3>
            <p className="text-sm text-muted-foreground">
              Select a date to manage client activities. Select again to schedule a new one.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(startOfDay(addMonths(selectedDate, -1)).toISOString())}>
                    <CalendarIcon className="mr-2 h-4 w-4" aria-hidden />
                    {format(addMonths(selectedDate, -1), "MMM yyyy")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous month</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(startOfDay(new Date()).toISOString())}>
                    Today
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Jump to today</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(startOfDay(addMonths(selectedDate, 1)).toISOString())}>
                    <CalendarIcon className="mr-2 h-4 w-4" aria-hidden />
                    {format(addMonths(selectedDate, 1), "MMM yyyy")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next month</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            showOutsideDays
            modifiers={{ hasEvents: eventsDates }}
            modifiersClassNames={{
              hasEvents: "text-primary font-semibold",
              selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            }}
            className="mx-auto"
          />
        </div>
      </div>
      <div className="flex h-full flex-col rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              {format(selectedDate, "EEEE, MMMM d")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isToday(selectedDate)
                ? "Today"
                : `Selected date: ${format(selectedDate, "MMM dd, yyyy")}`}
            </p>
          </div>
          <Button onClick={() => onCreate(selectedDate)}>Add Activity</Button>
        </div>
        <ScrollArea className="h-[420px]">
          <div className="space-y-3 p-4">
            {selectedDayActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-16 text-center">
                <CalendarIcon className="mb-2 h-8 w-8 text-muted-foreground/60" aria-hidden />
                <h4 className="text-base font-semibold">No activities scheduled</h4>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Select the date again or use the button above to create a new client activity.
                </p>
              </div>
            ) : (
              selectedDayActivities.map((activity) => {
                const ActivityIcon = ACTIVITY_TYPE_ICONS[activity.type];
                const dueDate = new Date(activity.dueDate);
                return (
                  <div
                    key={activity.id}
                    className="group relative flex flex-col gap-3 rounded-lg border bg-background/60 p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary",
                            "ring-2 ring-primary/20"
                          )}>
                          <ActivityIcon className="h-5 w-5" aria-hidden />
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold leading-tight">{activity.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{activity.clientName}</span>
                            <span aria-hidden>&middot;</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" aria-hidden />
                              {formatTimeLabel(dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Activity actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(activity)}>
                            <PenSquare className="mr-2 h-4 w-4" aria-hidden />
                            Edit Activity
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={activity.status === "completed"}
                            onClick={() => handleStatusChange(activity, "completed")}>
                            <Check className="mr-2 h-4 w-4" aria-hidden />
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={activity.status === "missed"}
                            onClick={() => handleStatusChange(activity, "missed")}>
                            <XCircle className="mr-2 h-4 w-4" aria-hidden />
                            Mark as Missed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge className={pillClassName(ACTIVITY_STATUS_STYLES[activity.status])}>
                        {ACTIVITY_STATUS_LABEL[activity.status]}
                      </Badge>
                      <Badge className={pillClassName(ACTIVITY_PRIORITY_STYLES[activity.priority])}>
                        Priority: {ACTIVITY_PRIORITY_LABEL[activity.priority]}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {ACTIVITY_TYPE_LABEL[activity.type]}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getActivityInitials(activity)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium">
                            {activity.assignedToName ?? "Unassigned"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {activity.assignedToEmail ?? "No email"}
                          </p>
                        </div>
                      </div>
                      {activity.notes ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="line-clamp-1 max-w-[220px] text-xs">
                                “{activity.notes}”
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              {activity.notes}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

