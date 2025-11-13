import type { Account, AccountContact } from "@crm/types";

import { generateMeta } from "@/lib/utils";
import { ensureResponse, getApiUrl } from "@/src/lib/fetch-utils";
import CompaniesPageClient from "./companies-page-client";
import type { CompanyRow } from "./data-table";

export async function generateMetadata() {
	return generateMeta({
		title: "Companies - Collector Dashboard",
		description:
			"View and manage all company accounts in your CRM with key business information and contacts.",
		canonical: "/accounts/companies",
	});
}

async function getContacts(): Promise<AccountContact[]> {
	const response = await ensureResponse(
		fetch(getApiUrl("accounts/contacts"), {
			cache: "no-store",
			headers: {
				Accept: "application/json",
			},
		}),
	);

	return (await response.json()) as AccountContact[];
}

async function getCompanies(): Promise<CompanyRow[]> {
	const [accounts, contacts] = await Promise.all([
		ensureResponse(
			fetch(getApiUrl("accounts"), {
				cache: "no-store",
				headers: {
					Accept: "application/json",
				},
			}),
		).then((response) => response.json() as Promise<Account[]>),
		getContacts(),
	]);

	const companyContacts = new Map<string, AccountContact[]>();

	contacts.forEach((contact) => {
		const list = companyContacts.get(contact.accountId) ?? [];
		list.push(contact);
		companyContacts.set(contact.accountId, list);
	});

	return accounts
		.filter((account) => {
			const country = account.country?.toLowerCase() ?? "";
			return country !== "netherlands" && country !== "nl";
		})
		.map<CompanyRow>((account) => {
			const relatedContacts = [...(companyContacts.get(account.id) ?? [])].sort(
				(a, b) => {
					const aTime = new Date(a.createdAt).getTime();
					const bTime = new Date(b.createdAt).getTime();
					return aTime - bTime;
				},
			);

			const primaryContact = relatedContacts[0];
			const contactSummaries = relatedContacts.slice(0, 5).map((contact) => ({
				id: contact.id,
				name: contact.fullName ?? contact.name,
				email: contact.email ?? null,
				phone: contact.phone ?? null,
				title: contact.title ?? null,
			}));

			return {
				...account,
				primaryContactName:
					primaryContact?.fullName ?? primaryContact?.name ?? null,
				primaryContactEmail: primaryContact?.email ?? null,
				primaryContactPhone: primaryContact?.phone ?? null,
				contacts: contactSummaries,
			};
		});
}

export default async function Page() {
	let companies: CompanyRow[] = [];
	let error: string | null = null;

	try {
		companies = await getCompanies();
	} catch (err) {
		error = err instanceof Error ? err.message : "Unable to load companies.";
	}

	return <CompaniesPageClient data={companies} error={error} />;
}
