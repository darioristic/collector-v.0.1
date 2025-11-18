import type { CompanyRow } from "../data-table";

/**
 * Helper funkcije za rad sa company podacima
 * Izdvojene iz data-table.tsx za bolju organizaciju i ponovnu upotrebu
 */

const BLOCKED_COUNTRIES = new Set(["netherlands", "nl"]);

/**
 * Normalizuje country string za poređenje
 */
export const normalizeCountry = (country?: string | null): string =>
	country?.trim().toLowerCase() ?? "";

/**
 * Proverava da li kompanija treba da bude sakrivena na osnovu zemlje
 */
export const shouldHideCompany = (country?: string | null): boolean =>
	BLOCKED_COUNTRIES.has(normalizeCountry(country));

/**
 * Formatira tag vrednost za prikaz
 */
export const formatTag = (value: CompanyRow["type"]): string => {
	if (!value) {
		return "";
	}
	return value.charAt(0).toUpperCase() + value.slice(1);
};

/**
 * Generiše registration number za kompaniju
 * Optimizovano: izračunava se jednom i može se sačuvati u objektu
 */
export const getCompanyRegistrationNumber = (company: CompanyRow): string => {
	const taxIdNumericPart = company.taxId?.replace(/\D/g, "") ?? "";

	if (taxIdNumericPart.length > 0) {
		const suffix = taxIdNumericPart.slice(-4);
		return `REG-${suffix.padStart(4, "0")}`;
	}

	const idSuffix = (company.id.split("-").pop() ?? company.id).replace(
		/\D/g,
		"",
	);
	const fallback = idSuffix.slice(-4);
	return `REG-${fallback.padStart(4, "0")}`;
};

/**
 * Generiše searchable text za kompaniju
 * Optimizovano: pre-izračunava se pri učitavanju podataka
 */
export const getCompanySearchableText = (company: CompanyRow): string => {
	const registrationNumber = getCompanyRegistrationNumber(company);

	return [
		company.name,
		company.email ?? "",
		company.phone ?? "",
		company.taxId,
		registrationNumber,
		company.primaryContactName ?? "",
		company.primaryContactEmail ?? "",
		company.primaryContactPhone ?? "",
		company.country,
		company.type,
	]
		.join(" ")
		.toLowerCase();
};

/**
 * Prošireni CompanyRow sa pre-izračunatim vrednostima
 * Koristi se za optimizaciju performansi
 */
export type EnhancedCompanyRow = CompanyRow & {
	searchableText: string;
	registrationNumber: string;
};

/**
 * Transformiše CompanyRow u EnhancedCompanyRow sa pre-izračunatim vrednostima
 * Koristi se za optimizaciju search i display operacija
 */
export const enhanceCompanyRow = (company: CompanyRow): EnhancedCompanyRow => ({
	...company,
	searchableText: getCompanySearchableText(company),
	registrationNumber: getCompanyRegistrationNumber(company),
});

/**
 * Transformiše niz CompanyRow u EnhancedCompanyRow
 * Batch operacija za optimizaciju
 */
export const enhanceCompanyRows = (
	companies: CompanyRow[],
): EnhancedCompanyRow[] => companies.map(enhanceCompanyRow);
