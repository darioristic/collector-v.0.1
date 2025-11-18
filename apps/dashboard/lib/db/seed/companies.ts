import { companies } from "../schema/core";
import type { DashboardDatabase } from "./seed-runner";

type CompaniesSeedResult = {
	inserted: number;
	skipped: number;
};

const COMPANIES_DATA = [
	{
		name: "Collector Labs",
		slug: "collector-labs",
		domain: "collectorlabs.test",
	},
	{
		name: "TechFirm",
		slug: "techfirm",
		domain: "techfirm.rs",
	},
	{
		name: "Digital Solutions",
		slug: "digital-solutions",
		domain: "digitalsolutions.rs",
	},
];

export async function seedCompanies(
	db: DashboardDatabase,
	options: { force?: boolean } = {},
): Promise<CompaniesSeedResult> {
	if (options.force) {
		await db.delete(companies);
	}

	const existingCompanies = await db
		.select({ slug: companies.slug })
		.from(companies);

	const existingSlugs = new Set(existingCompanies.map((c) => c.slug));

	const companiesToInsert = COMPANIES_DATA.filter(
		(company) => !existingSlugs.has(company.slug),
	);

	if (companiesToInsert.length === 0 && !options.force) {
		return {
			inserted: 0,
			skipped: COMPANIES_DATA.length,
		};
	}

	await db.insert(companies).values(companiesToInsert);

	return {
		inserted: companiesToInsert.length,
		skipped: COMPANIES_DATA.length - companiesToInsert.length,
	};
}
