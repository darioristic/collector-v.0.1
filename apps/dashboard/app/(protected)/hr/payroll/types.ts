export interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName?: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  netPay: number;
  createdAt: string;
}

export interface PayrollEntriesListResponse {
  data: PayrollEntry[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface PayrollEntriesQueryState {
  employeeId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

