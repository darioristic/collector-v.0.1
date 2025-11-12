import type {
	employmentStatusValues,
	employmentTypeValues,
} from "@/lib/validations/employees";

export type EmploymentType = (typeof employmentTypeValues)[number];
export type EmploymentStatus = (typeof employmentStatusValues)[number];

export interface Employee {
	id: number;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
	phone: string | null;
	department: string | null;
	role: string | null;
	employmentType: EmploymentType;
	status: EmploymentStatus;
	startDate: string;
	endDate: string | null;
	salary: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface EmployeesPageInfo {
	hasNextPage: boolean;
	nextCursor: string | null;
}

export interface EmployeesListResponse {
	data: Employee[];
	pageInfo: EmployeesPageInfo;
}

export interface EmployeesQueryState {
	search?: string;
	department?: string;
	employmentType?: EmploymentType;
	status?: EmploymentStatus;
	sortField: "name" | "startDate" | "status";
	sortOrder: "asc" | "desc";
	limit: number;
}
