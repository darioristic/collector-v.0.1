import { z } from "zod";

import { DEAL_STAGES } from "./constants";

const notesTransformer = z
  .string()
  .max(5000, "Notes are too long.")
  .optional()
  .transform((val) => {
    if (typeof val !== "string") {
      return undefined;
    }

    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

export const dealFormSchema = z.object({
  title: z.string().min(1, "Deal name is required."),
  company: z.string().min(1, "Company is required."),
  owner: z.string().min(1, "Owner is required."),
  stage: z.enum(DEAL_STAGES, {
    errorMap: () => ({ message: "Please choose a valid stage." }),
  }),
  value: z
    .coerce.number({
      invalid_type_error: "Value must be a number.",
    })
    .nonnegative("Value cannot be negative."),
  closeDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  notes: notesTransformer,
});

export const dealUpdateSchema = dealFormSchema.partial().refine(
  (values) => Object.keys(values).length > 0,
  "Payload cannot be empty.",
);

const dealFiltersCoreSchema = z.object({
  stage: z.enum(DEAL_STAGES).optional(),
  owner: z.string().min(1).optional(),
  search: z.string().optional(),
});

export const dealFiltersSchema = dealFiltersCoreSchema.optional();

export const stageUpdateSchema = z.object({
  id: z.string().cuid({ message: "Deal id is invalid." }),
  stage: z.enum(DEAL_STAGES, {
    errorMap: () => ({ message: "Please choose a valid stage." }),
  }),
});

export type DealFormInput = z.input<typeof dealFormSchema>;
export type DealFormValues = z.infer<typeof dealFormSchema>;
export type DealUpdateValues = z.infer<typeof dealUpdateSchema>;
export type DealFiltersValues = z.infer<typeof dealFiltersSchema>;

