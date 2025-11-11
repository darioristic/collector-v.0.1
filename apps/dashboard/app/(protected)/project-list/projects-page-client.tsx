"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Plus, TrendingUp } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useCreateProject, useProjects } from "@/src/hooks/useProjects";
import type { ProjectStatus, ProjectUpdatePayload } from "@/src/types/projects";

const statusColors: Record<ProjectStatus, string> = {
  planned: "bg-blue-500/10 text-blue-600 border border-blue-500/30",
  active: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  on_hold: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  completed: "bg-purple-500/10 text-purple-600 border border-purple-500/30"
};

type CreateProjectFormValues = {
  name: string;
  description: string;
  status: ProjectStatus;
  customer: string;
  startDate: string;
  dueDate: string;
};

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "planned", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" }
];

export function ProjectsPageClient() {
  const { data, isLoading } = useProjects();
  const createProjectMutation = useCreateProject();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        title: "Projekat kreiran",
        description: "Novi projekat je uspešno dodat."
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: error instanceof Error ? error.message : "Kreiranje projekta nije uspelo."
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Centralizovan pregled svih projekata i njihovog napretka.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse border-dashed">
              <CardHeader className="space-y-2">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-28 rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-2 w-full rounded bg-muted" />
                <div className="flex justify-between">
                  <div className="h-8 w-24 rounded bg-muted" />
                  <div className="h-8 w-8 rounded-full bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {data?.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id}>
              <Card className="group h-full transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg font-semibold leading-tight">{project.name}</CardTitle>
                    <Badge className={statusColors[project.status]}>{project.statusLabel}</Badge>
                  </div>
                  {project.customer && (
                    <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                      {project.customer}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-3 py-2">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold">
                        {project.owner?.name
                          ?.split(" ")
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase() ?? "NA"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {project.owner?.name ?? "Nije dodeljeno"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {project.owner?.email ?? "Owner pending"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="size-4 text-emerald-500" />
                      <span>Zadaci {project.completedTasks}/{project.totalTasks}</span>
                    </div>
                    <span>
                      {project.remainingDays != null
                        ? `${project.remainingDays} days left`
                        : "No deadline"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleCreateProject)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" placeholder="Migration to OpenShift" {...form.register("name", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Input id="customer" placeholder="Client name" {...form.register("customer")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Summary</Label>
              <Input id="description" placeholder="Short description" {...form.register("description")} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={field.value}
                      onChange={field.onChange}>
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...form.register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
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
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

