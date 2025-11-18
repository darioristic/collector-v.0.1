import type { Account } from "@crm/types";

/**
 * Generiše inicijale kompanije za avatar prikaz.
 * Uzima prva 2 slova imena kompanije.
 */
export function getCompanyInitials(name: string): string {
	if (!name || name.trim().length === 0) {
		return "??";
	}

	const words = name.trim().split(/\s+/);
	if (words.length >= 2) {
		return (words[0][0] + words[1][0]).toUpperCase();
	}

	return name.substring(0, 2).toUpperCase();
}

/**
 * Formatira prikaz kompanije za autocomplete.
 * Prikazuje ime i email (ako postoji).
 */
export function formatCompanyDisplay(company: Account): string {
	if (company.email) {
		return `${company.name} (${company.email})`;
	}
	return company.name;
}
