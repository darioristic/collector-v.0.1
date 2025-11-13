"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { fetchPayrollEntries } from "./api";
import { PAYROLL_PAGE_SIZE } from "./constants";
import type { PayrollEntriesQueryState } from "./types";

interface PayrollPageClientProps {
  initialQuery: PayrollEntriesQueryState;
}

export default function PayrollPageClient({ initialQuery }: PayrollPageClientProps) {
  const [queryState] = React.useState<PayrollEntriesQueryState>({
    ...initialQuery,
    limit: initialQuery.limit ?? PAYROLL_PAGE_SIZE,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["payroll-entries", queryState],
    queryFn: () => fetchPayrollEntries({ query: queryState }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Payroll</h1>
      <p className="text-muted-foreground mb-6">
        Manage payroll entries and employee compensation
      </p>
      {data && (
        <div>
          <p>Total: {data.pagination?.total ?? data.data.length}</p>
          {/* TODO: Add table and other components */}
        </div>
      )}
    </div>
  );
}

