import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import { employees } from "@/lib/db/schema/employees";
import { companies, teamchatUsers } from "@/lib/db/schema/teamchat";
import { setSessionCookie } from "../_utils";

type LoginBody = {
	email: string;
	password: string;
};

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dana

// Generate session token
const generateSessionToken = (): string => {
	return randomBytes(32).toString("hex");
};

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json().catch(() => null)) as LoginBody | null;

		if (!body || !body.email || !body.password) {
			return NextResponse.json(
				{
					statusCode: 400,
					error: "INVALID_BODY",
					message: "Email i lozinka su obavezni.",
				},
				{ status: 400 },
			);
		}

		const db = await getDb();

		// Find employee by email
		const [employee] = await db
			.select()
			.from(employees)
			.where(eq(employees.email, body.email.toLowerCase().trim()))
			.limit(1);

		if (!employee) {
			return NextResponse.json(
				{
					statusCode: 401,
					error: "INVALID_CREDENTIALS",
					message: "Neispravan email ili lozinka.",
				},
				{ status: 401 },
			);
		}

		// Check if employee is active
		if (employee.status !== "Active") {
			return NextResponse.json(
				{
					statusCode: 403,
					error: "EMPLOYEE_INACTIVE",
					message: "Vaš nalog nije aktivan. Kontaktirajte administratora.",
				},
				{ status: 403 },
			);
		}

		// Check if password is set
		if (!employee.hashedPassword || employee.hashedPassword === "") {
			return NextResponse.json(
				{
					statusCode: 401,
					error: "PASSWORD_NOT_SET",
					message: "Lozinka nije postavljena. Kontaktirajte administratora.",
				},
				{ status: 401 },
			);
		}

		// Verify password
		const passwordMatch = await compare(body.password, employee.hashedPassword);

		if (!passwordMatch) {
			return NextResponse.json(
				{
					statusCode: 401,
					error: "INVALID_CREDENTIALS",
					message: "Neispravan email ili lozinka.",
				},
				{ status: 401 },
			);
		}

		// Get or create company (default company for employees)
		let [company] = await db
			.select()
			.from(companies)
			.limit(1);

		if (!company) {
			// Create default company if it doesn't exist
			const [newCompany] = await db
				.insert(companies)
				.values({
					name: "Default Company",
					slug: "default-company",
					domain: null,
				})
				.returning();
			company = newCompany;
		}

		// Get or create teamchat user
		let [teamchatUser] = await db
			.select()
			.from(teamchatUsers)
			.where(eq(teamchatUsers.email, employee.email))
			.limit(1);

		if (!teamchatUser) {
			// Create teamchat user from employee
			const displayName = `${employee.firstName} ${employee.lastName}`;
			const [newTeamchatUser] = await db
				.insert(teamchatUsers)
				.values({
					firstName: employee.firstName,
					lastName: employee.lastName,
					displayName,
					email: employee.email,
					companyId: company.id,
					status: "online",
				})
				.returning();
			teamchatUser = newTeamchatUser;
		}

		// Generate session
		const sessionToken = generateSessionToken();
		const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

		// TODO: Store session in database (create sessions table if needed)
		// For now, we'll just return the session token

		const response = NextResponse.json(
			{
				data: {
					user: {
						id: employee.id.toString(),
						email: employee.email,
						name: `${employee.firstName} ${employee.lastName}`,
						firstName: employee.firstName,
						lastName: employee.lastName,
						status: "active",
						defaultCompanyId: company.id,
						company: {
							id: company.id,
							name: company.name,
							slug: company.slug,
							domain: company.domain,
							role: null,
						},
					},
					session: {
						token: sessionToken,
						expiresAt: expiresAt.toISOString(),
					},
				},
			},
			{ status: 200 },
		);

		setSessionCookie(response, {
			token: sessionToken,
			expiresAt: expiresAt.toISOString(),
		});

		return response;
	} catch (error) {
		console.error("[employees-login] Error:", error);
		return NextResponse.json(
			{
				statusCode: 500,
				error: "INTERNAL_ERROR",
				message: "Došlo je do greške prilikom prijave.",
			},
			{ status: 500 },
		);
	}
}

