import {
	employmentStatusValues,
	employmentTypeValues,
} from "@/lib/validations/employees";

export const EMPLOYEES_PAGE_SIZE = 20;

export const EMPLOYMENT_TYPE_OPTIONS = employmentTypeValues.map((value) => ({
	label: value,
	value,
}));

export const EMPLOYMENT_STATUS_OPTIONS = employmentStatusValues.map(
	(value) => ({
		label: value,
		value,
	}),
);

export const EMPLOYEE_SORT_OPTIONS = [
	{ label: "Name", value: "name" as const },
	{ label: "Start Date", value: "startDate" as const },
	{ label: "Status", value: "status" as const },
];
