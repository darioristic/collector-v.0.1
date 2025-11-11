"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  CircleSlash,
  MoreHorizontal,
  Plus,
  Trash2
} from "lucide-react";

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
  ProjectTask,
  TaskStatus,
  UpdateTaskPayload
} from "@/src/types/projects";

const statusConfig: Record<
  TaskStatus,
  { label: string; badge: string; accent: string; icon: React.ReactNode }
> = {
  todo: {
    label: "Za uraditi",
    badge: "bg-muted text-muted-foreground",
    accent: "border-dashed",
    icon: <CircleDashed className="size-4" />
  },
  in_progress: {
    label: "U toku",
    badge: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    accent: "border-sky-500/40",
    icon: <CircleDot className="size-4" />
  },
  blocked: {
    label: "Blokirano",
    badge: "bg-red-500/15 text-red-600 dark:text-red-300",
    accent: "border-red-500/40",
    icon: <CircleSlash className="size-4" />
  },
  done: {
    label: "Završeno",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    accent: "border-emerald-500/40",
    icon: <CheckCircle2 className="size-4" />
  }
};

type TaskFormValues = {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  assigneeId: string;
};

type ProjectTasksProps = {
  project: ProjectDetails;
  onCreateTask: (payload: CreateTaskPayload) => Promise<unknown>;
  onUpdateTask: (taskId: string, payload: UpdateTaskPayload) => Promise<unknown>;
  onDeleteTask: (taskId: string) => Promise<unknown>;
  isMutating?: boolean;
};

export function ProjectTasks({
  project,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  isMutating
}: ProjectTasksProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      status: "todo",
      assigneeId: ""
    }
  });

  const statusOptions = useMemo(
    () => (Object.keys(statusConfig) as TaskStatus[]).map((status) => ({ value: status, ...statusConfig[status] })),
    []
  );

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
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-xl font-semibold">Zadaci</CardTitle>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Novi zadatak
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[30%]">Naziv</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rok</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Trenutno nema zadataka. Dodajte prvi zadatak kako biste pratili napredak.
                  </TableCell>
                </TableRow>
              ) : (
                project.tasks.map((task) => {
                  const status = statusConfig[task.status];
                  return (
                    <TableRow key={task.id} className="group">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-foreground">{task.title}</span>
                          {task.description && (
                            <span className="text-muted-foreground text-xs">{task.description}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8 border border-border">
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold">
                              {task.assignee?.name
                                ?.split(" ")
                                .map((part) => part[0])
                                .join("")
                                .toUpperCase() ?? "NA"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">
                              {task.assignee?.name ?? "Nije dodeljeno"}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {task.assignee?.email ?? "-"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
                                status.badge,
                                status.accent
                              )}>
                              {status.icon}
                              {status.label}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {statusOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleStatusChange(task, option.value)}
                                className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-sm">
                        {task.dueDate ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <CalendarDays className="size-4" />
                            {format(parseISO(task.dueDate), "dd MMM yyyy")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Bez roka</span>
                        )}
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
                              onClick={() => handleDelete(task)}>
                              <Trash2 className="mr-2 size-4" />
                              Obriši
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberi člana tima" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nije dodeljeno</SelectItem>
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

