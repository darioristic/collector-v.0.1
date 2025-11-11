"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  CircleSlash,
  LayoutGrid,
  ListTree,
  MoreHorizontal,
  Plus,
  Trash2
} from "lucide-react";

import { TableToolbar } from "@/components/table-toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type {
  CreateTaskPayload,
  ProjectDetails,
  ProjectOwner,
  ProjectTask,
  TaskStatus,
  UpdateTaskPayload
} from "@/src/types/projects";

const UNASSIGNED_VALUE = "__unassigned__";

type ViewMode = "board" | "list";

const VIEW_OPTIONS: Array<{ value: ViewMode; label: string; icon: ReactNode }> = [
  { value: "board", label: "Board view", icon: <LayoutGrid className="size-4" /> },
  { value: "list", label: "List view", icon: <ListTree className="size-4" /> }
];

const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

const statusConfig: Record<
  TaskStatus,
  {
    statusLabel: string;
    boardTitle: string;
    icon: ReactNode;
    badgeClass: string;
    accentClass: string;
    boardHeaderClass: string;
    boardBadgeClass: string;
    listHeaderClass: string;
  }
> = {
  todo: {
    statusLabel: "Za uraditi",
    boardTitle: "Backlog",
    icon: <CircleDashed className="size-4" />,
    badgeClass: "bg-muted text-muted-foreground",
    accentClass: "border-dashed border-muted-foreground/40",
    boardHeaderClass:
      "border-b border-amber-200/80 bg-amber-50/90 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200",
    boardBadgeClass:
      "border border-amber-200 bg-amber-500/15 text-amber-700 dark:border-amber-500/40 dark:text-amber-200",
    listHeaderClass: "bg-amber-500/10 text-amber-700 dark:text-amber-200"
  },
  in_progress: {
    statusLabel: "U toku",
    boardTitle: "In progress",
    icon: <CircleDot className="size-4" />,
    badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    accentClass: "border-sky-500/40",
    boardHeaderClass:
      "border-b border-sky-200/80 bg-sky-50/90 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200",
    boardBadgeClass:
      "border border-sky-200 bg-sky-500/15 text-sky-700 dark:border-sky-500/40 dark:text-sky-200",
    listHeaderClass: "bg-sky-500/10 text-sky-700 dark:text-sky-200"
  },
  blocked: {
    statusLabel: "Blokirano",
    boardTitle: "Blocked",
    icon: <CircleSlash className="size-4" />,
    badgeClass: "bg-red-500/15 text-red-600 dark:text-red-300",
    accentClass: "border-red-500/40",
    boardHeaderClass:
      "border-b border-red-200/80 bg-red-50/90 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200",
    boardBadgeClass:
      "border border-red-200 bg-red-500/15 text-red-700 dark:border-red-500/40 dark:text-red-200",
    listHeaderClass: "bg-red-500/10 text-red-700 dark:text-red-200"
  },
  done: {
    statusLabel: "Završeno",
    boardTitle: "Completed",
    icon: <CheckCircle2 className="size-4" />,
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    accentClass: "border-emerald-500/40",
    boardHeaderClass:
      "border-b border-emerald-200/80 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200",
    boardBadgeClass:
      "border border-emerald-200 bg-emerald-500/15 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-200",
    listHeaderClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
  }
};

type TaskFormValues = {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  assigneeId: string | null;
};

type ProjectTasksProps = {
  project: ProjectDetails;
  onCreateTask: (payload: CreateTaskPayload) => Promise<unknown>;
  onUpdateTask: (taskId: string, payload: UpdateTaskPayload) => Promise<unknown>;
  onDeleteTask: (taskId: string) => Promise<unknown>;
  isMutating?: boolean;
};

type TaskStatusOption = {
  value: TaskStatus;
  label: string;
  icon: ReactNode;
};

export function ProjectTasks({
  project,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  isMutating
}: ProjectTasksProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string | "all">("all");

  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      status: "todo",
      assigneeId: null
    }
  });

  const statusOptions = useMemo<TaskStatusOption[]>(
    () =>
      STATUS_ORDER.map((status) => ({
        value: status,
        label: statusConfig[status].statusLabel,
        icon: statusConfig[status].icon
      })),
    []
  );

  const teamOptions = useMemo(
    () =>
      project.team
        .map((member) => ({
          value: member.userId,
          label: member.name ?? member.email ?? "Nepoznato"
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [project.team]
  );

  const filteredTasks = useMemo(() => {
    return project.tasks.filter((task) => {
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description ?? "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesAssignee =
        assigneeFilter === "all" ||
        task.assignee?.id === assigneeFilter ||
        task.assignee?.email === assigneeFilter ||
        task.assignee?.name === assigneeFilter;

      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [project.tasks, searchTerm, statusFilter, assigneeFilter]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 || statusFilter !== "all" || assigneeFilter !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setAssigneeFilter("all");
  };

  const handleCreate = async (values: TaskFormValues) => {
    const payload: CreateTaskPayload = {
      title: values.title,
      description: values.description,
      dueDate: values.dueDate,
      status: values.status,
      assigneeId: values.assigneeId || null
    };

    try {
      await onCreateTask(payload);
      toast({
        title: "Zadatak dodat",
        description: "Zadatak je uspešno dodat u projekat."
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: error instanceof Error ? error.message : "Dodavanje zadatka nije uspelo."
      });
    }
  };

  const handleStatusChange = async (task: ProjectTask, status: TaskStatus) => {
    if (task.status === status) return;

    try {
      await onUpdateTask(task.id, { status });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: error instanceof Error ? error.message : "Ažuriranje statusa nije uspelo."
      });
    }
  };

  const handleDelete = async (task: ProjectTask) => {
    try {
      await onDeleteTask(task.id);
      toast({
        title: "Zadatak obrisan",
        description: `"${task.title}" je uklonjen iz liste.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: error instanceof Error ? error.message : "Brisanje zadatka nije uspelo."
      });
    }
  };

  return (
    <Card className="border-none bg-card/80 shadow-lg shadow-primary/5">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold lg:text-2xl">Project tasks</CardTitle>
          <p className="text-muted-foreground text-sm">
            Pratite tok rada tima i upravljajte zadacima kroz kanban ili tabelarni prikaz.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            <span>
              {project.quickStats.completedTasks}/{project.quickStats.totalTasks} completed
            </span>
          </div>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Novi zadatak
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <TableToolbar
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: "Pretraži zadatke po nazivu, opisu ili assignee imenu",
            ariaLabel: "Search project tasks"
          }}
          filters={
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "all")}>
                <SelectTrigger className="h-10 w-[180px]" aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi statusi</SelectItem>
                  {STATUS_ORDER.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status].statusLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={(value) => setAssigneeFilter(value)}>
                <SelectTrigger className="h-10 w-[200px]" aria-label="Filter by assignee">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi članovi</SelectItem>
                  {teamOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          reset={{
            onReset: handleResetFilters,
            disabled: !hasActiveFilters,
            hideUntilActive: true
          }}
          actions={
            <div className="inline-flex rounded-full border border-border/70 bg-background/70 p-1 shadow-sm">
              {VIEW_OPTIONS.map((option) => {
                const isActive = viewMode === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                      !isActive && "text-muted-foreground"
                    )}
                    onClick={() => setViewMode(option.value)}
                  >
                    {option.icon}
                    {option.label}
                  </Button>
                );
              })}
            </div>
          }
        />

        {viewMode === "board" ? (
          <TaskBoardView
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            statusOptions={statusOptions}
          />
        ) : (
          <TaskListView
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            statusOptions={statusOptions}
          />
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj novi zadatak</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
            <div className="space-y-2">
              <Label htmlFor="title">Naziv</Label>
              <Input id="title" placeholder="Naziv zadatka" {...form.register("title", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Input id="description" placeholder="Kratak opis" {...form.register("description")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Rok</Label>
                <Input id="dueDate" type="date" {...form.register("dueDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee</Label>
              <Controller
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? UNASSIGNED_VALUE}
                    onValueChange={(value) => field.onChange(value === UNASSIGNED_VALUE ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberi člana tima" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>Nije dodeljeno</SelectItem>
                      {project.team.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.name ?? member.email ?? member.userId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={isMutating}>
                Sačuvaj zadatak
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

type TaskBoardViewProps = {
  tasks: ProjectTask[];
  onStatusChange: (task: ProjectTask, status: TaskStatus) => void;
  onDelete: (task: ProjectTask) => void;
  statusOptions: TaskStatusOption[];
};

function TaskBoardView({ tasks, onStatusChange, onDelete, statusOptions }: TaskBoardViewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
      {STATUS_ORDER.map((status) => {
        const config = statusConfig[status];
        const columnTasks = tasks.filter((task) => task.status === status);

        return (
          <div
            key={status}
            className="flex max-h-[680px] flex-col rounded-2xl border border-border/70 bg-card/85 shadow-sm backdrop-blur"
          >
            <div className={cn("flex items-center justify-between px-4 py-3", config.boardHeaderClass)}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm uppercase tracking-wide">{config.boardTitle}</span>
                <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold">
                  {columnTasks.length}
                </span>
              </div>
              <Badge variant="outline" className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", config.boardBadgeClass)}>
                {config.statusLabel}
              </Badge>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              {columnTasks.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/70 px-4 py-10 text-center text-sm text-muted-foreground">
                  Nema zadataka u ovoj koloni.
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskBoardCard
                    key={task.id}
                    task={task}
                    statusOptions={statusOptions}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type TaskBoardCardProps = {
  task: ProjectTask;
  statusOptions: TaskStatusOption[];
  onStatusChange: (task: ProjectTask, status: TaskStatus) => void;
  onDelete: (task: ProjectTask) => void;
};

function TaskBoardCard({ task, statusOptions, onStatusChange, onDelete }: TaskBoardCardProps) {
  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
          {task.description ? (
            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">{task.description}</p>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault();
                onDelete(task);
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Obriši
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TaskStatusDropdown task={task} statusOptions={statusOptions} onChange={onStatusChange} />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-3.5" />
          {formatDueDate(task.dueDate)}
        </div>
        <TaskAssignee assignee={task.assignee} compact />
      </div>
    </div>
  );
}

type TaskListViewProps = {
  tasks: ProjectTask[];
  onStatusChange: (task: ProjectTask, status: TaskStatus) => void;
  onDelete: (task: ProjectTask) => void;
  statusOptions: TaskStatusOption[];
};

function TaskListView({ tasks, onStatusChange, onDelete, statusOptions }: TaskListViewProps) {
  return (
    <div className="space-y-6">
      {STATUS_ORDER.map((status) => {
        const config = statusConfig[status];
        const rows = tasks.filter((task) => task.status === status);

        return (
          <div
            key={status}
            className="overflow-hidden rounded-2xl border border-border/60 bg-card/85 shadow-sm backdrop-blur"
          >
            <div className={cn("flex items-center justify-between px-4 py-3", config.listHeaderClass)}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm uppercase tracking-wide">{config.boardTitle}</span>
                <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold">
                  {rows.length}
                </span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[32%]">Zadatak</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rok</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Nema zadataka u ovoj sekciji.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((task) => (
                    <TableRow key={task.id} className="group">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm text-foreground">{task.title}</div>
                          {task.description ? (
                            <p className="text-muted-foreground text-xs">{task.description}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TaskAssignee assignee={task.assignee} />
                      </TableCell>
                      <TableCell>
                        <TaskStatusDropdown task={task} statusOptions={statusOptions} onChange={onStatusChange} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="size-4" />
                          {formatDueDate(task.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 rounded-full">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(event) => {
                                event.preventDefault();
                                onDelete(task);
                              }}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Obriši
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}

type TaskStatusDropdownProps = {
  task: ProjectTask;
  statusOptions: TaskStatusOption[];
  onChange: (task: ProjectTask, status: TaskStatus) => void;
};

function TaskStatusDropdown({ task, statusOptions, onChange }: TaskStatusDropdownProps) {
  const config = statusConfig[task.status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
            config.badgeClass,
            config.accentClass
          )}
        >
          {config.icon}
          {config.statusLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={(event) => {
              event.preventDefault();
              onChange(task, option.value);
            }}
            className="flex items-center gap-2 text-sm"
          >
            {option.icon}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type TaskAssigneeProps = {
  assignee: ProjectOwner | null;
  compact?: boolean;
};

function TaskAssignee({ assignee, compact = false }: TaskAssigneeProps) {
  if (!assignee?.name && !assignee?.email) {
    return <span className="text-muted-foreground text-xs">Nije dodeljeno</span>;
  }

  const initials = getInitials(assignee.name ?? assignee.email ?? "");

  return (
    <div className={cn("flex items-center gap-2", compact ? "text-xs" : "text-sm")}>
      <Avatar className={compact ? "h-7 w-7 border border-border" : "h-8 w-8 border border-border"}>
        <AvatarFallback className="bg-primary/10 text-xs font-semibold uppercase">
          {initials}
        </AvatarFallback>
      </Avatar>
      {!compact ? (
        <div className="leading-tight">
          <div className="font-medium">{assignee.name ?? assignee.email}</div>
          {assignee.email ? (
            <div className="text-muted-foreground text-xs">{assignee.email}</div>
          ) : null}
        </div>
      ) : (
        <span className="font-medium text-muted-foreground">
          {assignee.name ?? assignee.email}
        </span>
      )}
    </div>
  );
}

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return "Bez roka";
  try {
    return format(parseISO(dueDate), "dd MMM yyyy");
  } catch {
    return "Bez roka";
  }
}


