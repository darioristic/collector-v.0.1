import { z } from "zod";
import type { PayrollEntriesQueryState } from "./types";

export const payrollEntryFormSchema = z.object({
  employeeId: z.string().uuid(),
  periodStart: z.date(),
  periodEnd: z.date(),
  grossPay: z.number().min(0),
  netPay: z.number().min(0),
});

export type PayrollEntryFormValues = z.infer<typeof payrollEntryFormSchema>;

export function parsePayrollEntriesQueryState(
  searchParams: Record<string, string | string[] | undefined>,
): PayrollEntriesQueryState {
  return {
    employeeId: typeof searchParams.employeeId === "string" ? searchParams.employeeId : undefined,
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    limit: typeof searchParams.limit === "string" ? parseInt(searchParams.limit, 10) : undefined,
    offset: typeof searchParams.offset === "string" ? parseInt(searchParams.offset, 10) : undefined,
  };
}

