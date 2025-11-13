import type {
  PayrollEntry,
  PayrollEntriesListResponse,
  PayrollEntriesQueryState,
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

export async function fetchPayrollEntries(params: {
  query: PayrollEntriesQueryState;
}): Promise<PayrollEntriesListResponse> {
  const { query } = params;
  const queryString = buildQueryString(query);
  const response = await fetch(`/api/hr/payroll?${queryString}`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });
  return handleResponse<PayrollEntriesListResponse>(response);
}

export async function getPayrollEntryById(id: string): Promise<PayrollEntry> {
  const response = await fetch(`/api/hr/payroll/${id}`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });
  const payload = await handleResponse<{ data: PayrollEntry }>(response);
  return payload.data;
}

export async function createPayrollEntry(values: Partial<PayrollEntry>): Promise<PayrollEntry> {
  const response = await fetch("/api/hr/payroll", {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values),
  });
  const result = await handleResponse<{ data: PayrollEntry }>(response);
  return result.data;
}

export async function updatePayrollEntry(
  id: string,
  values: Partial<PayrollEntry>,
): Promise<PayrollEntry> {
  const response = await fetch(`/api/hr/payroll/${id}`, {
    method: "PUT",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values),
  });
  const result = await handleResponse<{ data: PayrollEntry }>(response);
  return result.data;
}

export async function deletePayrollEntry(id: string): Promise<void> {
  const response = await fetch(`/api/hr/payroll/${id}`, {
    method: "DELETE",
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok && response.status !== 204) {
    throw new Error("Unable to delete payroll entry.");
  }
}

