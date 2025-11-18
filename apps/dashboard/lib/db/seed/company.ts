import { eq } from "drizzle-orm";
import { companies, company, users } from "../schema/core";
import type { DashboardDatabase } from "./seed-runner";

type CompanySeedResult = {
	inserted: number;
	skipped: number;
};

export async function seedCompany(
	db: DashboardDatabase,
	options: { force?: boolean } = {},
): Promise<CompanySeedResult> {
	// Get default company and first user
	const [defaultCompany] = await db.select().from(companies).limit(1);
	const [firstUser] = await db.select().from(users).limit(1);

	if (!defaultCompany || !firstUser) {
		throw new Error(
			"Company or user not found. Please run 'companies' and 'users' seeds first.",
		);
	}

	// Check if company record already exists
	const existingCompany = await db
		.select()
		.from(company)
		.where(eq(company.ownerId, firstUser.id))
		.limit(1);

	if (existingCompany.length > 0 && !options.force) {
		return {
			inserted: 0,
			skipped: 1,
		};
	}

	if (options.force && existingCompany.length > 0) {
		await db.delete(company).where(eq(company.ownerId, firstUser.id));
	}

	await db.insert(company).values({
		ownerId: firstUser.id,
		name: defaultCompany.name,
		legalName: `${defaultCompany.name} d.o.o.`,
		registrationNo: "12345678",
		taxId: "123456789",
		industry: "Information Technology",
		employees: 50,
		streetAddress: "Bulevar Kralja Aleksandra 1",
		city: "Beograd",
		zipCode: "11000",
		country: "Serbia",
		email: `info@${defaultCompany.domain || "collectorlabs.test"}`,
		phone: "+381 11 123 4567",
		website: `https://${defaultCompany.domain || "collectorlabs.test"}`,
		description: "Leading software development company",
	});

	return {
		inserted: 1,
		skipped: 0,
	};
}
