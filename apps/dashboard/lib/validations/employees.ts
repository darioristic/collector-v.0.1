import { z } from "zod";

export const employmentTypeValues = ["Full-time", "Contractor", "Intern"] as const;

export const employmentStatusValues = ["Active", "On Leave", "Terminated"] as const;

export const employmentTypeSchema = z.enum(employmentTypeValues);

export const employmentStatusSchema = z.enum(employmentStatusValues);

export const employeeFormSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    email: z.string().email().max(255),
    phone: z
      .string()
      .max(50)
      .optional()
      .transform((value) => (value && value.trim().length === 0 ? undefined : value)),
    department: z
      .string()
      .max(100)
      .optional()
      .transform((value) => (value && value.trim().length === 0 ? undefined : value)),
    role: z
      .string()
      .max(100)
      .optional()
      .transform((value) => (value && value.trim().length === 0 ? undefined : value)),
    employmentType: employmentTypeSchema.default("Full-time"),
    status: employmentStatusSchema.default("Active"),
    startDate: z.coerce.date({ required_error: "Start date is required" }),
    endDate: z
      .coerce.date()
      .optional()
      .nullable()
      .transform((value) => value ?? null),
    salary: z
      .number({ invalid_type_error: "Salary must be a number" })
      .finite()
      .nonnegative()
      .max(10_000_000)
      .optional()
      .nullable()
      .transform((value) => (value ?? undefined))
  })
  .refine(
    (data) => {
      if (!data.endDate) {
        return true;
      }
      if (!(data.startDate instanceof Date)) {
        return true;
      }
      return data.endDate >= data.startDate;
    },
    { path: ["endDate"], message: "End date cannot be before the start date." }
  );

export const employeeUpdateSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().max(255).optional(),
    phone: z
      .string()
      .max(50)
      .optional()
      .transform((value) => (value && value.trim().length === 0 ? undefined : value)),
    department: z
      .string()
      .max(100)
      .optional()
      .transform((value) => (value && value.trim().length === 0 ? undefined : value)),
    role: z
      .string()
      .max(100)
      .optional()
      .transform((value) => (value && value.trim().length === 0 ? undefined : value)),
    employmentType: employmentTypeSchema.optional(),
    status: employmentStatusSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z
      .coerce.date()
      .optional()
      .nullable()
      .transform((value) => (value ?? null)),
    salary: z
      .number({ invalid_type_error: "Salary must be a number" })
      .finite()
      .nonnegative()
      .max(10_000_000)
      .optional()
      .nullable()
      .transform((value) => (value ?? undefined))
  })
  .refine(
    (data) => {
      if (!data.endDate) {
        return true;
      }
      if (!(data.startDate instanceof Date)) {
        return true;
      }
      return data.endDate >= data.startDate;
    },
    { path: ["endDate"], message: "End date cannot be before the start date." }
  );

export const employeeFiltersSchema = z.object({
  search: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .transform((value) => value?.trim() ?? undefined),
  department: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .transform((value) => value?.trim() ?? undefined),
  employmentType: employmentTypeSchema.optional(),
  status: employmentStatusSchema.optional()
});

export const employeeSortFieldSchema = z.enum(["name", "startDate", "status"]);
export type EmployeeSortField = z.infer<typeof employeeSortFieldSchema>;

export const sortOrderSchema = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof sortOrderSchema>;

export const listEmployeesQuerySchema = employeeFiltersSchema
  .extend({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
    sortField: employeeSortFieldSchema.default("name"),
    sortOrder: sortOrderSchema.default("asc")
  })
  .strict();

export const employeeIdSchema = z.object({
  id: z.coerce.number().int().positive()
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
export type EmployeeFiltersValues = z.infer<typeof employeeFiltersSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

