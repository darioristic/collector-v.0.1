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
  createPerformanceReview,
  deletePerformanceReview,
  fetchPerformanceReviews,
  updatePerformanceReview
} from "./api";
import PerformanceReviewsTable from "./components/performance-reviews-table";
import PerformanceReviewsToolbar from "./components/performance-reviews-toolbar";
import PerformanceReviewsEmptyState from "./components/performance-reviews-empty-state";
import PerformanceReviewsSkeleton from "./components/performance-reviews-skeleton";
import PerformanceReviewFormDialog from "./components/performance-review-form-dialog";
import DeletePerformanceReviewDialog from "./components/delete-performance-review-dialog";
import { PERFORMANCE_REVIEWS_PAGE_SIZE } from "./constants";
import type { PerformanceReviewFormValues } from "./schemas";
import type { PerformanceReview, PerformanceReviewsQueryState } from "./types";

interface PerformanceReviewsPageClientProps {
  initialQuery: PerformanceReviewsQueryState;
}

const hasFilters = (query: PerformanceReviewsQueryState, searchValue: string) =>
  Boolean(query.employeeId) ||
  Boolean(query.reviewerId) ||
  Boolean(searchValue);

const mapFormValuesToApiPayload = (
  values: Partial<PerformanceReviewFormValues>,
): Partial<PerformanceReview> => ({
  ...values,
  reviewDate: values.reviewDate ? values.reviewDate.toISOString() : undefined,
  periodStart: values.periodStart ? values.periodStart.toISOString() : undefined,
  periodEnd: values.periodEnd ? values.periodEnd.toISOString() : undefined,
});

export default function PerformanceReviewsPageClient({
  initialQuery,
}: PerformanceReviewsPageClientProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [queryState, setQueryState] = React.useState<PerformanceReviewsQueryState>({
    ...initialQuery,
    limit: initialQuery.limit ?? PERFORMANCE_REVIEWS_PAGE_SIZE,
  });
  const [searchValue, setSearchValue] = React.useState(initialQuery.search ?? "");

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [formInitialValues, setFormInitialValues] = React.useState<PerformanceReviewFormValues | undefined>(
    undefined
  );
  const [editingReview, setEditingReview] = React.useState<PerformanceReview | null>(null);
  const [reviewToDelete, setReviewToDelete] = React.useState<PerformanceReview | null>(null);

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
    queryKey: ["performance-reviews", queryState],
    queryFn: () => fetchPerformanceReviews({ query: queryState }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const reviews = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (values: PerformanceReviewFormValues) =>
      createPerformanceReview(mapFormValuesToApiPayload(values)),
    onSuccess: (_review) => {
      toast({
        title: "Performance review created",
        description: `Performance review has been created successfully.`
      });
      queryClient.invalidateQueries({ queryKey: ["performance-reviews"] });
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
    mutationFn: ({ id, values }: { id: string; values: Partial<PerformanceReviewFormValues> }) =>
      updatePerformanceReview(id, mapFormValuesToApiPayload(values)),
    onSuccess: (_review) => {
      toast({
        title: "Performance review updated",
        description: `Performance review has been updated.`
      });
      queryClient.invalidateQueries({ queryKey: ["performance-reviews"] });
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
    mutationFn: (id: string) => deletePerformanceReview(id),
    onSuccess: () => {
      toast({
        title: "Performance review deleted",
        description: "The performance review has been removed."
      });
      queryClient.invalidateQueries({ queryKey: ["performance-reviews"] });
      setReviewToDelete(null);
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
    setEditingReview(null);
  }, []);

  const handleOpenEdit = React.useCallback((review: PerformanceReview) => {
    setFormMode("edit");
    setFormInitialValues({
      employeeId: review.employeeId,
      reviewDate: new Date(review.reviewDate),
      periodStart: new Date(review.periodStart),
      periodEnd: new Date(review.periodEnd),
      reviewerId: review.reviewerId ?? undefined,
      rating: review.rating ?? undefined,
      comments: review.comments ?? undefined,
      goals: review.goals ?? undefined,
    });
    setEditingReview(review);
    setIsFormOpen(true);
  }, []);

  const handleSubmitForm = React.useCallback(
    (values: PerformanceReviewFormValues) => {
      if (formMode === "create") {
        createMutation.mutate(values);
        return;
      }

      if (!editingReview) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "No review selected for editing."
        });
        return;
      }

      updateMutation.mutate({
        id: editingReview.id,
        values
      });
    },
    [createMutation, editingReview, formMode, toast, updateMutation]
  );

  const handleDelete = React.useCallback((review: PerformanceReview) => {
    setReviewToDelete(review);
  }, []);

  const handleConfirmDelete = React.useCallback(() => {
    if (reviewToDelete) {
      deleteMutation.mutate(reviewToDelete.id);
    }
  }, [deleteMutation, reviewToDelete]);

  const handleFiltersChange = React.useCallback(
    (nextFilters: { employeeId?: string; reviewerId?: string }) => {
      setQueryState((prev) => ({
        ...prev,
        employeeId: nextFilters.employeeId ?? undefined,
        reviewerId: nextFilters.reviewerId ?? undefined,
      }));
    },
    []
  );

  const handleResetFilters = React.useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      search: undefined,
      employeeId: undefined,
      reviewerId: undefined,
    }));
    setSearchValue("");
  }, []);

  const isInitialLoading = isLoading && !data;
  const isEmpty = !isLoading && reviews.length === 0;
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
              <BreadcrumbPage>Performance Reviews</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Reviews</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Track and manage employee performance reviews, ratings, and goals.
            </p>
          </div>
          <Button type="button" className="gap-2" onClick={handleOpenCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Review
          </Button>
        </div>
      </div>

      <PerformanceReviewsToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={{
          employeeId: queryState.employeeId,
          reviewerId: queryState.reviewerId,
        }}
        onFiltersChange={handleFiltersChange}
        isDisabled={isFetching && reviews.length === 0}
        onResetFilters={handleResetFilters}
      />

      {isInitialLoading ? (
        <PerformanceReviewsSkeleton />
      ) : isEmpty && !filtersActive ? (
        <PerformanceReviewsEmptyState onAddReview={handleOpenCreate} />
      ) : (
        <PerformanceReviewsTable
          reviews={reviews}
          isLoading={isFetching && reviews.length === 0}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      <PerformanceReviewFormDialog
        open={isFormOpen}
        mode={formMode}
        initialValues={formInitialValues ?? undefined}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitForm}
      />

      <DeletePerformanceReviewDialog
        open={Boolean(reviewToDelete)}
        reviewDate={reviewToDelete ? new Date(reviewToDelete.reviewDate).toLocaleDateString() : null}
        isLoading={deleteMutation.isPending}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
