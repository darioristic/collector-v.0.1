import { z } from "zod";

import {
	employeeFormSchema,
	employmentStatusSchema,
	employmentStatusValues,
	employmentTypeSchema,
	employmentTypeValues,
	sortOrderSchema,
} from "@/lib/validations/employees";

import type { EmployeesQueryState } from "./types";

const rawEmployeeFormSchema = z.object({
	firstName: z.string().min(1, "First name is required.").max(100),
	lastName: z.string().min(1, "Last name is required.").max(100),
	email: z.string().email().max(255),
	phone: z
		.string()
		.max(50)
		.optional()
		.transform((value) =>
			value && value.trim().length > 0 ? value : undefined,
		),
	department: z
		.string()
		.max(100)
		.optional()
		.transform((value) =>
			value && value.trim().length > 0 ? value : undefined,
		),
	role: z
		.string()
		.max(100)
		.optional()
		.transform((value) =>
			value && value.trim().length > 0 ? value : undefined,
		),
	employmentType: employmentTypeSchema.default("Full-time"),
	status: employmentStatusSchema.default("Active"),
	startDate: z
		.union([z.string().min(1, "Start date is required."), z.date()])
		.transform((value, ctx) => {
			if (value instanceof Date) {
				if (Number.isNaN(value.getTime())) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Invalid start date.",
					});
				}
				return value;
			}

			const date = new Date(value);
			if (Number.isNaN(date.getTime())) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Invalid start date.",
				});
				return value;
			}
			return date;
		}),
	endDate: z
		.union([z.string(), z.date(), z.null(), z.undefined()])
		.transform((value, ctx) => {
			if (
				value === null ||
				value === undefined ||
				(typeof value === "string" && value.trim().length === 0)
			) {
				return null;
			}

			if (value instanceof Date) {
				if (Number.isNaN(value.getTime())) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Invalid end date.",
					});
					return null;
				}
				return value;
			}

			const date = new Date(value);
			if (Number.isNaN(date.getTime())) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Invalid end date.",
				});
				return null;
			}
			return date;
		}),
	salary: z
		.union([z.string(), z.number()])
		.optional()
		.transform((value, ctx) => {
			if (value === undefined || value === null) {
				return undefined;
			}

			if (typeof value === "number") {
				if (!Number.isFinite(value) || value < 0) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Salary must be a positive number.",
					});
					return undefined;
				}
				return value;
			}

			if (value.trim().length === 0) {
				return undefined;
			}

			const parsed = Number(value);
			if (Number.isNaN(parsed) || parsed < 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Salary must be a positive number.",
				});
				return undefined;
			}
			return parsed;
		}),
	projectAssigned: z
		.string()
		.max(100)
		.optional()
		.transform((value) =>
			value && value.trim().length > 0 ? value : undefined,
		),
	workHour: z
		.string()
		.max(50)
		.optional()
		.transform((value) =>
			value && value.trim().length > 0 ? value : undefined,
		),
	description: z.string().optional(),
	sendChangeToEmail: z.boolean().default(false),
});

export const employeeFormUiSchema = rawEmployeeFormSchema.transform((data) => {
	const { projectAssigned, workHour, description, sendChangeToEmail, ...rest } = data;
	return employeeFormSchema.parse({
		...rest,
		endDate: rest.endDate ?? null,
	});
});

export type EmployeeFormInput = z.input<typeof rawEmployeeFormSchema>;

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

const formatDateInput = (value?: Date | null) => {
	if (!value) {
		return "";
	}

	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	return date.toISOString().split("T")[0] ?? "";
};

export const toEmployeeFormInput = (
	values?: EmployeeFormValues | null,
): EmployeeFormInput => ({
	firstName: values?.firstName ?? "",
	lastName: values?.lastName ?? "",
	email: values?.email ?? "",
	phone: values?.phone ?? "",
	department: values?.department ?? "",
	role: values?.role ?? "",
	employmentType: values?.employmentType ?? "Full-time",
	status: values?.status ?? "Active",
	startDate: formatDateInput(values?.startDate),
	endDate: formatDateInput(values?.endDate ?? null),
	salary:
		values?.salary !== undefined &&
		values?.salary !== null &&
		!Number.isNaN(values.salary)
			? String(values.salary)
			: "",
	projectAssigned: (values as any)?.projectAssigned ?? "",
	workHour: (values as any)?.workHour ?? "",
	description: (values as any)?.description ?? "",
	sendChangeToEmail: (values as any)?.sendChangeToEmail ?? false,
});

export const employeeFiltersSchema = z.object({
	search: z.string().trim().optional(),
	department: z.string().trim().optional(),
	employmentType: employmentTypeSchema.optional(),
	status: employmentStatusSchema.optional(),
});

export type EmployeeFilters = z.infer<typeof employeeFiltersSchema>;

export const employeesQueryStateSchema = z.object({
	search: z.string().optional(),
	department: z.string().optional(),
	employmentType: z.enum(employmentTypeValues).optional(),
	status: z.enum(employmentStatusValues).optional(),
	sortField: z.enum(["name", "startDate", "status"]).default("name"),
	sortOrder: sortOrderSchema.default("asc"),
	limit: z.number().int().min(1).max(100).default(20),
});

export const parseEmployeesQueryState = (
	params: Record<string, string | string[] | undefined>,
): EmployeesQueryState => {
	const normalized: Record<string, string> = {};

	for (const [key, value] of Object.entries(params)) {
		if (typeof value === "string") {
			normalized[key] = value;
		}
	}

	const result = employeesQueryStateSchema.safeParse({
		...normalized,
		limit: normalized.limit ? Number(normalized.limit) : undefined,
	});

	if (!result.success) {
		return {
			sortField: "name",
			sortOrder: "asc",
			limit: 20,
		};
	}

	return {
		...result.data,
		limit: result.data.limit ?? 20,
	};
};
