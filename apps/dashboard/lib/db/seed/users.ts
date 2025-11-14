import { inArray, eq } from "drizzle-orm";
import { employees } from "../schema/employees";
import { companies, users } from "../schema/core";
import type { DashboardDatabase } from "./seed-runner";

type UsersSeedResult = {
	inserted: number;
	skipped: number;
};

export async function seedUsers(
    db: DashboardDatabase,
    options: { force?: boolean } = {},
): Promise<UsersSeedResult> {
    let [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.slug, 'collector-labs'))
        .limit(1);

    if (!company) {
        [company] = await db.select().from(companies).limit(1);
    }

	if (!company) {
		throw new Error(
			"Company not found. Please run 'companies' seed first.",
		);
	}

	// Get all employees
    const allEmployees = await db.select().from(employees);

	if (allEmployees.length === 0) {
		return {
			inserted: 0,
			skipped: 0,
		};
	}

	// Get existing users
	const existingUsers = await db
		.select({ email: users.email })
		.from(users);

	const existingEmails = new Set(
		existingUsers.map((u) => u.email.toLowerCase()),
	);

	// Create users from employees
	const usersToInsert = allEmployees
		.filter((emp) => !existingEmails.has(emp.email.toLowerCase()))
		.map((emp) => ({
			email: emp.email,
			name: `${emp.firstName} ${emp.lastName}`,
			defaultCompanyId: company.id,
		}));

	if (usersToInsert.length === 0 && !options.force) {
		return {
			inserted: 0,
			skipped: allEmployees.length,
		};
	}

	if (options.force) {
		// Delete existing users that match employees
		const employeeEmails = new Set(
			allEmployees.map((e) => e.email.toLowerCase()),
		);
		const usersToDelete = existingUsers.filter((u) =>
			employeeEmails.has(u.email.toLowerCase()),
		);

		if (usersToDelete.length > 0) {
			const emailsToDelete = usersToDelete.map((u) => u.email);
			await db
				.delete(users)
				.where(
					inArray(
						users.email,
						emailsToDelete,
					),
				);
		}
	}

	if (usersToInsert.length > 0) {
		await db.insert(users).values(usersToInsert);
	}

	return {
		inserted: usersToInsert.length,
		skipped: allEmployees.length - usersToInsert.length,
	};
}

