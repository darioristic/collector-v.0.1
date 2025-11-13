import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PerformanceReviewsEmptyStateProps {
  onAddReview?: () => void;
}

export default function PerformanceReviewsEmptyState({
  onAddReview
}: PerformanceReviewsEmptyStateProps) {
  return (
    <div className="border-muted-foreground/40 bg-muted/40 flex flex-col items-center justify-center rounded-xl border border-dashed px-8 py-12 text-center shadow-sm">
      <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
        <ClipboardList className="size-7" aria-hidden="true" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight">No performance reviews yet</h3>
      <p className="text-muted-foreground mt-2 max-w-lg text-sm">
        Create your first performance review to track employee performance, set goals, and provide
        feedback.
      </p>
      {onAddReview && (
        <Button type="button" className="mt-6" onClick={onAddReview}>
          Add Performance Review
        </Button>
      )}
    </div>
  );
}
