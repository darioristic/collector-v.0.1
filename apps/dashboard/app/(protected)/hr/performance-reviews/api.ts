import type {
  PerformanceReview,
  PerformanceReviewsListResponse,
  PerformanceReviewsQueryState,
} from "./types";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
} as const;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = "Unexpected error.";
    try {
      const body = (await response.json()) as {
        error?: string;
        details?: unknown;
      };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
};

const buildQueryString = (
  params: Record<string, string | number | undefined>,
) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    searchParams.set(key, String(value));
  });

  return searchParams.toString();
};

export async function fetchPerformanceReviews(params: {
  query: PerformanceReviewsQueryState;
}): Promise<PerformanceReviewsListResponse> {
  const { query } = params;

  const queryString = buildQueryString({
    employeeId: query.employeeId,
    reviewerId: query.reviewerId,
    search: query.search,
    limit: query.limit,
    offset: query.offset,
  });

  const response = await fetch(`/api/hr/performance-reviews?${queryString}`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });

  return handleResponse<PerformanceReviewsListResponse>(response);
}

export async function getPerformanceReviewById(id: string): Promise<PerformanceReview> {
  const response = await fetch(`/api/hr/performance-reviews/${id}`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });

  const payload = await handleResponse<{ data: PerformanceReview }>(response);
  return payload.data;
}

export async function createPerformanceReview(
  values: Partial<PerformanceReview>,
): Promise<PerformanceReview> {
  const response = await fetch("/api/hr/performance-reviews", {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values),
  });

  const result = await handleResponse<{ data: PerformanceReview }>(response);
  return result.data;
}

export async function updatePerformanceReview(
  id: string,
  values: Partial<PerformanceReview>,
): Promise<PerformanceReview> {
  const response = await fetch(`/api/hr/performance-reviews/${id}`, {
    method: "PUT",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values),
  });

  const result = await handleResponse<{ data: PerformanceReview }>(response);
  return result.data;
}

export async function deletePerformanceReview(id: string): Promise<void> {
  const response = await fetch(`/api/hr/performance-reviews/${id}`, {
    method: "DELETE",
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok && response.status !== 204) {
    let message = "Unable to delete performance review.";
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}

