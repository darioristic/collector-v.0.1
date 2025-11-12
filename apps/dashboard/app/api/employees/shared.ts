import type { Employee } from "@/lib/db/schema/employees";

export type SerializedEmployee = {
	id: number;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
	phone: string | null;
	department: string | null;
	role: string | null;
	employmentType: string;
	status: string;
	startDate: string;
	endDate: string | null;
	salary: number | null;
	createdAt: string;
	updatedAt: string;
};

const toDate = (value: Date | string | null | undefined) => {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}
	return parsed;
};

const toIsoString = (value: Date | string | null | undefined) => {
	const date = toDate(value);
	return date ? date.toISOString() : null;
};

export function serializeEmployee(employee: Employee): SerializedEmployee {
	const salaryValue =
		employee.salary !== null && employee.salary !== undefined
			? Number(employee.salary)
			: null;

	return {
		id: employee.id,
		firstName: employee.firstName,
		lastName: employee.lastName,
		fullName: `${employee.firstName} ${employee.lastName}`.trim(),
		email: employee.email,
		phone: employee.phone ?? null,
		department: employee.department ?? null,
		role: employee.role ?? null,
		employmentType: employee.employmentType,
		status: employee.status,
		startDate: toIsoString(employee.startDate) ?? new Date().toISOString(),
		endDate: toIsoString(employee.endDate),
		salary: Number.isFinite(salaryValue) ? salaryValue : null,
		createdAt: toIsoString(employee.createdAt) ?? new Date().toISOString(),
		updatedAt: toIsoString(employee.updatedAt) ?? new Date().toISOString(),
	};
}
