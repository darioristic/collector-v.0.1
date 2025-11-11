import { companyFormSchema, type CompanyFormValues, type CompanyResponse, type CompanyUpsertPayload } from "@/lib/validations/settings/company";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json"
} as const;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = "Došlo je do greške.";

    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // ignore body parse
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const fetchCompany = async (): Promise<CompanyResponse> => {
  const response = await fetch("/api/company", {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store"
  });

  return handleResponse<CompanyResponse>(response);
};

export const upsertCompany = async (payload: CompanyUpsertPayload): Promise<CompanyResponse> => {
  const parsed = companyFormSchema.parse(payload);

  const response = await fetch("/api/company", {
    method: "PATCH",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(parsed)
  });

  const result = await handleResponse<{ success: boolean; data: CompanyResponse }>(response);

  return result.data;
};

export type { CompanyFormValues, CompanyResponse, CompanyUpsertPayload };
