import { eq } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { companies } from "../schema/auth.schema";
import { notifications } from "../schema/notifications.schema";
import { users } from "../schema/settings.schema";

type NotificationSeedData = {
	title: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
	link?: string;
	recipientEmail: string;
};

const NOTIFICATIONS_DATA: NotificationSeedData[] = [
	{
		title: "Dobrodošli u Collector Dashboard",
		message: "Vaš nalog je uspešno kreiran. Počnite sa radom!",
		type: "success",
		link: "/dashboard",
		recipientEmail: "dario@collectorlabs.test",
	},
	{
		title: "Novi projekat kreiran",
		message: "Projekat 'Enterprise CRM Implementation' je kreiran.",
		type: "info",
		link: "/projects",
		recipientEmail: "miha@collectorlabs.test",
	},
	{
		title: "Podsetnik: Sastanak sa klijentom",
		message: "Sastanak sa TechCorp Solutions je zakazan za sutra u 14:00.",
		type: "info",
		link: "/calendar",
		recipientEmail: "tara@collectorlabs.test",
	},
	{
		title: "Faktura je poslata",
		message: "Faktura #INV-2024-001 je uspešno poslata klijentu.",
		type: "success",
		link: "/invoices",
		recipientEmail: "dario@collectorlabs.test",
	},
	{
		title: "Nova porudžbina",
		message: "Primljena je nova porudžbina od RetailMax.",
		type: "info",
		link: "/orders",
		recipientEmail: "miha@collectorlabs.test",
	},
	{
		title: "Upozorenje: Niska zaliha",
		message: "Proizvod 'Widget Pro' ima nisku zalihu (5 komada).",
		type: "warning",
		link: "/products",
		recipientEmail: "tara@collectorlabs.test",
	},
	{
		title: "Greška: Neuspešna integracija",
		message: "Integracija sa HubSpot nije uspela. Proverite podešavanja.",
		type: "error",
		link: "/settings/integrations",
		recipientEmail: "dario@collectorlabs.test",
	},
	{
		title: "Novi korisnik je registrovan",
		message: "Korisnik 'Marko Petrović' je uspešno registrovan.",
		type: "success",
		link: "/users",
		recipientEmail: "miha@collectorlabs.test",
	},
	{
		title: "Podsetnik: Mesečni izveštaj",
		message: "Vreme je za generisanje mesečnog izveštaja za decembar.",
		type: "info",
		link: "/reports",
		recipientEmail: "tara@collectorlabs.test",
	},
	{
		title: "Ažuriranje sistema",
		message: "Novo ažuriranje sistema je dostupno. Preporučujemo instalaciju.",
		type: "info",
		link: "/settings",
		recipientEmail: "dario@collectorlabs.test",
	},
	{
		title: "Uspešno plaćanje",
		message: "Plaćanje od klijenta 'TechCorp Solutions' je uspešno primljeno.",
		type: "success",
		link: "/payments",
		recipientEmail: "miha@collectorlabs.test",
	},
	{
		title: "Kritična greška",
		message: "Sistem je detektovao kritičnu grešku u modulu za fakture.",
		type: "error",
		link: "/logs",
		recipientEmail: "dario@collectorlabs.test",
	},
];

export const seedNotifications = async (database = defaultDb): Promise<void> => {
	await database.transaction(async (tx) => {
		// Get default company
		const [company] = await tx
			.select()
			.from(companies)
			.where(eq(companies.slug, "collector-labs"))
			.limit(1);

		if (!company) {
			throw new Error(
				"Company 'collector-labs' not found. Please run 'auth' seed first.",
			);
		}

		// Get existing users
		const existingUsers = await tx
			.select({
				id: users.id,
				email: users.email,
			})
			.from(users);

		const userMap = new Map(
			existingUsers.map((u) => [u.email.toLowerCase(), u.id]),
		);

		// Filter notifications for existing users only
		const notificationsToInsert = NOTIFICATIONS_DATA.filter((notif) =>
			userMap.has(notif.recipientEmail.toLowerCase()),
		);

		if (notificationsToInsert.length === 0) {
			return;
		}

		// Insert notifications
		await tx.insert(notifications).values(
			notificationsToInsert.map((notif) => ({
				title: notif.title,
				message: notif.message,
				type: notif.type,
				link: notif.link || null,
				read: false,
				recipientId: userMap.get(notif.recipientEmail.toLowerCase())!,
				companyId: company.id,
			})),
		);
	});
};

