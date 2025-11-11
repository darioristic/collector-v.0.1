"use client";

import * as React from "react";

import type {
  Activity,
  ActivityCreateInput,
  ActivityPriority,
  ActivityStatus,
  ActivityType
} from "@crm/types";
import { endOfDay, format, startOfDay } from "date-fns";
import { Filter, Plus } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import {
  createClientActivity,
  deleteClientActivity,
  fetchClientActivities,
  fetchClientActivityMetadata,
  updateClientActivity
} from "./data";
import {
  ACTIVITY_PRIORITY_LABEL,
  ACTIVITY_PRIORITY_OPTIONS,
  ACTIVITY_STATUS_LABEL,
  ACTIVITY_STATUS_OPTIONS,
  ACTIVITY_TYPE_LABEL,
  ACTIVITY_TYPE_OPTIONS
} from "./constants";
import { ActivityForm } from "./components/activity-form";
import { CalendarView } from "./components/calendar-view";
import { CompactView } from "./components/compact-view";
import { ListView } from "./components/list-view";
import { useActivitiesStore, type ActivityModalMode } from "./store";

type Option = {
  id: string;
  name: string;
  email?: string | null;
};

interface ClientActivitiesPageClientProps {
  initialActivities: Activity[];
  clients: Option[];
  assignees: Option[];
}

const toIso = (date: Date | undefined | null) => (date ? date.toISOString() : undefined);

const normalizeRange = (range: DateRange | undefined): { from?: string; to?: string } => {
  if (!range) {
    return {};
  }

  return {
    from: toIso(range.from ? startOfDay(range.from) : undefined),
    to: toIso(range.to ? endOfDay(range.to) : undefined)
  };
};

export function ClientActivitiesPageClient({
  initialActivities,
  clients,
  assignees
}: ClientActivitiesPageClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [isFilterSheetOpen, setFilterSheetOpen] = React.useState(false);
  const [isRefreshing, setRefreshing] = React.useState(false);

  const activities = useActivitiesStore((state) => state.activities);
  const setActivities = useActivitiesStore((state) => state.setActivities);
  const addActivity = useActivitiesStore((state) => state.addActivity);
  const updateActivity = useActivitiesStore((state) => state.updateActivity);
  const removeActivity = useActivitiesStore((state) => state.removeActivity);
  const view = useActivitiesStore((state) => state.view);
  const setView = useActivitiesStore((state) => state.setView);
  const filters = useActivitiesStore((state) => state.filters);
  const setFilters = useActivitiesStore((state) => state.setFilters);
  const resetFilters = useActivitiesStore((state) => state.resetFilters);
  const isModalOpen = useActivitiesStore((state) => state.isModalOpen);
  const modalMode = useActivitiesStore((state) => state.modalMode);
  const activeActivityId = useActivitiesStore((state) => state.activeActivityId);
  const setModal = useActivitiesStore((state) => state.setModal);
  const selectedDateIso = useActivitiesStore((state) => state.selectedDate);
  const setSelectedDate = useActivitiesStore((state) => state.setSelectedDate);
  const isSubmitting = useActivitiesStore((state) => state.isSubmitting);
  const setSubmitting = useActivitiesStore((state) => state.setSubmitting);

  const [clientOptions, setClientOptions] = React.useState<Option[]>(clients);
  const [assigneeOptions, setAssigneeOptions] = React.useState<Option[]>(assignees);

  const [dateRangeDraft, setDateRangeDraft] = React.useState<DateRange | undefined>(() => {
    if (!filters.dateFrom && !filters.dateTo) return undefined;
    return {
      from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      to: filters.dateTo ? new Date(filters.dateTo) : undefined
    };
  });

  React.useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities, setActivities]);

  React.useEffect(() => {
    setClientOptions(clients);
  }, [clients]);

  React.useEffect(() => {
    setAssigneeOptions(assignees);
  }, [assignees]);

  const activeActivity = React.useMemo(
    () => activities.find((activity) => activity.id === activeActivityId),
    [activities, activeActivityId]
  );

  const filteredActivities = React.useMemo(() => {
    return activities.filter((activity) => {
      if (filters.clientId && activity.clientId !== filters.clientId) {
        return false;
      }

      if (filters.assignedTo && activity.assignedTo !== filters.assignedTo) {
        return false;
      }

      if (filters.status && activity.status !== filters.status) {
        return false;
      }

      if (filters.priority && activity.priority !== filters.priority) {
        return false;
      }

      if (filters.type && activity.type !== filters.type) {
        return false;
      }

      if (filters.dateFrom && new Date(activity.dueDate) < new Date(filters.dateFrom)) {
        return false;
      }

      if (filters.dateTo && new Date(activity.dueDate) > new Date(filters.dateTo)) {
        return false;
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matcher =
          activity.title.toLowerCase().includes(search) ||
          activity.clientName.toLowerCase().includes(search) ||
          activity.assignedToName?.toLowerCase().includes(search) ||
          activity.notes?.toLowerCase().includes(search);

        if (!matcher) {
          return false;
        }
      }

      return true;
    });
  }, [activities, filters]);

  const selectedDate = React.useMemo(() => {
    if (!selectedDateIso) {
      return startOfDay(new Date());
    }
    return new Date(selectedDateIso);
  }, [selectedDateIso]);

  const handleOpenCreateModal = (mode: ActivityModalMode, dueDate?: Date | null, activityId?: string | null) => {
    if (dueDate) {
      setSelectedDate(startOfDay(dueDate).toISOString());
    }
    setModal(true, mode, activityId ?? null);
  };

  const handleCreateClick = () => {
    handleOpenCreateModal("create", selectedDate);
  };

  const handleCreateFromCalendar = (date: Date) => {
    handleOpenCreateModal("create", date);
  };

  const handleEdit = (activity: Activity) => {
    handleOpenCreateModal("edit", new Date(activity.dueDate), activity.id);
  };

  const handleStatusChange = (activity: Activity, status: ActivityStatus) => {
    startTransition(async () => {
      try {
        setSubmitting(true);
        const updated = await updateClientActivity(activity.id, { status });

        if (updated) {
          updateActivity(updated);
          toast({
            title: "Activity updated",
            description: `${activity.title} marked as ${ACTIVITY_STATUS_LABEL[status]}.`
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Unable to update activity",
          description: "Please try again.",
          variant: "destructive"
        });
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleDelete = (activity: Activity) => {
    startTransition(async () => {
      try {
        setSubmitting(true);
        await deleteClientActivity(activity.id);
        removeActivity(activity.id);
        toast({
          title: "Activity cancelled",
          description: `${activity.title} was removed from the schedule.`
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "Unable to cancel activity",
          description: "Please try again.",
          variant: "destructive"
        });
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleModalClose = () => {
    setModal(false);
  };

  const handleFormSubmit = (values: ActivityCreateInput) => {
    startTransition(async () => {
      try {
        setSubmitting(true);
        if (modalMode === "edit" && activeActivity) {
          const updated = await updateClientActivity(activeActivity.id, values);
          if (updated) {
            updateActivity(updated);
            toast({
              title: "Activity updated",
              description: `${updated.title} was updated successfully.`
            });
          }
        } else {
          const created = await createClientActivity(values);
          addActivity(created);
          toast({
            title: "Activity created",
            description: `${created.title} scheduled for ${format(
              new Date(created.dueDate),
              "MMM dd, yyyy HH:mm"
            )}.`
          });
        }
        setModal(false);
      } catch (error) {
        console.error(error);
        toast({
          title: "Action failed",
          description: "We couldn't save the activity. Please try again.",
          variant: "destructive"
        });
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: event.target.value });
  };

  const applyDateRangeFilter = (range: DateRange | undefined) => {
    setDateRangeDraft(range);
    const normalized = normalizeRange(range);
    setFilters({
      dateFrom: normalized.from,
      dateTo: normalized.to
    });
  };

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        setRefreshing(true);
        const queryFilters = {
          clientId: filters.clientId,
          assignedTo: filters.assignedTo,
          status: filters.status,
          priority: filters.priority,
          type: filters.type,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo
        };
        const [freshActivities, metadata] = await Promise.all([
          fetchClientActivities(queryFilters),
          fetchClientActivityMetadata()
        ]);

        setActivities(freshActivities);
        setClientOptions(metadata.clients);
        setAssigneeOptions(metadata.assignees);

        if (
          metadata.clients.length !== clientOptions.length ||
          metadata.assignees.length !== assigneeOptions.length
        ) {
          toast({
            title: "Reference data updated",
            description: "New clients or users detected. Reload to pick them up."
          });
        } else {
          toast({
            title: "Activities refreshed",
            description: "You are now seeing the latest activity data."
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Refresh failed",
          description: "Unable to load latest activities.",
          variant: "destructive"
        });
      } finally {
        setRefreshing(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight">Client Activities</h1>
          <p className="text-sm text-muted-foreground">
            Track all your scheduled tasks, meetings, and follow-ups across clients.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search activities..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full min-w-[240px] lg:w-64"
          />
          <Button variant="outline" onClick={() => setFilterSheetOpen(true)}>
            <Filter className="mr-2 h-4 w-4" aria-hidden />
            Filters
          </Button>
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Add Activity
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={view} onValueChange={(value) => setView(value as typeof view)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="compact">Compact View</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="mt-6">
            <CalendarView
              onCreate={handleCreateFromCalendar}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>
          <TabsContent value="list" className="mt-6">
            <ListView
              activities={filteredActivities}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          </TabsContent>
          <TabsContent value="compact" className="mt-6">
            <CompactView
              activities={filteredActivities}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={isFilterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Filter activities</SheetTitle>
            <SheetDescription>Refine the list by client, owner, status, or date range.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Client</label>
                <Select
                  value={filters.clientId ?? ""}
                  onValueChange={(value) => setFilters({ clientId: value || undefined })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All clients</SelectItem>
                    {clientOptions.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Assigned To</label>
                <Select
                  value={filters.assignedTo ?? ""}
                  onValueChange={(value) => setFilters({ assignedTo: value || undefined })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All team members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All team members</SelectItem>
                    {assigneeOptions.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status ?? ""}
                  onValueChange={(value) => setFilters({ status: (value as ActivityStatus) || undefined })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {ACTIVITY_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {ACTIVITY_STATUS_LABEL[option.value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={filters.priority ?? ""}
                  onValueChange={(value) => setFilters({ priority: (value as ActivityPriority) || undefined })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    {ACTIVITY_PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {ACTIVITY_PRIORITY_LABEL[option.value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium">Activity Type</label>
                <Select
                  value={filters.type ?? ""}
                  onValueChange={(value) => setFilters({ type: (value as ActivityType) || undefined })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All activity types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {ACTIVITY_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {ACTIVITY_TYPE_LABEL[option.value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Date Range</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateRangeDraft(undefined);
                    setFilters({ dateFrom: undefined, dateTo: undefined });
                  }}>
                  Clear
                </Button>
              </div>
              <Calendar
                mode="range"
                selected={dateRangeDraft}
                numberOfMonths={2}
                defaultMonth={dateRangeDraft?.from ?? new Date()}
                onSelect={(range) => applyDateRangeFilter(range ?? undefined)}
                initialFocus
              />
            </div>
          </div>
          <SheetFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetFilters();
                setDateRangeDraft(undefined);
              }}>
              Reset filters
            </Button>
            <Button type="button" onClick={() => setFilterSheetOpen(false)}>
              Apply filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isModalOpen} onOpenChange={(open) => (!open ? setModal(false) : null)}>
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{modalMode === "edit" ? "Edit Activity" : "Add Activity"}</DialogTitle>
            <DialogDescription>
              {modalMode === "edit"
                ? "Update the details of this client interaction."
                : "Plan a new call, meeting, or follow-up for your client."}
            </DialogDescription>
          </DialogHeader>
          <ActivityForm
            initialActivity={activeActivity}
            clients={clientOptions}
            assignees={assigneeOptions}
            defaultDueDate={selectedDate.toISOString()}
            isSubmitting={isSubmitting || isPending}
            onSubmit={handleFormSubmit}
            onCancel={handleModalClose}
          />
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>
          Showing <strong>{filteredActivities.length}</strong> of{" "}
          <strong>{activities.length}</strong> activities
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenCreateModal("create", new Date())}>
            Quick add
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing || isPending}>
            {isRefreshing ? <Skeleton className="h-4 w-24" /> : "Refresh"}
          </Button>
        </div>
      </div>
    </div>
  );
}

