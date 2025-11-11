import { z } from "zod";

const emptyToNull = (value: unknown) => {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length === 0 ? null : trimmed;
	}

	return value === undefined ? null : value;
};

const optionalText = (max: number, message: string) =>
	z.preprocess(emptyToNull, z.string().max(max, message).trim().nullable().optional());

const optionalUrl = (message: string) =>
	z.preprocess(
		emptyToNull,
		z
			.string()
			.url(message)
			.trim()
			.nullable()
			.optional(),
	);

const toNumberOrNull = (value: unknown) => {
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed.length === 0) {
			return null;
		}

		const parsed = Number(trimmed);
		return Number.isNaN(parsed) ? value : parsed;
	}

	if (typeof value === "number") {
		return value;
	}

	return value === undefined ? null : value;
};

export const companyUpsertSchema = z.object({
	name: z
		.string({ required_error: "Naziv kompanije je obavezan." })
		.trim()
		.min(2, "Naziv kompanije je obavezan.")
		.max(255, "Naziv može imati najviše 255 karaktera."),
	legalName: optionalText(255, "Pravno ime može imati najviše 255 karaktera."),
	registrationNo: optionalText(100, "Registracioni broj može imati najviše 100 karaktera."),
	taxId: optionalText(100, "PIB može imati najviše 100 karaktera."),
	industry: optionalText(255, "Industrija može imati najviše 255 karaktera."),
	employees: z
		.preprocess(
			toNumberOrNull,
			z
				.number({ invalid_type_error: "Broj zaposlenih mora biti broj." })
				.int("Broj zaposlenih mora biti ceo broj.")
				.min(0, "Broj zaposlenih ne može biti negativan.")
				.max(1_000_000, "Broj zaposlenih je prevelik.")
				.nullable()
				.optional(),
		)
		.nullable()
		.optional(),
	streetAddress: optionalText(255, "Adresa može imati najviše 255 karaktera."),
	city: optionalText(255, "Grad može imati najviše 255 karaktera."),
	zipCode: optionalText(50, "Poštanski broj može imati najviše 50 karaktera."),
	country: optionalText(100, "Država može imati najviše 100 karaktera."),
	email: z
		.string({ required_error: "E-mail je obavezan." })
		.trim()
		.email("Unesite validnu e-mail adresu.")
		.max(255, "E-mail može imati najviše 255 karaktera."),
	phone: optionalText(100, "Telefon može imati najviše 100 karaktera."),
	website: optionalUrl("URL sajta mora biti validan."),
	logoUrl: optionalUrl("URL logotipa mora biti validan."),
	faviconUrl: optionalUrl("URL favicon-a mora biti validan."),
	brandColor: z
		.preprocess(
			emptyToNull,
			z
				.string()
				.regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Boja mora biti u HEX formatu.")
				.trim()
				.nullable()
				.optional(),
		),
	description: z
		.preprocess(
			emptyToNull,
			z
				.string()
				.max(500, "Opis može imati najviše 500 karaktera.")
				.trim()
				.nullable()
				.optional(),
		)
		.nullable()
		.optional(),
});

export const companyResponseSchema = z
	.object({
		id: z.number(),
		ownerId: z.string().uuid(),
		name: z.string(),
		legalName: z.string().nullable(),
		registrationNo: z.string().nullable(),
		taxId: z.string().nullable(),
		industry: z.string().nullable(),
		employees: z.number().nullable(),
		streetAddress: z.string().nullable(),
		city: z.string().nullable(),
		zipCode: z.string().nullable(),
		country: z.string().nullable(),
		email: z.string(),
		phone: z.string().nullable(),
		website: z.string().nullable(),
		logoUrl: z.string().nullable(),
		faviconUrl: z.string().nullable(),
		brandColor: z.string().nullable(),
		description: z.string().nullable(),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	})
	.nullable();

export const companyFormSchema = companyUpsertSchema;

export type CompanyUpsertPayload = z.infer<typeof companyUpsertSchema>;
export type CompanyFormInput = z.input<typeof companyFormSchema>;
export type CompanyFormValues = z.infer<typeof companyFormSchema>;
export type CompanyResponse = z.infer<typeof companyResponseSchema>;

