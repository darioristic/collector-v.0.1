import type { EmployeeFormValues } from "./schemas";
import { EMPLOYEES_PAGE_SIZE } from "./constants";
import type { EmployeesListResponse, EmployeesQueryState, Employee } from "./types";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json"
} as const;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = "Unexpected error.";
    try {
      const body = (await response.json()) as { error?: string; details?: unknown };
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
    if (value === undefined || value === null) {
      return;
    }
    searchParams.set(key, String(value));
  });

  return searchParams.toString();
};

export async function fetchEmployees(params: {
  query: EmployeesQueryState;
  cursor?: string | null;
}): Promise<EmployeesListResponse> {
  const { query, cursor } = params;

  const queryString = buildQueryString({
    search: query.search,
    department: query.department,
    employmentType: query.employmentType,
    status: query.status,
    sortField: query.sortField,
    sortOrder: query.sortOrder,
    limit: query.limit ?? EMPLOYEES_PAGE_SIZE,
    cursor: cursor ?? undefined
  });

  const response = await fetch(`/api/employees?${queryString}`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store"
  });

  return handleResponse<EmployeesListResponse>(response);
}

export async function getEmployeeById(id: number): Promise<Employee> {
  const response = await fetch(`/api/employees/${id}`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store"
  });

  const payload = await handleResponse<{ data: Employee }>(response);
  return payload.data;
}

export async function createEmployee(values: EmployeeFormValues): Promise<Employee> {
  const response = await fetch("/api/employees", {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values)
  });

  const result = await handleResponse<{ data: Employee }>(response);
  return result.data;
}

export async function updateEmployee(id: number, values: Partial<EmployeeFormValues>): Promise<Employee> {
  const response = await fetch(`/api/employees/${id}`, {
    method: "PUT",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values)
  });

  const result = await handleResponse<{ data: Employee }>(response);
  return result.data;
}

export async function deleteEmployee(id: number): Promise<void> {
  const response = await fetch(`/api/employees/${id}`, {
    method: "DELETE",
    headers: DEFAULT_HEADERS
  });

  if (!response.ok && response.status !== 204) {
    let message = "Unable to delete employee.";
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

export const mapEmployeeToFormValues = (employee: Employee): EmployeeFormValues => ({
  firstName: employee.firstName,
  lastName: employee.lastName,
  email: employee.email,
  phone: employee.phone ?? undefined,
  department: employee.department ?? undefined,
  role: employee.role ?? undefined,
  employmentType: employee.employmentType,
  status: employee.status,
  startDate: new Date(employee.startDate),
  endDate: employee.endDate ? new Date(employee.endDate) : null,
  salary: employee.salary ?? undefined
});

