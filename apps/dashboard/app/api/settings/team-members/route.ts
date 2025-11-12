import { and, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCurrentAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema/core";
import { teamMembers } from "@/lib/db/schema/team-members";
import {
	createTeamMemberSchema,
	listTeamMembersQuerySchema,
	listTeamMembersResponseSchema,
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
	userId: string | null = null,
): TeamMemberApi => ({
	id: member.id,
	firstName: member.firstName,
	lastName: member.lastName,
	email: member.email,
	role: member.role,
	status: member.status as TeamMemberApi["status"],
	avatarUrl: member.avatarUrl,
	userId: userId ?? null,
	createdAt: member.createdAt.toISOString(),
	updatedAt: member.updatedAt.toISOString(),
});

export async function GET(request: NextRequest) {
	let auth: Awaited<ReturnType<typeof getCurrentAuth>>;

	try {
		auth = await getCurrentAuth();
	} catch (error) {
		console.error("[team-members] Error during authentication", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			url: request.url,
		});
		return withNoStore(
			NextResponse.json(
				{
					error: "Greška pri autentifikaciji.",
				},
				{ status: 401 },
			),
		);
	}

	if (!auth || !auth.user) {
		console.error("[team-members] Authentication failed", {
			hasAuth: !!auth,
			hasUser: !!auth?.user,
			url: request.url,
			method: request.method,
		});
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
		console.warn("[team-members] No companyId found for user", {
			userId: auth.user.id,
			email: auth.user.email,
			defaultCompanyId: auth.user.defaultCompanyId,
			company: auth.user.company,
		});
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
		const searchFilter = or(
			ilike(teamMembers.firstName, pattern),
			ilike(teamMembers.lastName, pattern),
			ilike(teamMembers.email, pattern),
		);

		if (searchFilter) {
			filters.push(searchFilter);
		}
	}

	const [initialFilter, ...remainingFilters] = filters as [
		SQL<unknown>,
		...SQL<unknown>[],
	];

	let whereClause: SQL<unknown> = initialFilter;

	for (const filter of remainingFilters) {
		const combined = and(whereClause, filter);
		whereClause = combined ?? whereClause;
	}

	try {
		const rows = await db
			.select()
			.from(teamMembers)
			.where(whereClause)
			.orderBy(desc(teamMembers.updatedAt));

		const emails = rows.map((row) => row.email);
		const userMap = new Map<string, string>();

		if (emails.length > 0) {
			try {
				const userRows = await db
					.select({ id: users.id, email: users.email })
					.from(users)
					.where(inArray(users.email, emails));

				userRows.forEach((user) => {
					userMap.set(user.email.toLowerCase(), user.id);
				});

				console.log(
					`[team-members] Mapped ${userRows.length} users for ${emails.length} team members`,
				);
				console.log(
					"[team-members] User mapping:",
					Array.from(userMap.entries()).map(([email, id]) => ({
						email,
						userId: id,
					})),
				);
			} catch (userError) {
				console.warn(
					"[team-members] Failed to fetch users for team members",
					userError,
				);
			}
		}

		const serializedData = rows.map((member) => {
			const userId = userMap.get(member.email.toLowerCase()) || null;
			if (!userId) {
				console.warn(
					`[team-members] No user found for team member email: ${member.email}`,
				);
			}
			return serializeTeamMember(member, userId);
		});

		try {
			const payload = listTeamMembersResponseSchema.parse({
				data: serializedData,
			});

			return withNoStore(NextResponse.json(payload));
		} catch (validationError) {
			console.error("[team-members] Validation error", validationError);
			console.error("[team-members] Serialized data", {
				count: serializedData.length,
				sample: serializedData[0],
				allData: serializedData,
			});

			const errorMessage =
				validationError instanceof Error
					? validationError.message
					: String(validationError);
			return withNoStore(
				NextResponse.json(
					{
						error: "Greška pri validaciji podataka.",
						details: errorMessage,
					},
					{ status: 500 },
				),
			);
		}
	} catch (error) {
		console.error("[team-members] Error fetching team members", error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;

		return withNoStore(
			NextResponse.json(
				{
					error: "Greška pri učitavanju članova tima.",
					details: errorMessage,
					...(process.env.NODE_ENV === "development" && errorStack
						? { stack: errorStack }
						: {}),
				},
				{ status: 500 },
			),
		);
	}
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
