export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName?: string;
  reviewDate: string;
  periodStart: string;
  periodEnd: string;
  reviewerId: string | null;
  reviewerName?: string | null;
  rating: number | null;
  comments: string | null;
  goals: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReviewsListResponse {
  data: PerformanceReview[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface PerformanceReviewsQueryState {
  employeeId?: string;
  reviewerId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

