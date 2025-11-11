import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { getCurrentAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema/team-members";
import {
	createTeamMemberSchema,
	listTeamMembersQuerySchema,
	listTeamMembersResponseSchema,
	teamMemberApiSchema,
	type TeamMemberApi,
} from "@/lib/validations/settings/team-members";

const withNoStore = (response: NextResponse) => {
	response.headers.set("Cache-Control", "no-store");
	return response;
};

const isUuid = (value: string | null | undefined): value is string =>
	typeof value === "string"
		? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
				value,
			)
		: false;

const resolveCompanyId = (
	auth: Awaited<ReturnType<typeof getCurrentAuth>>,
): string | null => {
	if (!auth || !auth.user) {
		return null;
	}

	const candidate = auth.user.company?.id ?? auth.user.defaultCompanyId ?? null;
	return isUuid(candidate) ? candidate : null;
};

type PgError = Error & {
	code?: string;
};

const isUniqueViolation = (error: unknown): error is PgError =>
	Boolean(error) &&
	typeof error === "object" &&
	"code" in (error as PgError) &&
	(error as PgError).code === "23505";

const serializeTeamMember = (
	member: typeof teamMembers.$inferSelect,
): TeamMemberApi =>
	teamMemberApiSchema.parse({
		id: member.id,
		firstName: member.firstName,
		lastName: member.lastName,
		email: member.email,
		role: member.role,
		status: member.status,
		avatarUrl: member.avatarUrl,
		createdAt: member.createdAt.toISOString(),
		updatedAt: member.updatedAt.toISOString(),
	});

export async function GET(request: NextRequest) {
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

	const companyId = resolveCompanyId(auth);

	if (!companyId) {
		return withNoStore(
			NextResponse.json({
				data: [],
			}),
		);
	}

	const db = await getDb();
	const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
	const parsed = listTeamMembersQuerySchema.safeParse(rawParams);

	if (!parsed.success) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Nevalidni parametri.",
					details: parsed.error.flatten(),
				},
				{ status: 400 },
			),
		);
	}

	const { search, status } = parsed.data;
	const filters: SQL<unknown>[] = [eq(teamMembers.companyId, companyId)];

	if (status) {
		filters.push(eq(teamMembers.status, status));
	}

	if (search) {
		const pattern = `%${search.trim()}%`;
		filters.push(
			or(
				ilike(teamMembers.firstName, pattern),
				ilike(teamMembers.lastName, pattern),
				ilike(teamMembers.email, pattern),
			)!,
		);
	}

	const baseQuery = db.select().from(teamMembers);
	const filteredQuery =
		filters.length === 1
			? baseQuery.where(filters[0]!)
			: filters.length > 1
				? baseQuery.where(and(...filters))
				: baseQuery;

	const rows = await filteredQuery.orderBy(desc(teamMembers.updatedAt));

	const payload = listTeamMembersResponseSchema.parse({
		data: rows.map(serializeTeamMember),
	});

	return withNoStore(NextResponse.json(payload));
}

export async function POST(request: NextRequest) {
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

	const companyId = resolveCompanyId(auth);

	if (!companyId) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Aktivna kompanija nije pronađena.",
				},
				{ status: 400 },
			),
		);
	}

	const db = await getDb();
	const json = await request.json().catch(() => null);

	if (!json || typeof json !== "object") {
		return withNoStore(
			NextResponse.json(
				{
					error: "Nevalidan payload.",
				},
				{ status: 400 },
			),
		);
	}

	const parsed = createTeamMemberSchema.safeParse(json);

	if (!parsed.success) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Nevalidni podaci.",
					details: parsed.error.flatten(),
				},
				{ status: 400 },
			),
		);
	}

	const values = parsed.data;
	const now = new Date();

	try {
		const [member] = await db
			.insert(teamMembers)
			.values({
				firstName: values.firstName,
				lastName: values.lastName,
				email: values.email,
				role: values.role,
				status: values.status ?? "invited",
				avatarUrl: values.avatarUrl ?? null,
				companyId,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		console.info(
			"[team-members][invite]",
			`Invitation placeholder generated for ${member.email} (company: ${companyId}).`,
		);

		return withNoStore(
			NextResponse.json(
				{
					data: serializeTeamMember(member),
				},
				{ status: 201 },
			),
		);
	} catch (error) {
		if (isUniqueViolation(error)) {
			return withNoStore(
				NextResponse.json(
					{
						error: "Član tima sa ovom e-mail adresom već postoji.",
					},
					{ status: 409 },
				),
			);
		}

		console.error("[team-members] Failed to create", error);
		return withNoStore(
			NextResponse.json(
				{
					error: "Kreiranje člana tima nije uspelo.",
				},
				{ status: 500 },
			),
		);
	}
}
