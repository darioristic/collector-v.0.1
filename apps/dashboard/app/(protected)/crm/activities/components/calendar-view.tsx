"use client";

import * as React from "react";

import type { Activity, ActivityStatus } from "@crm/types";
import { addHours, startOfDay } from "date-fns";

import {
  EventCalendar,
  type CalendarEvent,
  type EventColor
} from "@/app/(protected)/apps/calendar/components";
import { useActivitiesStore } from "../store";

interface CalendarViewProps {
  onCreate: (dueDate: Date) => void;
  onEdit: (activity: Activity) => void;
  onStatusChange: (activity: Activity, status: ActivityStatus) => void;
  onReschedule?: (activity: Activity, start: Date, end: Date) => void;
  onDelete?: (activity: Activity) => void;
}

const STATUS_COLOR_MAP: Record<ActivityStatus, EventColor> = {
  scheduled: "sky",
  in_progress: "amber",
  completed: "emerald",
  missed: "rose"
};

const getEventColor = (activity: Activity): EventColor => STATUS_COLOR_MAP[activity.status] ?? "sky";

export function CalendarView(props: CalendarViewProps) {
  const { onCreate, onEdit, onReschedule, onDelete } = props;
  const activities = useActivitiesStore((state) => state.activities);
  const setSelectedDate = useActivitiesStore((state) => state.setSelectedDate);

  const events = React.useMemo<CalendarEvent[]>(() => {
    return activities.map((activity) => {
      const start = new Date(activity.dueDate);
      const end = addHours(start, 1);

      return {
        id: activity.id,
        title: activity.title,
        description: activity.notes ?? undefined,
        start,
        end,
        allDay: false,
        color: getEventColor(activity),
        location: activity.clientName
      };
    });
  }, [activities]);

  const findActivity = React.useCallback(
    (id: string) => activities.find((activity) => activity.id === id),
    [activities]
  );

  const handleCreate = React.useCallback(
    (date: Date) => {
      const normalized = startOfDay(date);
      setSelectedDate(normalized.toISOString());
      onCreate(normalized);
    },
    [onCreate, setSelectedDate]
  );

  const handleSelect = React.useCallback(
    (event: CalendarEvent) => {
      const activity = findActivity(event.id);
      if (!activity) {
      return;
    }

      setSelectedDate(startOfDay(new Date(activity.dueDate)).toISOString());
      onEdit(activity);
    },
    [findActivity, onEdit, setSelectedDate]
  );

  const handleUpdate = React.useCallback(
    (event: CalendarEvent) => {
      const activity = findActivity(event.id);
      if (!activity || !onReschedule) {
      return;
    }

      onReschedule(activity, event.start, event.end);
    },
    [findActivity, onReschedule]
  );

  const handleDelete = React.useCallback(
    (eventId: string) => {
      const activity = findActivity(eventId);
      if (!activity || !onDelete) {
      return;
    }

      onDelete(activity);
    },
    [findActivity, onDelete]
  );

  return (
    <EventCalendar
      events={events}
      className="border bg-card"
      disableEventDialog
      onEventCreateRequest={handleCreate}
      onEventSelectRequest={handleSelect}
      onEventUpdate={handleUpdate}
      onEventDelete={handleDelete}
    />
  );
}

