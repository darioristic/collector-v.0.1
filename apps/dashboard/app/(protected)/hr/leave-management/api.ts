import type {
  LeaveRequest,
  LeaveRequestsListResponse,
  LeaveRequestsQueryState,
} from "./types";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
} as const;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = "Unexpected error.";
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
  return (await response.json()) as T;
};

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
};

export async function fetchLeaveRequests(params: {
  query: LeaveRequestsQueryState;
}): Promise<LeaveRequestsListResponse> {
  const { query } = params;
  const queryString = buildQueryString(query as Record<string, string | number | undefined>);
  const response = await fetch(`/api/hr/leave-requests?${queryString}`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });
  return handleResponse<LeaveRequestsListResponse>(response);
}

export async function getLeaveRequestById(id: string): Promise<LeaveRequest> {
  const response = await fetch(`/api/hr/leave-requests/${id}`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });
  const payload = await handleResponse<{ data: LeaveRequest }>(response);
  return payload.data;
}

export async function createLeaveRequest(values: Partial<LeaveRequest>): Promise<LeaveRequest> {
  const response = await fetch("/api/hr/leave-requests", {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values),
  });
  const result = await handleResponse<{ data: LeaveRequest }>(response);
  return result.data;
}

export async function updateLeaveRequest(
  id: string,
  values: Partial<LeaveRequest>,
): Promise<LeaveRequest> {
  const response = await fetch(`/api/hr/leave-requests/${id}`, {
    method: "PUT",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values),
  });
  const result = await handleResponse<{ data: LeaveRequest }>(response);
  return result.data;
}

export async function deleteLeaveRequest(id: string): Promise<void> {
  const response = await fetch(`/api/hr/leave-requests/${id}`, {
    method: "DELETE",
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok && response.status !== 204) {
    throw new Error("Unable to delete leave request.");
  }
}

export async function approveLeaveRequest(id: string, approverId: string): Promise<LeaveRequest> {
  const response = await fetch(`/api/hr/leave-requests/${id}/approve?approverId=${approverId}`, {
    method: "POST",
    headers: DEFAULT_HEADERS,
  });
  const result = await handleResponse<{ data: LeaveRequest }>(response);
  return result.data;
}

export async function rejectLeaveRequest(id: string, approverId: string): Promise<LeaveRequest> {
  const response = await fetch(`/api/hr/leave-requests/${id}/reject?approverId=${approverId}`, {
    method: "POST",
    headers: DEFAULT_HEADERS,
  });
  const result = await handleResponse<{ data: LeaveRequest }>(response);
  return result.data;
}

