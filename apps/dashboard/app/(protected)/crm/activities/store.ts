"use client";

import { create } from "zustand";

import type {
  Activity,
  ActivityPriority,
  ActivityStatus,
  ActivityType
} from "@crm/types";

export type ActivityView = "calendar" | "list" | "compact";
export type ActivityModalMode = "create" | "edit";

export interface ActivityFiltersState {
  search: string;
  clientId?: string;
  assignedTo?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  type?: ActivityType;
  dateFrom?: string;
  dateTo?: string;
}

interface ActivitiesStoreState {
  activities: Activity[];
  view: ActivityView;
  filters: ActivityFiltersState;
  isModalOpen: boolean;
  modalMode: ActivityModalMode;
  activeActivityId: string | null;
  selectedDate: string | null;
  isSubmitting: boolean;

  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (activity: Activity) => void;
  removeActivity: (id: string) => void;

  setView: (view: ActivityView) => void;
  setFilters: (filters: Partial<ActivityFiltersState>) => void;
  resetFilters: () => void;

  setModal: (isOpen: boolean, mode?: ActivityModalMode, activityId?: string | null) => void;
  setSelectedDate: (isoDate: string | null) => void;
  setSubmitting: (isSubmitting: boolean) => void;
}

const initialFilters: ActivityFiltersState = {
  search: ""
};

export const useActivitiesStore = create<ActivitiesStoreState>((set) => ({
  activities: [],
  view: "calendar",
  filters: initialFilters,
  isModalOpen: false,
  modalMode: "create",
  activeActivityId: null,
  selectedDate: null,
  isSubmitting: false,

  setActivities: (activities) => set(() => ({ activities })),

  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities]
    })),

  updateActivity: (activity) =>
    set((state) => ({
      activities: state.activities.map((item) => (item.id === activity.id ? { ...item, ...activity } : item))
    })),

  removeActivity: (id) =>
    set((state) => ({
      activities: state.activities.filter((activity) => activity.id !== id)
    })),

  setView: (view) => set(() => ({ view })),

  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
        search: filters.search ?? state.filters.search ?? ""
      }
    })),

  resetFilters: () => set(() => ({ filters: { ...initialFilters } })),

  setModal: (isOpen, mode = "create", activityId = null) =>
    set(() => ({
      isModalOpen: isOpen,
      modalMode: mode,
      activeActivityId: activityId
    })),

  setSelectedDate: (isoDate) => set(() => ({ selectedDate: isoDate })),

  setSubmitting: (isSubmitting) => set(() => ({ isSubmitting }))
}));

