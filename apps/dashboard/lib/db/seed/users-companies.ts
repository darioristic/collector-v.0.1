import { companies, users } from "../schema/core";
import type { DashboardDatabase } from "./seed-runner";
import { eq } from "drizzle-orm";

type UsersCompaniesSeedResult = {
	usersInserted: number;
	companiesInserted: number;
	skipped: number;
};

export async function seedUsersCompanies(
	db: DashboardDatabase,
	options: { force?: boolean } = {},
): Promise<UsersCompaniesSeedResult> {
	let usersInserted = 0;
	let companiesInserted = 0;

	// Get or create default company
	let [company] = await db.select().from(companies).limit(1);

	if (!company) {
		const [newCompany] = await db
			.insert(companies)
			.values({
				name: "Default Company",
				slug: "default-company",
				domain: null,
			})
			.returning();
		company = newCompany;
		companiesInserted = 1;
	}

	// Get employees to create users from
	const { employees } = await import("../schema/employees");
	const existingEmployees = await db
		.select({
			email: employees.email,
			firstName: employees.firstName,
			lastName: employees.lastName,
		})
		.from(employees)
		.limit(3); // Dario, Miha, Tara

	if (existingEmployees.length === 0) {
		return {
			usersInserted: 0,
			companiesInserted: 0,
			skipped: 0,
		};
	}

	// Check existing users
	const existingUsers = await db.select().from(users);
	const existingUserEmails = new Set(
		existingUsers.map((u) => u.email.toLowerCase()),
	);

	if (options.force) {
		// Delete all existing users (except keep company reference)
		await db.delete(users);
		usersInserted = 0;
	}

	const usersToInsert = existingEmployees.filter(
		(emp) => !existingUserEmails.has(emp.email.toLowerCase()),
	);

	if (usersToInsert.length > 0) {
		await db.insert(users).values(
			usersToInsert.map((emp) => ({
				email: emp.email,
				name: `${emp.firstName} ${emp.lastName}`,
				defaultCompanyId: company.id,
			})),
		);
		usersInserted = usersToInsert.length;
	}

	return {
		usersInserted,
		companiesInserted,
		skipped: existingEmployees.length - usersToInsert.length,
	};
}

