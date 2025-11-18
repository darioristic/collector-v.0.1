export interface LeaveRequest {
	id: string;
	employeeId: string;
	employeeName?: string;
	startDate: string;
	endDate: string;
	reason: string | null;
	status: string;
	approvedBy: string | null;
	approverName?: string | null;
	createdAt: string;
}

export interface LeaveRequestsListResponse {
	data: LeaveRequest[];
	pagination?: {
		total: number;
		limit: number;
		offset: number;
	};
}

export interface LeaveRequestsQueryState {
	employeeId?: string;
	status?: string;
	search?: string;
	limit?: number;
	offset?: number;
}
