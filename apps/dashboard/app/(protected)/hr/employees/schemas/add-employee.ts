import { z } from "zod";

import {
	employmentStatusSchema,
	employmentStatusValues,
	employmentTypeSchema,
} from "@/lib/validations/employees";

export const departmentValues = [
	"Engineering",
	"Sales",
	"Marketing",
	"HR",
	"Finance",
	"Operations",
] as const;

export const accessLevelValues = ["User", "Manager", "Admin"] as const;

export const departmentSchema = z.enum(departmentValues);
export const accessLevelSchema = z.enum(accessLevelValues);

export const addEmployeeFormSchema = z.object({
	fullName: z
		.string()
		.min(1, "Full name is required.")
		.max(200, "Full name must be less than 200 characters.")
		.refine(
			(value) => value.trim().split(/\s+/).length >= 2,
			"Please enter both first and last name.",
		),
	email: z
		.string()
		.email("Invalid email address.")
		.max(255, "Email is too long."),
	department: departmentSchema,
	role: z.string().min(1, "Role/Position is required.").max(100),
	employmentType: z
		.enum(["Full-time", "Part-time", "Contractor"])
		.default("Full-time"),
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
	profileImage: z
		.instanceof(File)
		.optional()
		.nullable()
		.refine(
			(file) => {
				if (!file) return true;
				return file.size <= 5 * 1024 * 1024; // 5MB
			},
			{ message: "Profile image must be less than 5MB." },
		)
		.refine(
			(file) => {
				if (!file) return true;
				return file.type.startsWith("image/");
			},
			{ message: "Profile image must be an image file." },
		),
	accessLevel: accessLevelSchema.default("User"),
	tags: z.array(z.string()).default([]),
	notes: z
		.string()
		.max(1000, "Notes must be less than 1000 characters.")
		.optional(),
});

export type AddEmployeeFormInput = z.input<typeof addEmployeeFormSchema>;
export type AddEmployeeFormValues = z.infer<typeof addEmployeeFormSchema>;

export const transformAddEmployeeToAPI = (
	values: AddEmployeeFormValues,
): {
	firstName: string;
	lastName: string;
	email: string;
	department: string;
	role: string;
	employmentType: "Full-time" | "Contractor" | "Intern";
	status: (typeof employmentStatusValues)[number];
	startDate: Date;
	endDate: Date | null;
} => {
	const nameParts = values.fullName.trim().split(/\s+/).filter(Boolean);
	const firstName = nameParts[0] || "";
	const lastName = nameParts.slice(1).join(" ") || firstName;

	return {
		firstName,
		lastName,
		email: values.email,
		department: values.department,
		role: values.role,
		employmentType:
			values.employmentType === "Part-time"
				? "Full-time"
				: (values.employmentType as "Full-time" | "Contractor" | "Intern"),
		status: values.status,
		startDate: values.startDate instanceof Date ? values.startDate : new Date(values.startDate),
		endDate: null,
	};
};
