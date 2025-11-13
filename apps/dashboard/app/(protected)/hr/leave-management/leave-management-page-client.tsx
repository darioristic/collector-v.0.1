"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { fetchLeaveRequests } from "./api";
import { LEAVE_MANAGEMENT_PAGE_SIZE } from "./constants";
import type { LeaveRequestsQueryState } from "./types";

interface LeaveManagementPageClientProps {
  initialQuery: LeaveRequestsQueryState;
}

export default function LeaveManagementPageClient({
  initialQuery,
}: LeaveManagementPageClientProps) {
  const [queryState] = React.useState<LeaveRequestsQueryState>({
    ...initialQuery,
    limit: initialQuery.limit ?? LEAVE_MANAGEMENT_PAGE_SIZE,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leave-requests", queryState],
    queryFn: () => fetchLeaveRequests({ query: queryState }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Leave Management</h1>
      <p className="text-muted-foreground mb-6">
        Manage leave requests and time off
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

