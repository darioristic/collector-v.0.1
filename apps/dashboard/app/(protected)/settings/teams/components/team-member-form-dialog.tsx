"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEAM_MEMBER_STATUSES, type TeamMember, type TeamMemberStatus } from "../api";
import { teamMemberFormSchema, type CreateTeamMemberPayload } from "@/lib/validations/settings/team-members";

type TeamMemberFormValues = CreateTeamMemberPayload;

interface TeamMemberFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  member?: TeamMember | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TeamMemberFormValues) => Promise<void>;
  isSubmitting: boolean;
}

const DEFAULT_VALUES: TeamMemberFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  status: "invited",
  avatarUrl: null
};

const statusLabels: Record<TeamMemberStatus, string> = {
  online: "Online",
  offline: "Offline",
  idle: "Idle",
  invited: "Invited"
};

export default function TeamMemberFormDialog({
  open,
  mode,
  member,
  onOpenChange,
  onSubmit,
  isSubmitting
}: TeamMemberFormDialogProps) {
  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: DEFAULT_VALUES
  });

  React.useEffect(() => {
    if (mode === "edit" && member) {
      form.reset({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        role: member.role,
        status: member.status,
        avatarUrl: member.avatarUrl ?? null
      });
      return;
    }

    form.reset(DEFAULT_VALUES);
  }, [form, member, mode]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      avatarUrl: values.avatarUrl ?? null
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add member" : "Manage member"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Dodajte novog člana tima i dodelite mu ulogu unutar organizacije."
              : "Izmenite podatke o članu tima i ažurirajte njegov status."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ime</FormLabel>
                    <FormControl>
                      <Input placeholder="Unesite ime" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prezime</FormLabel>
                    <FormControl>
                      <Input placeholder="Unesite prezime" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="ime.prezime@example.com"
                      disabled={isSubmitting || mode === "edit"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uloga</FormLabel>
                  <FormControl>
                    <Input placeholder="npr. Admin" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select disabled={isSubmitting} value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TEAM_MEMBER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL (opciono)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/avatar.png"
                      disabled={isSubmitting}
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Čuvanje..." : mode === "create" ? "Dodaj člana" : "Sačuvaj izmene"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

