import { z } from "zod";
import type { PerformanceReviewsQueryState } from "./types";

export const performanceReviewFormSchema = z.object({
  employeeId: z.string().uuid(),
  reviewDate: z.date(),
  periodStart: z.date(),
  periodEnd: z.date(),
  reviewerId: z.string().uuid().nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  comments: z.string().nullable().optional(),
  goals: z.string().nullable().optional(),
});

export type PerformanceReviewFormValues = z.infer<typeof performanceReviewFormSchema>;

export function parsePerformanceReviewsQueryState(
  searchParams: Record<string, string | string[] | undefined>,
): PerformanceReviewsQueryState {
  return {
    employeeId: typeof searchParams.employeeId === "string" ? searchParams.employeeId : undefined,
    reviewerId: typeof searchParams.reviewerId === "string" ? searchParams.reviewerId : undefined,
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    limit:
      typeof searchParams.limit === "string" ? parseInt(searchParams.limit, 10) : undefined,
    offset:
      typeof searchParams.offset === "string" ? parseInt(searchParams.offset, 10) : undefined,
  };
}

