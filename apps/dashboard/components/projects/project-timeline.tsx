"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Clock3,
  Hourglass,
  MoreHorizontal,
  Plus,
  Trash2
} from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type {
  CreateTimelinePayload,
  ProjectTimelineEvent,
  TimelineStatus,
  UpdateTimelinePayload
} from "@/src/types/projects";

const statusLookup: Record<TimelineStatus, { label: string; tone: string; icon: React.ReactNode }> = {
  completed: {
    label: "Završeno",
    tone: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    icon: <CheckCircle2 className="size-4" />
  },
  in_progress: {
    label: "U toku",
    tone: "bg-sky-500/10 text-sky-500 border-sky-500/30",
    icon: <Clock3 className="size-4" />
  },
  upcoming: {
    label: "U pripremi",
    tone: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    icon: <Hourglass className="size-4" />
  }
};

type TimelineFormValues = {
  title: string;
  description: string;
  status: TimelineStatus;
  date: string;
};

type ProjectTimelineProps = {
  events: ProjectTimelineEvent[];
  onCreate: (payload: CreateTimelinePayload) => Promise<unknown>;
  onUpdate: (id: string, payload: UpdateTimelinePayload) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  isMutating?: boolean;
};

export function ProjectTimeline({
  events,
  onCreate,
  onUpdate,
  onDelete,
  isMutating
}: ProjectTimelineProps) {
  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }),
    [events]
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ProjectTimelineEvent | null>(null);
  const { toast } = useToast();

  const form = useForm<TimelineFormValues>({
    defaultValues: {
      title: "",
      description: "",
      status: "upcoming",
      date: ""
    }
  });

  const openCreateModal = () => {
    setEditingEvent(null);
    form.reset({
      title: "",
      description: "",
      status: "upcoming",
      date: ""
    });
    setIsDialogOpen(true);
  };

  const openEditModal = (event: ProjectTimelineEvent) => {
    setEditingEvent(event);
    form.reset({
      title: event.title,
      description: event.description ?? "",
      status: event.status,
      date: event.date ? event.date.slice(0, 10) : ""
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: TimelineFormValues) => {
    const createPayload: CreateTimelinePayload = {
      title: values.title,
      description: values.description ? values.description : undefined,
      status: values.status,
      date: values.date ? values.date : undefined
    };
    const updatePayload: UpdateTimelinePayload = { ...createPayload };

    try {
      if (editingEvent) {
        await onUpdate(editingEvent.id, updatePayload);
        toast({
          title: "Milestone ažuriran",
          description: "Uspešno ste ažurirali stavku vremenske linije."
        });
      } else {
        await onCreate(createPayload);
        toast({
          title: "Milestone dodat",
          description: "Nova stavka je dodata na vremensku liniju."
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description:
          error instanceof Error ? error.message : "Došlo je do greške pri čuvanju vremenske linije."
      });
    }
  };

  const handleDelete = async (event: ProjectTimelineEvent) => {
    try {
      await onDelete(event.id);
      toast({
        title: "Milestone uklonjen",
        description: `"${event.title}" je uklonjen sa liste.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description:
          error instanceof Error ? error.message : "Došlo je do greške pri brisanju stavke."
      });
    }
  };

  return (
    <Card className="border-none bg-card/80 shadow-lg shadow-primary/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-semibold">Vremenska linija</CardTitle>
          <p className="text-muted-foreground text-sm">
            Vizuelni prikaz ključnih momenata projekta sa statusima u realnom vremenu.
          </p>
        </div>
        <Button size="sm" onClick={openCreateModal}>
          <Plus className="mr-2 size-4" />
          Dodaj milestone
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        {sortedEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Još uvek nema definisanih koraka. Dodajte prvi milestone kako biste pratili napredak.
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex min-w-full gap-4 pb-4">
              {sortedEvents.map((event, index) => {
                const status = statusLookup[event.status];
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative flex min-w-[280px] flex-col rounded-2xl border bg-card/80 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                          status.tone
                        )}>
                        {status.icon}
                        {status.label}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 rounded-full">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(event)}>Izmeni</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(event)}>
                            <Trash2 className="mr-2 size-4" />
                            Ukloni
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <h3 className="font-semibold leading-tight">{event.title}</h3>
                      {event.description && (
                        <p className="text-muted-foreground text-sm leading-relaxed">{event.description}</p>
                      )}
                    </div>
                    <div className="mt-4 text-sm font-medium text-foreground">
                      {event.date ? format(parseISO(event.date), "dd MMM yyyy") : "Datum nije definisan"}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Ažuriraj milestone" : "Dodaj novi milestone"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="title">Naziv</Label>
              <Input id="title" placeholder="Naziv događaja" {...form.register("title", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Input
                id="description"
                placeholder="Opcionalan opis"
                {...form.register("description")}
              />
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
                        <SelectItem value="completed">Završeno</SelectItem>
                        <SelectItem value="in_progress">U toku</SelectItem>
                        <SelectItem value="upcoming">U pripremi</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <Input id="date" type="date" {...form.register("date")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={isMutating}>
                {editingEvent ? "Sačuvaj izmene" : "Dodaj milestone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

