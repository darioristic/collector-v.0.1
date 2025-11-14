import { eq } from "drizzle-orm";
import { companies } from "../schema/core";
import { teamMembers } from "../schema/team-members";
import type { DashboardDatabase } from "./seed-runner";

type TeamMemberSeedData = {
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	status: "online" | "offline" | "idle" | "invited";
	avatarUrl?: string;
};

const TEAM_MEMBERS_DATA: TeamMemberSeedData[] = [
  {
    firstName: "Dario",
    lastName: "Ristić",
    email: "dario@collectorlabs.test",
    role: "CEO",
    status: "online",
  },
  {
    firstName: "Miha",
    lastName: "Petrović",
    email: "miha@collectorlabs.test",
    role: "CTO",
    status: "online",
  },
  {
    firstName: "Tara",
    lastName: "Jovanović",
    email: "tara@collectorlabs.test",
    role: "Lead Developer",
    status: "online",
  },
	{
		firstName: "Marko",
		lastName: "Petrović",
		email: "marko.petrovic@techfirm.rs",
		role: "Senior Backend Developer",
		status: "online",
	},
	{
		firstName: "Jovana",
		lastName: "Jovanović",
		email: "jovana.jovanovic@techfirm.rs",
		role: "Backend Developer",
		status: "online",
	},
	{
		firstName: "Stefan",
		lastName: "Nikolić",
		email: "stefan.nikolic@techfirm.rs",
		role: "Backend Developer",
		status: "idle",
	},
	{
		firstName: "Ana",
		lastName: "Marković",
		email: "ana.markovic@techfirm.rs",
		role: "Senior Frontend Developer",
		status: "online",
	},
	{
		firstName: "Nikola",
		lastName: "Đorđević",
		email: "nikola.djordjevic@techfirm.rs",
		role: "Frontend Developer",
		status: "online",
	},
	{
		firstName: "Jelena",
		lastName: "Ilić",
		email: "jelena.ilic@techfirm.rs",
		role: "Frontend Developer",
		status: "offline",
	},
	{
		firstName: "Miloš",
		lastName: "Radović",
		email: "milos.radovic@techfirm.rs",
		role: "DevOps Engineer",
		status: "online",
	},
	{
		firstName: "Sara",
		lastName: "Mladenović",
		email: "sara.mladenovic@techfirm.rs",
		role: "Junior DevOps Engineer",
		status: "online",
	},
	{
		firstName: "Ivana",
		lastName: "Tomić",
		email: "ivana.tomic@techfirm.rs",
		role: "QA Lead",
		status: "online",
	},
	{
		firstName: "Đorđe",
		lastName: "Lazić",
		email: "djordje.lazic@techfirm.rs",
		role: "QA Engineer",
		status: "idle",
	},
	{
		firstName: "Tamara",
		lastName: "Vuković",
		email: "tamara.vukovic@techfirm.rs",
		role: "Senior UI/UX Designer",
		status: "online",
	},
	{
		firstName: "Nemanja",
		lastName: "Stefanović",
		email: "nemanja.stefanovic@techfirm.rs",
		role: "UI Designer",
		status: "offline",
	},
	{
		firstName: "Marija",
		lastName: "Kostić",
		email: "marija.kostic@techfirm.rs",
		role: "Product Manager",
		status: "online",
	},
	{
		firstName: "Vladimir",
		lastName: "Milić",
		email: "vladimir.milic@techfirm.rs",
		role: "Associate Product Manager",
		status: "online",
	},
	{
		firstName: "Snežana",
		lastName: "Pavlović",
		email: "snezana.pavlovic@techfirm.rs",
		role: "HR Manager",
		status: "online",
	},
	{
		firstName: "Bojan",
		lastName: "Janković",
		email: "bojan.jankovic@techfirm.rs",
		role: "HR Specialist",
		status: "idle",
	},
	{
		firstName: "Katarina",
		lastName: "Ristić",
		email: "katarina.ristic@techfirm.rs",
		role: "Marketing Manager",
		status: "online",
	},
	{
		firstName: "Aleksandar",
		lastName: "Mitić",
		email: "aleksandar.mitic@techfirm.rs",
		role: "Digital Marketing Specialist",
		status: "offline",
	},
	{
		firstName: "Dragana",
		lastName: "Stanković",
		email: "dragana.stankovic@techfirm.rs",
		role: "Sales Manager",
		status: "online",
	},
	{
		firstName: "Marko",
		lastName: "Đukić",
		email: "marko.djukic@techfirm.rs",
		role: "Sales Representative",
		status: "online",
	},
	{
		firstName: "Jovana",
		lastName: "Novaković",
		email: "jovana.novakovic@techfirm.rs",
		role: "Support Team Lead",
		status: "online",
	},
	{
		firstName: "Stefan",
		lastName: "Milosavljević",
		email: "stefan.milosavljevic@techfirm.rs",
		role: "Customer Support Specialist",
		status: "invited",
	},
];

type TeamMembersSeedResult = {
	inserted: number;
	skipped: number;
};

export async function seedTeamMembers(
  db: DashboardDatabase,
  options: { force?: boolean } = {},
): Promise<TeamMembersSeedResult> {
  let [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, 'collector-labs'))
    .limit(1);

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
  }

	if (options.force) {
		await db.delete(teamMembers).where(eq(teamMembers.companyId, company.id));
	}

	const existingMembers = await db
		.select({ email: teamMembers.email })
		.from(teamMembers)
		.where(eq(teamMembers.companyId, company.id));

	const existingEmails = new Set(
		existingMembers.map((m) => m.email.toLowerCase()),
	);

	const membersToInsert = TEAM_MEMBERS_DATA.filter(
		(member) => !existingEmails.has(member.email.toLowerCase()),
	);

	if (membersToInsert.length === 0 && !options.force) {
		return {
			inserted: 0,
			skipped: TEAM_MEMBERS_DATA.length,
		};
	}

	await db.insert(teamMembers).values(
		membersToInsert.map((member) => ({
			firstName: member.firstName,
			lastName: member.lastName,
			email: member.email,
			role: member.role,
			status: member.status,
			avatarUrl: member.avatarUrl ?? null,
			companyId: company.id,
		})),
	);

	return {
		inserted: membersToInsert.length,
		skipped: TEAM_MEMBERS_DATA.length - membersToInsert.length,
	};
}
