"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import {
  CalendarDays,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";

import { TableToolbar } from "@/components/table-toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCreateProject, useProjects } from "@/src/hooks/useProjects";
import type { ProjectStatus, ProjectSummary, ProjectUpdatePayload } from "@/src/types/projects";

const statusTabs: Array<{ value: "all" | ProjectStatus; label: string }> = [
  { value: "all", label: "All Projects" },
  { value: "active", label: "Active" },
  { value: "planned", label: "Planned" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" }
];

const statusStyles: Record<ProjectStatus, string> = {
  planned: "bg-sky-500/10 text-sky-600 border border-sky-200",
  active: "bg-emerald-500/10 text-emerald-600 border border-emerald-200",
  on_hold: "bg-amber-500/10 text-amber-600 border border-amber-200",
  completed: "bg-purple-500/10 text-purple-600 border border-purple-200"
};

const timeframeOptions = [
  { value: "all_time", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" }
] as const;

const dueDateOptions = [
  { value: "all", label: "All Dates" },
  { value: "upcoming", label: "Upcoming Deadlines" },
  { value: "overdue", label: "Overdue" },
  { value: "no_deadline", label: "No Deadline" }
] as const;

const priorityOptions = [
  { value: "all", label: "All Priority" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" }
] as const;

type PriorityLevel = "high" | "medium" | "low";

type CreateProjectFormValues = {
  name: string;
  description: string;
  status: ProjectStatus;
  customer: string;
  startDate: string;
  dueDate: string;
};

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" }
];

const pageSizeOptions = [
  { value: "6", label: "6 / page" },
  { value: "9", label: "9 / page" },
  { value: "12", label: "12 / page" }
];

const priorityStyles: Record<PriorityLevel, string> = {
  high: "bg-rose-500/10 text-rose-600 border border-rose-200",
  medium: "bg-amber-500/10 text-amber-600 border border-amber-200",
  low: "bg-emerald-500/10 text-emerald-600 border border-emerald-200"
};

function formatDateLabel(dateString: string | null): string {
  if (!dateString) {
    return "—";
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return format(parsed, "dd MMM yyyy");
}

function derivePriority(project: ProjectSummary): PriorityLevel {
  if (project.remainingDays !== null && project.remainingDays <= 5) {
    return "high";
  }

  if (project.progress >= 70) {
    return "low";
  }

  if (project.progress >= 40) {
    return "medium";
  }

  return "high";
}

function tasksLabel(project: ProjectSummary): string {
  const remaining = Math.max(project.totalTasks - project.completedTasks, 0);
  if (remaining === 0) {
    return "All tasks done";
  }
  if (remaining === 1) {
    return "1 task left";
  }
  return `${remaining} tasks left`;
}

function buildPaginationRange(current: number, total: number): Array<number | "ellipsis"> {
  const delta = 2;
  const range: Array<number | "ellipsis"> = [];

  const left = Math.max(1, current - delta);
  const right = Math.min(total, current + delta);

  if (left > 1) {
    range.push(1);
    if (left > 2) {
      range.push("ellipsis");
    }
  }

  for (let index = left; index <= right; index += 1) {
    range.push(index);
  }

  if (right < total) {
    if (right < total - 1) {
      range.push("ellipsis");
    }
    range.push(total);
  }

  return range;
}

export function ProjectsPageClient() {
  const { data, isLoading } = useProjects();
  const createProjectMutation = useCreateProject();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeframeFilter, setTimeframeFilter] = useState<(typeof timeframeOptions)[number]["value"]>("all_time");
  const [dueDateFilter, setDueDateFilter] = useState<(typeof dueDateOptions)[number]["value"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<(typeof priorityOptions)[number]["value"]>("all");
  const [activeStatusTab, setActiveStatusTab] = useState<"all" | ProjectStatus>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(parseInt(pageSizeOptions[0].value, 10));

  const handleTimeframeFilterChange = (value: string) => {
    setTimeframeFilter(value as (typeof timeframeOptions)[number]["value"]);
  };

  const handleDueDateFilterChange = (value: string) => {
    setDueDateFilter(value as (typeof dueDateOptions)[number]["value"]);
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value as (typeof priorityOptions)[number]["value"]);
  };

  const form = useForm<CreateProjectFormValues>({
    defaultValues: {
      name: "",
      description: "",
      status: "planned",
      customer: "",
      startDate: "",
      dueDate: ""
    }
  });

  const projects = data ?? [];

  const filteredProjects = useMemo(() => {
    const today = new Date();
    return projects.filter((project) => {
      const haystack = `${project.name} ${project.description ?? ""} ${project.customer ?? ""}`.toLowerCase();
      if (searchTerm.trim().length > 0 && !haystack.includes(searchTerm.trim().toLowerCase())) {
        return false;
      }

      if (activeStatusTab !== "all" && project.status !== activeStatusTab) {
        return false;
      }

      const priority = derivePriority(project);
      if (priorityFilter !== "all" && priority !== priorityFilter) {
        return false;
      }

      if (timeframeFilter !== "all_time") {
        if (project.remainingDays === null) {
          return false;
        }

        if (timeframeFilter === "today" && project.remainingDays !== 0) {
          return false;
        }

        if (timeframeFilter === "this_week" && (project.remainingDays < 0 || project.remainingDays > 7)) {
          return false;
        }

        if (timeframeFilter === "this_month" && (project.remainingDays < 0 || project.remainingDays > 30)) {
          return false;
        }
      }

      if (dueDateFilter !== "all") {
        const dueDate = project.dueDate ? new Date(project.dueDate) : null;
        if (dueDateFilter === "upcoming" && (project.remainingDays === null || project.remainingDays < 0)) {
          return false;
        }

        if (dueDateFilter === "overdue" && !(project.remainingDays !== null && project.remainingDays < 0)) {
          return false;
        }

        if (dueDateFilter === "no_deadline" && dueDate !== null) {
          return false;
        }
      }

      return true;
    });
  }, [projects, searchTerm, activeStatusTab, priorityFilter, timeframeFilter, dueDateFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeStatusTab, priorityFilter, timeframeFilter, dueDateFilter]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filteredProjects.length, page, pageSize]);

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredProjects.slice(start, end);
  }, [filteredProjects, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginationRange = useMemo(() => buildPaginationRange(page, totalPages), [page, totalPages]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    timeframeFilter !== "all_time" ||
    dueDateFilter !== "all" ||
    priorityFilter !== "all" ||
    activeStatusTab !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setTimeframeFilter("all_time");
    setDueDateFilter("all");
    setPriorityFilter("all");
    setActiveStatusTab("all");
  };

  const handleCreateProject = async (values: CreateProjectFormValues) => {
    const payload: ProjectUpdatePayload = {
      name: values.name,
      description: values.description,
      customer: values.customer,
      status: values.status,
      startDate: values.startDate || null,
      dueDate: values.dueDate || null
    };

    try {
      await createProjectMutation.mutateAsync(payload);
      toast({
        title: "Project created",
        description: "New project added successfully."
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Project creation failed."
      });
    }
  };

  const renderSkeletons = () =>
    Array.from({ length: pageSize }).map((_, index) => (
      <Card key={`skeleton-${index}`} className="h-full animate-pulse border border-dashed">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="h-5 w-20 rounded bg-muted" />
          </div>
          <div className="h-4 w-44 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-3 w-28 rounded bg-muted" />
          <div className="grid gap-3">
            <div className="h-3 rounded bg-muted" />
            <div className="h-3 rounded bg-muted" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-12 rounded-lg bg-muted" />
            <div className="h-12 rounded-lg bg-muted" />
          </div>
          <div className="h-9 rounded-lg bg-muted" />
        </CardContent>
      </Card>
    ));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Project Portfolio</h1>
          <p className="text-muted-foreground text-sm">
            Comprehensive view of all active and planned initiatives with focus on deadlines, team members, and priority.
          </p>
        </div>
      </div>

      <TableToolbar
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "Search projects by name, client, or description",
          ariaLabel: "Search projects"
        }}
        filters={
          <>
            <Select value={timeframeFilter} onValueChange={handleTimeframeFilterChange}>
              <SelectTrigger className="w-[140px]" aria-label="Filter by timeframe">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                {timeframeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dueDateFilter} onValueChange={handleDueDateFilterChange}>
              <SelectTrigger className="w-[160px]" aria-label="Filter by due date">
                <SelectValue placeholder="Deadline" />
              </SelectTrigger>
              <SelectContent>
                {dueDateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
              <SelectTrigger className="w-[150px]" aria-label="Filter by priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        reset={{
          onReset: handleResetFilters,
          disabled: !hasActiveFilters,
          label: "Reset filters",
          hideUntilActive: true
        }}
        actions={
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="size-4" />
            New Project
          </Button>
        }
      >
        <div className="flex items-center rounded-lg border bg-muted/40 p-1">
          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className={cn("size-9", viewMode === "grid" ? "" : "text-muted-foreground")}
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className={cn("size-9", viewMode === "list" ? "" : "text-muted-foreground")}
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <List className="size-4" />
          </Button>
        </div>
      </TableToolbar>

      <Tabs value={activeStatusTab} onValueChange={(value) => setActiveStatusTab(value as "all" | ProjectStatus)}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? renderSkeletons() : paginatedProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      ) : (
        <div className="space-y-4">
          {isLoading ? renderSkeletons() : paginatedProjects.map((project) => <ProjectCard key={project.id} project={project} layout="list" />)}
        </div>
      )}

      {!isLoading && filteredProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No projects match the filters</CardTitle>
            <CardDescription>Adjust your filters or create a new project.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="gap-2">
              <Plus className="size-4" />
              Add project
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(parseInt(value, 10))}>
            <SelectTrigger className="w-[130px]" aria-label="Projects per page">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className="cursor-pointer"
                  aria-disabled={page === 1}
                  onClick={(event) => {
                    event.preventDefault();
                    if (page > 1) {
                      setPage((prev) => prev - 1);
                    }
                  }}
                />
              </PaginationItem>
              {paginationRange.map((item, index) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === page}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  className="cursor-pointer"
                  aria-disabled={page === totalPages}
                  onClick={(event) => {
                    event.preventDefault();
                    if (page < totalPages) {
                      setPage((prev) => prev + 1);
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleCreateProject)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project name</Label>
                <Input
                  id="name"
                  placeholder="Migration to OpenShift"
                  {...form.register("name", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Client</Label>
                <Input id="customer" placeholder="Client name" {...form.register("customer")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Summary</Label>
              <Input id="description" placeholder="Initiative description" {...form.register("description")} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="Status projekta">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" type="date" {...form.register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" type="date" {...form.register("dueDate")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ProjectCardProps = {
  project: ProjectSummary;
  layout?: "grid" | "list";
};

function ProjectCard({ project, layout = "grid" }: ProjectCardProps) {
  const priority = derivePriority(project);
  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);
  const statusClass = statusStyles[project.status];
  const tasksSummary = tasksLabel(project);
  const dueStateLabel =
    project.remainingDays === null
      ? "No deadline"
      : project.remainingDays < 0
        ? `${Math.abs(project.remainingDays)} day${Math.abs(project.remainingDays) === 1 ? "" : "s"} overdue`
        : `${project.remainingDays} day${project.remainingDays === 1 ? "" : "s"} left`;

  const containerClass =
    layout === "grid"
      ? "h-full flex flex-col justify-between"
      : "flex flex-col gap-4 rounded-xl border border-border bg-card/80 p-6 shadow-sm transition hover:-translate-y-[3px] hover:shadow-lg";

  const content = (
    <Card className={cn("border-border/80 shadow-sm transition hover:-translate-y-[3px] hover:shadow-lg", containerClass)}>
      <CardHeader className={cn("space-y-5", layout === "list" ? "p-0 pb-0" : undefined)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold leading-tight">{project.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {project.description ?? "No description available."}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`}>Open project</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}/edit`}>Edit details</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusClass}>{project.statusLabel}</Badge>
          <Badge className="border border-primary/20 bg-primary/10 text-primary">
            {project.customer ?? "Internal project"}
          </Badge>
          <Badge className={priorityStyles[priority]}>{priorityLabel} priority</Badge>
          <Badge variant="outline" className="border-dashed">
            {tasksSummary}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={cn("flex flex-1 flex-col gap-6", layout === "list" ? "p-0 pt-4" : undefined)}>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Created Date</p>
            <p className="text-sm font-medium text-foreground">{formatDateLabel(project.startDate)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Deadline</p>
            <p className="text-sm font-medium text-foreground">{formatDateLabel(project.dueDate)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Tasks</p>
            <p className="text-sm font-medium text-foreground">
              {project.completedTasks}/{project.totalTasks} completed
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Status</p>
            <p className="text-sm font-medium text-foreground">{dueStateLabel}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-dashed border-border/80 bg-muted/40 p-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase text-muted-foreground">Owner</span>
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold">
                  {project.owner?.name
                    ?.split(" ")
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase() ?? "NA"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{project.owner?.name ?? "Unassigned"}</p>
                <p className="text-xs text-muted-foreground">{project.owner?.email ?? "No email"}</p>
              </div>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/projects/${project.id}`} className="gap-2">
              View
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return layout === "list" ? <div>{content}</div> : content;
}

