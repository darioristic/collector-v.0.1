// scripts/mock-notifications.ts
// Run: bun run scripts/mock-notifications.ts
//  or: TS_NODE_TRANSPILE_ONLY=1 ts-node scripts/mock-notifications.ts

const BASE_URL = "http://localhost:3000"; // prilagodi po potrebi
const RECIPIENT_ID = "<RECIPIENT_ID>"; // ID korisnika kome šalješ notifikacije
const SESSION_COOKIE = "<SESSION_TOKEN>"; // vrednost auth_session kolačića

type NotificationInput = {
	title: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
	link?: string;
};

const notifications: NotificationInput[] = [
	{
		title: "Nova procedura",
		message: "Pročitaj nove korake u Confluence dokumentu.",
		type: "info",
		link: "/docs/process-update",
	},
	{
		title: "Uspešno kreiran nalog klijenta",
		message: "Klijent „ACME Industries” je dodat u CRM.",
		type: "success",
		link: "/crm/clients/acme",
	},
	{
		title: "Rok ističe sutra",
		message: "Ponuda #Q-104 treba da bude poslata do 16h.",
		type: "warning",
		link: "/sales/quotes/Q-104",
	},
	{
		title: "Greška pri obradi fakture",
		message: "Faktura INV-778 nije prosleđena banci. Proveri logove.",
		type: "error",
		link: "/finance/invoices/INV-778",
	},
	{
		title: "Komentar na projekat",
		message: "Marko je ostavio komentar na projektnoj tabli.",
		type: "info",
		link: "/projects/roadmap",
	},
];

async function main() {
	if (!RECIPIENT_ID || RECIPIENT_ID.startsWith("<")) {
		throw new Error("Postavi RECIPIENT_ID na validan korisnički ID.");
	}
	if (!SESSION_COOKIE || SESSION_COOKIE.startsWith("<")) {
		throw new Error(
			"Postavi SESSION_COOKIE na vrednost auth_session kolačića.",
		);
	}

	for (const payload of notifications) {
		const response = await fetch(`${BASE_URL}/api/notifications/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: `auth_session=${SESSION_COOKIE}`,
			},
			body: JSON.stringify({
				...payload,
				recipientId: RECIPIENT_ID,
			}),
		});

		if (!response.ok) {
			const body = await response.text();
			console.error(
				`❌ Neuspeh (${response.status}) za "${payload.title}": ${body}`,
			);
			continue;
		}

		const json = await response.json();
		console.log(`✅ Poslato: ${payload.title}`, json);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
