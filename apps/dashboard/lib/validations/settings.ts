import { z } from "zod";

export const settingsSchema = z.object({
	profilePhoto: z.string().optional().nullable(),
	firstName: z
		.string({ required_error: "Ime je obavezno." })
		.trim()
		.min(1, "Ime je obavezno."),
	lastName: z
		.string({ required_error: "Prezime je obavezno." })
		.trim()
		.min(1, "Prezime je obavezno."),
	username: z.string().trim(),
	email: z
		.string({ required_error: "Email je obavezan." })
		.trim()
		.min(1, "Email je obavezan.")
		.email("Unesite validnu email adresu."),
	website: z
		.string()
		.trim()
		.optional()
		.transform((value) => (value === "" ? undefined : value))
		.refine(
			(value) => !value || /^https?:\/\//i.test(value),
			"Unesite validan URL (uključujući http/https).",
		),
	timezone: z
		.string({ required_error: "Izaberite vremensku zonu." })
		.min(1, "Izaberite vremensku zonu."),
	language: z
		.string({ required_error: "Izaberite jezik." })
		.min(1, "Izaberite jezik."),
	startOfWeek: z
		.string({ required_error: "Izaberite početak nedelje." })
		.min(1, "Izaberite početak nedelje."),
	dateFormat: z
		.string({ required_error: "Izaberite format datuma." })
		.min(1, "Izaberite format datuma."),
	use24HourFormat: z.boolean(),
	showActiveDot: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
