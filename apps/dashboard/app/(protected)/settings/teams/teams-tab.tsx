"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { createTeamMember, deleteTeamMember, fetchTeamMembers, type TeamMember, type TeamMemberStatus, updateTeamMember } from "./api";
import { listTeamMembersQuerySchema, type ListTeamMembersQuery } from "@/lib/validations/settings/team-members";
import { Search, SlidersHorizontal, Trash2 } from "lucide-react";
import TeamMemberFormDialog from "./components/team-member-form-dialog";

type SortOption = "recent" | "oldest" | "name";

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "recent", label: "Date added (Newest)" },
  { value: "oldest", label: "Date added (Oldest)" },
  { value: "name", label: "Name (A-Z)" }
];

const STATUS_LABELS: Record<TeamMemberStatus, { label: string; dotClass: string }> = {
  online: { label: "Online", dotClass: "bg-emerald-500" },
  offline: { label: "Offline", dotClass: "bg-rose-500" },
  idle: { label: "Idle", dotClass: "bg-amber-400" },
  invited: { label: "Invited", dotClass: "bg-slate-400" }
};

const statusFilterOptions: Array<{ value: "all" | TeamMemberStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "idle", label: "Idle" },
  { value: "offline", label: "Offline" }
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const getInitials = (firstName: string, lastName: string) =>
  `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "TM";

export default function TeamsTab(): JSX.Element {
  const [searchValue, setSearchValue] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | TeamMemberStatus>("all");
  const [sortOption, setSortOption] = React.useState<SortOption>("recent");
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [memberToDelete, setMemberToDelete] = React.useState<TeamMember | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchValue]);

  const queryState = React.useMemo(() => {
    const base: ListTeamMembersQuery = {};
    if (debouncedSearch) {
      base.search = debouncedSearch;
    }
    if (statusFilter !== "all") {
      base.status = statusFilter;
    }
    return listTeamMembersQuerySchema.parse(base);
  }, [debouncedSearch, statusFilter]);

  const {
    data: teamMembers = [],
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery({
    queryKey: ["team-members", queryState],
    queryFn: () => fetchTeamMembers(queryState),
    staleTime: 30_000
  });

  React.useEffect(() => {
    setSelectedIds((prev) => {
      if (teamMembers.length === 0 && prev.size === 0) {
        return prev;
      }
      const availableIds = new Set(teamMembers.map((member) => member.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (availableIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [teamMembers]);

  const sortedMembers = React.useMemo(() => {
    const items = [...teamMembers];
    if (sortOption === "recent") {
      return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    if (sortOption === "oldest") {
      return items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    return items.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [teamMembers, sortOption]);

  const createMutation = useMutation({
    mutationFn: createTeamMember,
    onSuccess: (member) => {
      toast({
        title: "Član dodat",
        description: `${member.fullName} je uspešno dodat u tim.`
      });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setIsFormOpen(false);
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Greška pri dodavanju",
        description: mutationError.message,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (values: Parameters<typeof createTeamMember>[0]) => updateTeamMember(selectedMember!.id, values),
    onSuccess: (member) => {
      toast({
        title: "Član ažuriran",
        description: `${member.fullName} je uspešno izmenjen.`
      });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setIsFormOpen(false);
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Greška pri izmeni",
        description: mutationError.message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: (_, id) => {
      toast({
        title: "Član uklonjen",
        description: "Član tima je uspešno obrisan."
      });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setMemberToDelete(null);
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Greška pri brisanju",
        description: mutationError.message,
        variant: "destructive"
      });
    }
  });

  const isAllSelected = sortedMembers.length > 0 && selectedIds.size === sortedMembers.length;

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(sortedMembers.map((member) => member.id)));
  };

  const toggleMemberSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedMember(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setFormMode("edit");
    setSelectedMember(member);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (values: Parameters<typeof createTeamMember>[0]) => {
    if (formMode === "create") {
      await createMutation.mutateAsync(values);
      return;
    }

    if (!selectedMember) {
      return;
    }

    await updateMutation.mutateAsync(values);
  };

  const handleDeleteMember = (member: TeamMember) => {
    setMemberToDelete(member);
  };

  const handleConfirmDelete = () => {
    if (!memberToDelete) {
      return;
    }
    deleteMutation.mutate(memberToDelete.id);
  };

  const renderContent = () => {
    if (isLoading) {
      return <TeamMembersSkeleton />;
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center">
          <Badge variant="destructive">Greška</Badge>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Preuzimanje članova tima nije uspelo."}
          </p>
        </div>
      );
    }

    if (sortedMembers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted p-10 text-center">
          <p className="text-base font-medium text-foreground">Nema pronađenih članova</p>
          <p className="text-sm text-muted-foreground">
            Podesite kriterijume ili dodajte novog člana kako biste popunili ovu listu.
          </p>
          <Button onClick={handleOpenCreate}>Dodaj člana</Button>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">
                <Checkbox
                  aria-label="Selektuj sve"
                  checked={isAllSelected}
                  onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                />
              </TableHead>
              <TableHead>Team member</TableHead>
              <TableHead>Date added</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMembers.map((member) => {
              const isSelected = selectedIds.has(member.id);
              return (
                <TableRow key={member.id} className="border-border">
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      aria-label={`Selektuj ${member.fullName}`}
                      onCheckedChange={(checked) => toggleMemberSelection(member.id, Boolean(checked))}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-full">
                        {member.avatarUrl ? (
                          <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                        ) : (
                          <AvatarFallback className="rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {getInitials(member.firstName, member.lastName)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-foreground">{member.fullName}</span>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{dateFormatter.format(member.createdAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={member.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.role}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-muted-foreground"
                        onClick={() => handleDeleteMember(member)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full px-4"
                        onClick={() => handleOpenEdit(member)}>
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Teams</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="border-none bg-transparent shadow-none">
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-foreground">Manage Team</h2>
              <p className="text-sm text-muted-foreground">
                Manage your members and edit their roles and permissions.
              </p>
            </div>
            <Button size="lg" className="h-11 rounded-full px-5" onClick={handleOpenCreate}>
              Add member
            </Button>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search members..."
                className="h-11 rounded-full pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex h-9 items-center gap-2 rounded-full px-3">
                    <SlidersHorizontal className="h-4 w-4" />
                    Sort & Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuHeader title="Sort members" />
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    {SORT_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center gap-2">
                {statusFilterOptions.map((option) => {
                  const isActive = statusFilter === option.value;
                  return (
                    <Button
                      key={option.value}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full px-4 ${isActive ? "" : "bg-transparent"}`}
                      onClick={() => setStatusFilter(option.value)}>
                      {option.label}
                    </Button>
                  );
                })}
              </div>
              {isFetching && !isLoading ? <Badge variant="secondary">Osvežavanje...</Badge> : null}
            </div>
          </div>

          {renderContent()}
        </div>
      </Card>

      <TeamMemberFormDialog
        open={isFormOpen}
        mode={formMode}
        member={selectedMember}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setSelectedMember(null);
          }
        }}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={Boolean(memberToDelete)} onOpenChange={(open) => (!open ? setMemberToDelete(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši člana tima</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da uklonite člana {memberToDelete?.fullName}? Ova radnja je trajna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={handleConfirmDelete}>
              {deleteMutation.isPending ? "Brisanje..." : "Obriši"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: TeamMemberStatus }) {
  const meta = STATUS_LABELS[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
      <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function TeamMembersSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/4 rounded-full" />
            <Skeleton className="h-3 w-1/3 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function DropdownMenuHeader({ title }: { title: string }) {
  return (
    <div className="px-2 py-1.5">
      <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
    </div>
  );
}

