"use client";

import { Fragment, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useAddTeamMember,
  useCreateBudgetCategory,
  useCreateProjectTask,
  useCreateTimelineEvent,
  useDeleteBudgetCategory,
  useDeleteProject,
  useDeleteProjectTask,
  useDeleteTimelineEvent,
  useProjectDetails,
  useRemoveTeamMember,
  useUpdateBudgetCategory,
  useUpdateProject,
  useUpdateProjectBudget,
  useUpdateProjectTask,
  useUpdateTimelineEvent
} from "@/src/hooks/useProjects";
import type { ProjectStatus, ProjectUpdatePayload } from "@/src/types/projects";
import { ProjectBudget } from "./project-budget";
import { ProjectOverview } from "./project-overview";
import { ProjectTasks } from "./project-tasks";
import { ProjectTeam } from "./project-team";
import { ProjectTimeline } from "./project-timeline";

type ProjectEditFormValues = {
  name: string;
  description: string;
  status: ProjectStatus;
  customer: string;
  ownerId: string;
  startDate: string;
  dueDate: string;
};

type ProjectDetailsViewProps = {
  projectId: string;
};

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "planned", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" }
];

export function ProjectDetailsView({ projectId }: ProjectDetailsViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: project } = useProjectDetails(projectId, { suspense: true });

  const updateProjectMutation = useUpdateProject(projectId);
  const deleteProjectMutation = useDeleteProject(projectId, {
    onDeleted: () => router.push("/project-list")
  });
  const createTaskMutation = useCreateProjectTask(projectId);
  const updateTaskMutation = useUpdateProjectTask(projectId);
  const deleteTaskMutation = useDeleteProjectTask(projectId);
  const createTimelineMutation = useCreateTimelineEvent(projectId);
  const updateTimelineMutation = useUpdateTimelineEvent(projectId);
  const deleteTimelineMutation = useDeleteTimelineEvent(projectId);
  const addTeamMemberMutation = useAddTeamMember(projectId);
  const removeTeamMemberMutation = useRemoveTeamMember(projectId);
  const updateBudgetMutation = useUpdateProjectBudget(projectId);
  const createBudgetCategoryMutation = useCreateBudgetCategory(projectId);
  const updateBudgetCategoryMutation = useUpdateBudgetCategory(projectId);
  const deleteBudgetCategoryMutation = useDeleteBudgetCategory(projectId);

  const editForm = useForm<ProjectEditFormValues>({
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      customer: project.customer ?? "",
      ownerId: project.owner?.id ?? "",
      startDate: project.startDate ? project.startDate.slice(0, 10) : "",
      dueDate: project.dueDate ? project.dueDate.slice(0, 10) : ""
    }
  });

  const statusTone = useMemo(() => {
    switch (project.status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/40";
      case "completed":
        return "bg-purple-500/10 text-purple-600 border border-purple-500/40";
      case "on_hold":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/40";
      default:
        return "bg-blue-500/10 text-blue-600 border border-blue-500/40";
    }
  }, [project.status]);

  const submitProjectUpdate = async (values: ProjectEditFormValues) => {
    const payload: ProjectUpdatePayload = {
      name: values.name,
      description: values.description,
      status: values.status,
      customer: values.customer,
      ownerId: values.ownerId || null,
      startDate: values.startDate || null,
      dueDate: values.dueDate || null
    };

    try {
      await updateProjectMutation.mutateAsync(payload);
      toast({
        title: "Projekat ažuriran",
        description: "Promene na projektu su uspešno sačuvane."
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: error instanceof Error ? error.message : "Ažuriranje projekta nije uspelo."
      });
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProjectMutation.mutateAsync();
      toast({
        title: "Projekat obrisan",
        description: "Projekat je trajno uklonjen."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: error instanceof Error ? error.message : "Brisanje projekta nije uspelo."
      });
    }
  };

  const tabs = [
    { value: "overview", label: "Pregled" },
    { value: "timeline", label: "Vremenska linija" },
    { value: "tasks", label: "Zadaci" },
    { value: "team", label: "Tim" },
    { value: "budget", label: "Budžet" }
  ];

  return (
    <Fragment>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="sticky top-[72px] z-30 mb-6 space-y-4 rounded-2xl border bg-card/90 p-5 shadow-lg shadow-primary/10 backdrop-blur">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/project-list">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-foreground/80">{project.name}</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", statusTone)}>
                {project.statusLabel}
              </Badge>
              {project.owner?.name && (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                  Owner • {project.owner.name}
                </Badge>
              )}
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                Due • {project.dueDate ? format(parseISO(project.dueDate), "dd MMM yyyy") : "N/A"}
              </Badge>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">
              {project.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              Potpuni pregled projekta, zadataka, tima i finansija na jednoj stranici.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/project-list">Nazad na listu</Link>
            </Button>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              Izmeni
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              Obriši
            </Button>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 rounded-full bg-muted/60 p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-full text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      <div className="space-y-6">
        <Tabs value={activeTab}>
          <TabsContent value="overview" className="mt-0 space-y-6">
            <ProjectOverview project={project} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <ProjectTimeline
              events={project.timeline}
              onCreate={(payload) => createTimelineMutation.mutateAsync(payload)}
              onUpdate={(id, payload) => updateTimelineMutation.mutateAsync({ eventId: id, input: payload })}
              onDelete={(id) => deleteTimelineMutation.mutateAsync(id)}
              isMutating={
                createTimelineMutation.isPending ||
                updateTimelineMutation.isPending ||
                deleteTimelineMutation.isPending
              }
            />
          </TabsContent>
          <TabsContent value="tasks" className="mt-0">
            <ProjectTasks
              project={project}
              onCreateTask={(payload) => createTaskMutation.mutateAsync(payload)}
              onUpdateTask={(taskId, payload) => updateTaskMutation.mutateAsync({ taskId, input: payload })}
              onDeleteTask={(taskId) => deleteTaskMutation.mutateAsync(taskId)}
              isMutating={
                createTaskMutation.isPending ||
                updateTaskMutation.isPending ||
                deleteTaskMutation.isPending
              }
            />
          </TabsContent>
          <TabsContent value="team" className="mt-0">
            <ProjectTeam
              team={project.team}
              onAddMember={(payload) => addTeamMemberMutation.mutateAsync(payload)}
              onRemoveMember={(userId) => removeTeamMemberMutation.mutateAsync(userId)}
              isMutating={addTeamMemberMutation.isPending || removeTeamMemberMutation.isPending}
            />
          </TabsContent>
          <TabsContent value="budget" className="mt-0">
            <ProjectBudget
              budget={project.budget}
              onUpdateBudget={(payload) => updateBudgetMutation.mutateAsync(payload)}
              onCreateCategory={(payload) => createBudgetCategoryMutation.mutateAsync(payload)}
              onUpdateCategory={(categoryId, payload) =>
                updateBudgetCategoryMutation.mutateAsync({ categoryId, input: payload })
              }
              onDeleteCategory={(categoryId) => deleteBudgetCategoryMutation.mutateAsync(categoryId)}
              isMutating={
                updateBudgetMutation.isPending ||
                createBudgetCategoryMutation.isPending ||
                updateBudgetCategoryMutation.isPending ||
                deleteBudgetCategoryMutation.isPending
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Izmeni projekat</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={editForm.handleSubmit(submitProjectUpdate)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Naziv</Label>
                <Input id="name" {...editForm.register("name", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Klijent</Label>
                <Input id="customer" {...editForm.register("customer")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Input id="description" {...editForm.register("description")} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background"
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
                <Label htmlFor="startDate">Početak</Label>
                <Input id="startDate" type="date" {...editForm.register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Rok</Label>
                <Input id="dueDate" type="date" {...editForm.register("dueDate")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={updateProjectMutation.isPending}>
                Sačuvaj promene
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obrisati projekat?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova radnja je trajna i ukloniće sve povezane podatke o projektu, zadacima, vremenskoj liniji i budžetu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteProject}
              disabled={deleteProjectMutation.isPending}>
              Obriši projekat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  );
}

