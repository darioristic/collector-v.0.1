import { eq } from "drizzle-orm";
import { companies, notifications, users } from "../schema/core";
import type { DashboardDatabase } from "./seed-runner";

type NotificationSeedData = {
	title: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
	link?: string;
	recipientEmail?: string;
};

const NOTIFICATIONS_DATA: NotificationSeedData[] = [
	{
		title: "Dobrodošli u Collector Dashboard",
		message: "Vaš nalog je uspešno kreiran. Počnite sa radom!",
		type: "success",
		link: "/dashboard",
	},
	{
		title: "Novi projekat kreiran",
		message: "Projekat 'Enterprise CRM Implementation' je kreiran.",
		type: "info",
		link: "/projects",
	},
	{
		title: "Podsetnik: Sastanak sa klijentom",
		message: "Sastanak sa TechCorp Solutions je zakazan za sutra u 14:00.",
		type: "info",
		link: "/calendar",
	},
	{
		title: "Faktura je poslata",
		message: "Faktura #INV-2024-001 je uspešno poslata klijentu.",
		type: "success",
		link: "/invoices",
	},
	{
		title: "Nova porudžbina",
		message: "Primljena je nova porudžbina od RetailMax.",
		type: "info",
		link: "/orders",
	},
	{
		title: "Upozorenje: Niska zaliha",
		message: "Proizvod 'Widget Pro' ima nisku zalihu (5 komada).",
		type: "warning",
		link: "/products",
	},
	{
		title: "Greška: Neuspešna integracija",
		message: "Integracija sa HubSpot nije uspela. Proverite podešavanja.",
		type: "error",
		link: "/settings/integrations",
	},
	{
		title: "Novi korisnik je registrovan",
		message: "Korisnik 'Marko Petrović' je uspešno registrovan.",
		type: "success",
		link: "/users",
	},
	{
		title: "Podsetnik: Mesečni izveštaj",
		message: "Vreme je za generisanje mesečnog izveštaja za decembar.",
		type: "info",
		link: "/reports",
	},
	{
		title: "Ažuriranje sistema",
		message: "Novo ažuriranje sistema je dostupno. Preporučujemo instalaciju.",
		type: "info",
		link: "/settings",
	},
	{
		title: "Uspešno plaćanje",
		message: "Plaćanje od klijenta 'TechCorp Solutions' je uspešno primljeno.",
		type: "success",
		link: "/payments",
	},
	{
		title: "Kritična greška",
		message: "Sistem je detektovao kritičnu grešku u modulu za fakture.",
		type: "error",
		link: "/logs",
	},
	{
		title: "Novi deal je kreiran",
		message:
			"Deal 'E-commerce Platform Development' je kreiran sa vrednošću od $95,000.",
		type: "success",
		link: "/crm/deals",
	},
	{
		title: "Podsetnik: Follow-up sa klijentom",
		message: "Vreme je za follow-up sa klijentom 'DataFlow Inc'.",
		type: "info",
		link: "/crm",
	},
	{
		title: "Projekat je završen",
		message: "Projekat 'Security Audit & Implementation' je uspešno završen.",
		type: "success",
		link: "/projects",
	},
	{
		title: "Zahtev za odmor",
		message: "Vaš zahtev za odmor je odobren.",
		type: "success",
		link: "/hr/time-off",
	},
	{
		title: "Nova poruka u timu",
		message: "Imate novu poruku u kanalu #general.",
		type: "info",
		link: "/apps/chat",
	},
	{
		title: "Ažuriranje profila",
		message: "Vaš profil je uspešno ažuriran.",
		type: "success",
		link: "/settings/profile",
	},
	{
		title: "Backup je završen",
		message: "Dnevni backup baze podataka je uspešno završen.",
		type: "success",
		link: "/settings/backups",
	},
];

type NotificationsSeedResult = {
	inserted: number;
	skipped: number;
};

export async function seedNotifications(
	db: DashboardDatabase,
	options: { force?: boolean } = {},
): Promise<NotificationsSeedResult> {
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
	}

	// Get all users
	const allUsers = await db.select().from(users);

	if (allUsers.length === 0) {
		return {
			inserted: 0,
			skipped: NOTIFICATIONS_DATA.length,
		};
	}

	if (options.force) {
		await db
			.delete(notifications)
			.where(eq(notifications.companyId, company.id));
	}

	// Distribute notifications across users
	const notificationsToInsert = [];

	for (let i = 0; i < NOTIFICATIONS_DATA.length; i++) {
		const notif = NOTIFICATIONS_DATA[i];
		const user = allUsers[i % allUsers.length]; // Round-robin distribution

		notificationsToInsert.push({
			title: notif.title,
			message: notif.message,
			type: notif.type,
			link: notif.link ?? null,
			read: false,
			recipientId: user.id,
			companyId: company.id,
		});
	}

	// Check existing notifications to avoid duplicates
	const existingNotifications = await db
		.select({
			title: notifications.title,
			recipientId: notifications.recipientId,
		})
		.from(notifications)
		.where(eq(notifications.companyId, company.id));

	const existingKeys = new Set(
		existingNotifications.map((n) => `${n.title}-${n.recipientId}`),
	);

	const filteredNotifications = notificationsToInsert.filter(
		(n) => !existingKeys.has(`${n.title}-${n.recipientId}`),
	);

	if (filteredNotifications.length === 0 && !options.force) {
		return {
			inserted: 0,
			skipped: NOTIFICATIONS_DATA.length,
		};
	}

	if (filteredNotifications.length > 0) {
		await db.insert(notifications).values(filteredNotifications);
	}

	return {
		inserted: filteredNotifications.length,
		skipped: NOTIFICATIONS_DATA.length - filteredNotifications.length,
	};
}
