"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  CircleDashed,
  CircleDot,
  CircleSlash,
  MoreHorizontal,
  Trash2
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
  ProjectDetails,
  ProjectOwner,
  ProjectTask,
  TaskStatus,
  UpdateTaskPayload
} from "@/src/types/projects";

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
  onUpdateTask: (taskId: string, payload: UpdateTaskPayload) => Promise<unknown>;
  onDeleteTask: (taskId: string) => Promise<unknown>;
};

type TaskStatusOption = {
  value: TaskStatus;
  label: string;
  icon: ReactNode;
};

export function ProjectTasks({ project, onUpdateTask, onDeleteTask }: ProjectTasksProps) {
  const { toast } = useToast();

  const statusOptions = useMemo<TaskStatusOption[]>(
    () =>
      STATUS_ORDER.map((status) => ({
        value: status,
        label: statusConfig[status].statusLabel,
        icon: statusConfig[status].icon
      })),
    []
  );

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
      <CardContent className="space-y-4">
        <TaskListView
          tasks={project.tasks}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          statusOptions={statusOptions}
        />
      </CardContent>
    </Card>
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
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/85 shadow-sm backdrop-blur">
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
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                Trenutno nema zadataka.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
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


