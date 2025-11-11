import {
  type ActivityPriority,
  type ActivityStatus,
  type ActivityType,
  ACTIVITY_PRIORITIES,
  ACTIVITY_STATUSES,
  ACTIVITY_TYPES
} from "@crm/types";
import {
  CalendarClock,
  CheckSquare,
  PhoneCall,
  Redo2,
  UsersRound,
  type LucideIcon
} from "lucide-react";

import { cn } from "@/lib/utils";

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  call: "Call",
  meeting: "Meeting",
  task: "Task",
  follow_up: "Follow-up"
};

export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  missed: "Missed"
};

export const ACTIVITY_PRIORITY_LABEL: Record<ActivityPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low"
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, LucideIcon> = {
  call: PhoneCall,
  meeting: UsersRound,
  task: CheckSquare,
  follow_up: Redo2
};

export const ACTIVITY_STATUS_STYLES: Record<ActivityStatus, string> = {
  scheduled: "bg-sky-100 text-sky-800 border-sky-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  missed: "bg-rose-100 text-rose-800 border-rose-200"
};

export const ACTIVITY_PRIORITY_STYLES: Record<ActivityPriority, string> = {
  high: "bg-rose-100 text-rose-700 border-rose-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200"
};

export const ACTIVITY_TYPE_OPTIONS = ACTIVITY_TYPES.map((type) => ({
  value: type,
  label: ACTIVITY_TYPE_LABEL[type],
  icon: ACTIVITY_TYPE_ICONS[type]
}));

export const ACTIVITY_STATUS_OPTIONS = ACTIVITY_STATUSES.map((status) => ({
  value: status,
  label: ACTIVITY_STATUS_LABEL[status]
}));

export const ACTIVITY_PRIORITY_OPTIONS = ACTIVITY_PRIORITIES.map((priority) => ({
  value: priority,
  label: ACTIVITY_PRIORITY_LABEL[priority]
}));

export const pillClassName = (...classes: string[]) =>
  cn(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
    ...classes
  );

