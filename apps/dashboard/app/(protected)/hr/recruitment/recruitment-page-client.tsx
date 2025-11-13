"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  createCandidate,
  deleteCandidate,
  fetchCandidates,
  updateCandidate
} from "./api";
import CandidatesTable from "./components/candidates-table";
import CandidatesToolbar from "./components/candidates-toolbar";
import CandidatesEmptyState from "./components/candidates-empty-state";
import CandidatesSkeleton from "./components/candidates-skeleton";
import CandidateFormDialog from "./components/candidate-form-dialog";
import DeleteCandidateDialog from "./components/delete-candidate-dialog";
import { RECRUITMENT_PAGE_SIZE } from "./constants";
import type { CandidateFormValues } from "./schemas";
import type { Candidate, CandidatesQueryState } from "./types";

interface RecruitmentPageClientProps {
  initialQuery: CandidatesQueryState;
}

const hasFilters = (query: CandidatesQueryState, searchValue: string) =>
  Boolean(query.status) ||
  Boolean(query.position) ||
  Boolean(searchValue);

export default function RecruitmentPageClient({
  initialQuery,
}: RecruitmentPageClientProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [queryState, setQueryState] = React.useState<CandidatesQueryState>({
    ...initialQuery,
    limit: initialQuery.limit ?? RECRUITMENT_PAGE_SIZE,
  });
  const [searchValue, setSearchValue] = React.useState(initialQuery.search ?? "");

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [formInitialValues, setFormInitialValues] = React.useState<CandidateFormValues | undefined>(
    undefined
  );
  const [editingCandidate, setEditingCandidate] = React.useState<Candidate | null>(null);
  const [candidateToDelete, setCandidateToDelete] = React.useState<Candidate | null>(null);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setQueryState((prev) => ({
        ...prev,
        search: searchValue.trim().length > 0 ? searchValue.trim() : undefined
      }));
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchValue]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["candidates", queryState],
    queryFn: () => fetchCandidates({ query: queryState }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const candidates = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: createCandidate,
    onSuccess: (candidate) => {
      toast({
        title: "Candidate created",
        description: `${candidate.firstName} ${candidate.lastName} has been added successfully.`
      });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error.message
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CandidateFormValues> }) =>
      updateCandidate(id, values),
    onSuccess: (candidate) => {
      toast({
        title: "Candidate updated",
        description: `${candidate.firstName} ${candidate.lastName} has been updated.`
      });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCandidate(id),
    onSuccess: () => {
      toast({
        title: "Candidate deleted",
        description: "The candidate has been removed."
      });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      setCandidateToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error.message
      });
    }
  });

  const handleOpenCreate = React.useCallback(() => {
    setFormMode("create");
    setFormInitialValues(undefined);
    setIsFormOpen(true);
    setEditingCandidate(null);
  }, []);

  const handleOpenEdit = React.useCallback((candidate: Candidate) => {
    setFormMode("edit");
    setFormInitialValues({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone ?? undefined,
      position: candidate.position,
      status: candidate.status,
      source: candidate.source ?? undefined,
      resumeUrl: candidate.resumeUrl ?? undefined,
    });
    setEditingCandidate(candidate);
    setIsFormOpen(true);
  }, []);

  const handleSubmitForm = React.useCallback(
    (values: CandidateFormValues) => {
      if (formMode === "create") {
        createMutation.mutate(values);
        return;
      }

      if (!editingCandidate) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "No candidate selected for editing."
        });
        return;
      }

      updateMutation.mutate({
        id: editingCandidate.id,
        values
      });
    },
    [createMutation, editingCandidate, formMode, toast, updateMutation]
  );

  const handleDelete = React.useCallback((candidate: Candidate) => {
    setCandidateToDelete(candidate);
  }, []);

  const handleConfirmDelete = React.useCallback(() => {
    if (candidateToDelete) {
      deleteMutation.mutate(candidateToDelete.id);
    }
  }, [deleteMutation, candidateToDelete]);

  const handleFiltersChange = React.useCallback(
    (nextFilters: { status?: string; position?: string }) => {
      setQueryState((prev) => ({
        ...prev,
        status: nextFilters.status as CandidatesQueryState["status"] | undefined,
        position: nextFilters.position ?? undefined,
      }));
    },
    []
  );

  const handleResetFilters = React.useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      search: undefined,
      status: undefined,
      position: undefined,
    }));
    setSearchValue("");
  }, []);

  const isInitialLoading = isLoading && !data;
  const isEmpty = !isLoading && candidates.length === 0;
  const filtersActive = hasFilters(queryState, searchValue);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/hr">HR</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Recruitment</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage candidates and track interviews throughout the hiring process.
            </p>
          </div>
          <Button type="button" className="gap-2" onClick={handleOpenCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Candidate
          </Button>
        </div>
      </div>

      <CandidatesToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={{
          status: queryState.status,
          position: queryState.position,
        }}
        onFiltersChange={handleFiltersChange}
        isDisabled={isFetching && candidates.length === 0}
        onResetFilters={handleResetFilters}
      />

      {isInitialLoading ? (
        <CandidatesSkeleton />
      ) : isEmpty && !filtersActive ? (
        <CandidatesEmptyState onAddCandidate={handleOpenCreate} />
      ) : (
        <CandidatesTable
          candidates={candidates}
          isLoading={isFetching && candidates.length === 0}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      <CandidateFormDialog
        open={isFormOpen}
        mode={formMode}
        initialValues={formInitialValues ?? undefined}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitForm}
      />

      <DeleteCandidateDialog
        open={Boolean(candidateToDelete)}
        candidateName={candidateToDelete ? `${candidateToDelete.firstName} ${candidateToDelete.lastName}` : null}
        isLoading={deleteMutation.isPending}
        onClose={() => setCandidateToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
