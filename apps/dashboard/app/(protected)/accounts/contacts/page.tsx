import type { AccountContact } from "@crm/types";

import { generateMeta } from "@/lib/utils";

import ContactsPageClient from "./contacts-page-client";
import type { Contact } from "./data-table";

export async function generateMetadata() {
	return generateMeta({
		title: "Contacts - Collector Dashboard",
		description:
			"Manage contacts and quickly access their related companies with a TanStack Table experience built with Tailwind CSS, shadcn/ui, and Next.js.",
		canonical: "/accounts/contacts",
	});
}

async function getContacts(): Promise<AccountContact[]> {
	if (!process.env.COLLECTOR_API_URL) {
		throw new Error("Environment variable COLLECTOR_API_URL is not defined.");
	}

	const response = await fetch(
		`${process.env.COLLECTOR_API_URL}/api/accounts/contacts`,
		{
			cache: "no-store",
			headers: {
				Accept: "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`API responded with status ${response.status}.`);
	}

	return (await response.json()) as AccountContact[];
}

export default async function Page() {
	let contacts: Contact[] = [];
	let error: string | null = null;

	try {
		contacts = await getContacts();
	} catch (err) {
		error = err instanceof Error ? err.message : "Unable to load contacts.";
	}

	return <ContactsPageClient data={contacts} error={error} />;
}
