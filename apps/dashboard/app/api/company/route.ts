import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { getCurrentAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { company } from "@/lib/db/schema/core";
import {
	companyResponseSchema,
	companyUpsertSchema,
	type CompanyResponse,
	type CompanyUpsertPayload,
} from "@/lib/validations/settings/company";

const withNoStore = (response: NextResponse) => {
	response.headers.set("Cache-Control", "no-store");
	return response;
};

type PgError = {
	code?: string;
	message?: string;
};

const isMissingCompanyTableError = (error: unknown) => {
	if (!error || typeof error !== "object") {
		return false;
	}

	const code = "code" in error ? (error as PgError).code : undefined;
	if (code === "42P01") {
		return true;
	}

	const message =
		"message" in error ? (error as PgError).message?.toLowerCase() : undefined;

	return Boolean(
		message &&
			message.includes('relation "company" does not exist'),
	);
};

const serializeCompany = (record: typeof company.$inferSelect | undefined): CompanyResponse =>
	companyResponseSchema.parse(
		record
			? {
					...record,
					createdAt: record.createdAt.toISOString(),
					updatedAt: record.updatedAt.toISOString(),
			  }
			: null,
	);

export async function GET() {
	const auth = await getCurrentAuth();

	if (!auth || !auth.user) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Niste autorizovani.",
				},
				{ status: 401 },
			),
		);
	}

	try {
		const db = await getDb();
		const [record] = await db
			.select()
			.from(company)
			.where(eq(company.ownerId, auth.user.id))
			.limit(1);

		return withNoStore(NextResponse.json(serializeCompany(record)));
	} catch (error) {
		if (isMissingCompanyTableError(error)) {
			console.warn(
				"[company] Tabela company ne postoji. Vraćam prazan rezultat.",
			);

			return withNoStore(NextResponse.json(serializeCompany(undefined)));
		}

		console.error("[company] Greška prilikom učitavanja podataka:", error);

		return withNoStore(
			NextResponse.json(
				{
					error: "Učitavanje informacija o kompaniji nije uspelo.",
				},
				{ status: 500 },
			),
		);
	}
}

const parsePayload = async (request: NextRequest) => {
	const json = await request.json().catch(() => null);

	if (!json || typeof json !== "object") {
		return {
			success: false as const,
			error: {
				status: 400,
				body: {
					error: "Nevalidan payload.",
				},
			},
		};
	}

	const parsed = companyUpsertSchema.safeParse(json);

	if (!parsed.success) {
		return {
			success: false as const,
			error: {
				status: 400,
				body: {
					error: "Nevalidni podaci.",
					details: parsed.error.flatten(),
				},
			},
		};
	}

	return {
		success: true as const,
		data: parsed.data,
	};
};

const prepareValues = (payload: CompanyUpsertPayload) => {
	const now = new Date();
	return {
		...payload,
		legalName: payload.legalName ?? null,
		registrationNo: payload.registrationNo ?? null,
		taxId: payload.taxId ?? null,
		industry: payload.industry ?? null,
		employees: payload.employees ?? null,
		streetAddress: payload.streetAddress ?? null,
		city: payload.city ?? null,
		zipCode: payload.zipCode ?? null,
		country: payload.country ?? null,
		phone: payload.phone ?? null,
		website: payload.website ?? null,
		logoUrl: payload.logoUrl ?? null,
		faviconUrl: payload.faviconUrl ?? null,
		brandColor: payload.brandColor ?? null,
		description: payload.description ?? null,
		updatedAt: now,
		createdAt: now,
	};
};

export async function PATCH(request: NextRequest) {
	const auth = await getCurrentAuth();

	if (!auth || !auth.user) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Niste autorizovani.",
				},
				{ status: 401 },
			),
		);
	}

	const parsed = await parsePayload(request);

	if (!parsed.success) {
		return withNoStore(NextResponse.json(parsed.error.body, { status: parsed.error.status }));
	}

	const db = await getDb();
	const now = new Date();
	const values = prepareValues(parsed.data);

	try {
		const [existing] = await db
			.select()
			.from(company)
			.where(eq(company.ownerId, auth.user.id))
			.limit(1);

		if (existing) {
			const [updated] = await db
				.update(company)
				.set({
					...values,
					createdAt: existing.createdAt,
					updatedAt: now,
				})
				.where(eq(company.ownerId, auth.user.id))
				.returning();

			return withNoStore(
				NextResponse.json({
					success: true,
					data: serializeCompany(updated),
				}),
			);
		}

		const [created] = await db
			.insert(company)
			.values({
				...values,
				ownerId: auth.user.id,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		return withNoStore(
			NextResponse.json({
				success: true,
				data: serializeCompany(created),
			}),
		);
	} catch (error) {
		if (isMissingCompanyTableError(error)) {
			console.warn(
				"[company] Tabela company ne postoji. Kreiranje nije moguće bez migracija.",
			);
			return withNoStore(
				NextResponse.json(
					{
						error: "Tabela za čuvanje podataka o kompaniji nije kreirana. Pokrenite migracije.",
					},
					{ status: 503 },
				),
			);
		}

		console.error("[company] Greška prilikom čuvanja podataka o kompaniji:", error);
		return withNoStore(
			NextResponse.json(
				{
					error: "Čuvanje informacija o kompaniji nije uspelo.",
				},
				{ status: 500 },
			),
		);
	}
}

