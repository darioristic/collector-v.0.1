import { randomUUID } from "node:crypto";
import type {
	Account,
	AccountAddress,
	AccountContact,
	AccountCreateInput,
	AccountExecutive,
	AccountMilestone,
	AccountUpdateInput,
} from "@crm/types";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import { db as defaultDb } from "../../db/index.js";
import {
	accountAddresses as accountAddressesTable,
	accountContacts as accountContactsTable,
	accountExecutives as accountExecutivesTable,
	accountMilestones as accountMilestonesTable,
	accounts as accountsTable,
} from "../../db/schema/accounts.schema.js";

/**
 * Interfejs za repozitorijum naloga (accounts).
 *
 * Repozitorijum omogućava CRUD operacije nad klijentskim nalozima i kontaktima.
 * Podržava i Drizzle ORM i in-memory implementacije za testiranje.
 */
export interface AccountWithDetails {
	account: Account;
	addresses: AccountAddress[];
	contacts: AccountContact[];
	executives: AccountExecutive[];
	milestones: AccountMilestone[];
}

export interface AccountsRepository {
	/**
	 * Vraća listu svih naloga sortiranih po datumu kreiranja (najstariji prvi).
	 *
	 * @param search - Opcioni search string za filtriranje po imenu ili email-u
	 * @returns Promise koji se razrešava u niz naloga
	 */
	list(search?: string): Promise<Account[]>;

	/**
	 * Vraća listu svih kontakata povezanih sa nalozima.
	 *
	 * @returns Promise koji se razrešava u niz kontakata sa informacijama o nalozima
	 */
	listContacts(): Promise<AccountContact[]>;

	/**
	 * Pronalazi nalog po ID-u.
	 *
	 * @param id - UUID naloga
	 * @returns Promise koji se razrešava u nalog ili undefined ako nije pronađen
	 */
	findById(id: string): Promise<Account | undefined>;

	/**
	 * Pronalazi nalog po ID-u sa svim povezanim podacima (addresses, contacts, executives, milestones).
	 *
	 * @param id - UUID naloga
	 * @returns Promise koji se razrešava u AccountWithDetails ili undefined ako nije pronađen
	 */
	findByIdWithDetails(id: string): Promise<AccountWithDetails | undefined>;

	/**
	 * Pronalazi nalog po email adresi.
	 *
	 * @param email - Email adresa naloga
	 * @returns Promise koji se razrešava u nalog ili undefined ako nije pronađen
	 */
	findByEmail(email: string): Promise<Account | undefined>;

	/**
	 * Kreira novi nalog.
	 *
	 * @param input - Podaci za kreiranje naloga
	 * @returns Promise koji se razrešava u kreirani nalog
	 * @throws Error ako kreiranje ne uspe
	 */
	create(input: AccountCreateInput): Promise<Account>;

	/**
	 * Ažurira postojeći nalog.
	 *
	 * @param id - UUID naloga
	 * @param input - Podaci za ažuriranje (parcijalni)
	 * @returns Promise koji se razrešava u ažurirani nalog ili undefined ako nije pronađen
	 */
	update(id: string, input: AccountUpdateInput): Promise<Account | undefined>;

	/**
	 * Briše nalog iz sistema.
	 *
	 * @param id - UUID naloga
	 * @returns Promise koji se razrešava u true ako je uspešno obrisan, false inače
	 */
	delete(id: string): Promise<boolean>;
}

type AccountsTableRow = typeof accountsTable.$inferSelect;
type AccountContactsTableRow = typeof accountContactsTable.$inferSelect;
type Database = typeof defaultDb;

const normalizeDate = (value: Date | string): string =>
	value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const normalizeOptional = (value: string | null | undefined): string | null => {
	if (!value) {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
};

const normalizeNumeric = (value: string | null | undefined): string | null => {
	if (!value) {
		return null;
	}
	return value;
};

const mapAccount = (row: AccountsTableRow): Account => ({
	id: row.id,
	name: row.name,
	type: row.type,
	email: row.email,
	phone: normalizeOptional(row.phone),
	website: normalizeOptional(row.website),
	taxId: row.taxId,
	country: row.country,
	legalName: normalizeOptional(row.legalName),
	registrationNumber: normalizeOptional(row.registrationNumber),
	dateOfIncorporation: row.dateOfIncorporation
		? normalizeDate(row.dateOfIncorporation)
		: null,
	industry: normalizeOptional(row.industry),
	numberOfEmployees: row.numberOfEmployees ?? null,
	annualRevenueRange: normalizeOptional(row.annualRevenueRange),
	legalStatus: normalizeOptional(row.legalStatus),
	companyType: normalizeOptional(row.companyType),
	description: normalizeOptional(row.description),
	socialMediaLinks: row.socialMediaLinks as Account["socialMediaLinks"] | null,
	createdAt: normalizeDate(row.createdAt),
	updatedAt: normalizeDate(row.updatedAt),
});

const mapAccountContact = (
	row: AccountContactsTableRow,
	accountName: string | null,
): AccountContact => ({
	id: row.id,
	accountId: row.accountId,
	accountName,
	name: row.name,
	firstName: normalizeOptional(row.firstName),
	lastName: normalizeOptional(row.lastName),
	fullName: normalizeOptional(row.fullName),
	title: normalizeOptional(row.title),
	email: normalizeOptional(row.email),
	phone: normalizeOptional(row.phone),
	ownerId: normalizeOptional(row.ownerId),
	createdAt: normalizeDate(row.createdAt),
	updatedAt: normalizeDate(row.updatedAt),
});

/**
 * Drizzle implementacija AccountsRepository-a.
 *
 * Koristi Drizzle ORM za pristup PostgreSQL bazi podataka.
 * Automatski normalizuje datume i opcione vrednosti.
 */
class DrizzleAccountsRepository implements AccountsRepository {
	/**
	 * Kreira novu instancu DrizzleAccountsRepository-a.
	 *
	 * @param database - Drizzle database instanca (podrazumevano: globalna db)
	 */
	constructor(private readonly database: Database = defaultDb) {}

	async list(search?: string): Promise<Account[]> {
		const whereConditions = [];

		if (search && search.trim().length > 0) {
			const searchPattern = `%${search.trim()}%`;
			whereConditions.push(
				or(
					ilike(accountsTable.name, searchPattern),
					ilike(accountsTable.email, searchPattern),
				),
			);
		}

		let query = this.database.select().from(accountsTable);

		if (whereConditions.length > 0) {
			query = query.where(and(...whereConditions)) as typeof query;
		}

		const rows = await query.orderBy(asc(accountsTable.createdAt));
		return rows.map(mapAccount);
	}

	async listContacts(): Promise<AccountContact[]> {
		const rows = await this.database
			.select({
				contact: accountContactsTable,
				accountName: accountsTable.name,
			})
			.from(accountContactsTable)
			.leftJoin(
				accountsTable,
				eq(accountContactsTable.accountId, accountsTable.id),
			)
			.orderBy(asc(accountContactsTable.createdAt));

		return rows.map(({ contact, accountName }) =>
			mapAccountContact(contact, accountName ?? null),
		);
	}

	async findById(id: string): Promise<Account | undefined> {
		const [row] = await this.database
			.select()
			.from(accountsTable)
			.where(eq(accountsTable.id, id))
			.limit(1);
		return row ? mapAccount(row) : undefined;
	}

	async findByIdWithDetails(
		id: string,
	): Promise<AccountWithDetails | undefined> {
		const account = await this.findById(id);
		if (!account) {
			return undefined;
		}

		const [addresses, contacts, executives, milestones] = await Promise.all([
			this.database
				.select()
				.from(accountAddressesTable)
				.where(eq(accountAddressesTable.accountId, id)),
			this.database
				.select({
					contact: accountContactsTable,
					accountName: accountsTable.name,
				})
				.from(accountContactsTable)
				.leftJoin(
					accountsTable,
					eq(accountContactsTable.accountId, accountsTable.id),
				)
				.where(eq(accountContactsTable.accountId, id)),
			this.database
				.select()
				.from(accountExecutivesTable)
				.where(eq(accountExecutivesTable.accountId, id)),
			this.database
				.select()
				.from(accountMilestonesTable)
				.where(eq(accountMilestonesTable.accountId, id))
				.orderBy(asc(accountMilestonesTable.date)),
		]);

		return {
			account,
			addresses: addresses.map((addr) => ({
				id: addr.id,
				accountId: addr.accountId,
				label: addr.label,
				street: normalizeOptional(addr.street),
				city: normalizeOptional(addr.city),
				state: normalizeOptional(addr.state),
				postalCode: normalizeOptional(addr.postalCode),
				country: normalizeOptional(addr.country),
				latitude: normalizeNumeric(addr.latitude),
				longitude: normalizeNumeric(addr.longitude),
				createdAt: normalizeDate(addr.createdAt),
			})),
			contacts: contacts.map(({ contact, accountName }) =>
				mapAccountContact(contact, accountName ?? null),
			),
			executives: executives.map((exec) => ({
				id: exec.id,
				accountId: exec.accountId,
				name: exec.name,
				title: normalizeOptional(exec.title),
				email: normalizeOptional(exec.email),
				phone: normalizeOptional(exec.phone),
				createdAt: normalizeDate(exec.createdAt),
			})),
			milestones: milestones.map((milestone) => ({
				id: milestone.id,
				accountId: milestone.accountId,
				title: milestone.title,
				description: normalizeOptional(milestone.description),
				date: normalizeDate(milestone.date),
				createdAt: normalizeDate(milestone.createdAt),
			})),
		};
	}

	async findByEmail(email: string): Promise<Account | undefined> {
		const [row] = await this.database
			.select()
			.from(accountsTable)
			.where(eq(accountsTable.email, email))
			.limit(1);
		return row ? mapAccount(row) : undefined;
	}

	async create(input: AccountCreateInput): Promise<Account> {
		const [row] = await this.database
			.insert(accountsTable)
			.values({
				name: input.name,
				type: input.type,
				email: input.email,
				phone: input.phone ?? null,
				website: input.website ?? null,
				taxId: input.taxId,
				country: input.country,
				legalName: input.legalName ?? null,
				registrationNumber: input.registrationNumber ?? null,
				dateOfIncorporation: input.dateOfIncorporation
					? new Date(input.dateOfIncorporation)
					: null,
				industry: input.industry ?? null,
				numberOfEmployees: input.numberOfEmployees ?? null,
				annualRevenueRange: input.annualRevenueRange ?? null,
				legalStatus: input.legalStatus ?? null,
				companyType: input.companyType ?? null,
				description: input.description ?? null,
				socialMediaLinks: input.socialMediaLinks ?? null,
			})
			.returning();

		if (!row) {
			throw new Error("Failed to create account");
		}

		return mapAccount(row);
	}

	async update(
		id: string,
		input: AccountUpdateInput,
	): Promise<Account | undefined> {
		const payload: Partial<typeof accountsTable.$inferInsert> = {
			updatedAt: new Date(),
		};

		if (typeof input.name !== "undefined") {
			payload.name = input.name;
		}

		if (typeof input.type !== "undefined") {
			payload.type = input.type;
		}

		if (typeof input.email !== "undefined") {
			payload.email = input.email;
		}

		if (typeof input.phone !== "undefined") {
			payload.phone = input.phone ?? null;
		}

		if (typeof input.website !== "undefined") {
			payload.website = input.website ?? null;
		}

		if (typeof input.taxId !== "undefined") {
			payload.taxId = input.taxId;
		}

		if (typeof input.country !== "undefined") {
			payload.country = input.country;
		}

		if (typeof input.legalName !== "undefined") {
			payload.legalName = input.legalName ?? null;
		}

		if (typeof input.registrationNumber !== "undefined") {
			payload.registrationNumber = input.registrationNumber ?? null;
		}

		if (typeof input.dateOfIncorporation !== "undefined") {
			payload.dateOfIncorporation = input.dateOfIncorporation
				? new Date(input.dateOfIncorporation)
				: null;
		}

		if (typeof input.industry !== "undefined") {
			payload.industry = input.industry ?? null;
		}

		if (typeof input.numberOfEmployees !== "undefined") {
			payload.numberOfEmployees = input.numberOfEmployees ?? null;
		}

		if (typeof input.annualRevenueRange !== "undefined") {
			payload.annualRevenueRange = input.annualRevenueRange ?? null;
		}

		if (typeof input.legalStatus !== "undefined") {
			payload.legalStatus = input.legalStatus ?? null;
		}

		if (typeof input.companyType !== "undefined") {
			payload.companyType = input.companyType ?? null;
		}

		if (typeof input.description !== "undefined") {
			payload.description = input.description ?? null;
		}

		if (typeof input.socialMediaLinks !== "undefined") {
			payload.socialMediaLinks = input.socialMediaLinks ?? null;
		}

		const [row] = await this.database
			.update(accountsTable)
			.set(payload)
			.where(eq(accountsTable.id, id))
			.returning();

		return row ? mapAccount(row) : undefined;
	}

	async delete(id: string): Promise<boolean> {
		const deleted = await this.database
			.delete(accountsTable)
			.where(eq(accountsTable.id, id))
			.returning();

		return deleted.length > 0;
	}
}

/**
 * Factory funkcija za kreiranje Drizzle AccountsRepository instance.
 *
 * @param database - Opciona database instanca (podrazumevano: globalna db)
 * @returns Nova AccountsRepository instanca
 */
export const createDrizzleAccountsRepository = (
	database?: Database,
): AccountsRepository => new DrizzleAccountsRepository(database);

const inMemoryAccountsSeed = (): Account[] => {
	const now = new Date().toISOString();

	return [
		{
			id: "acc_0001",
			name: "Acme Manufacturing",
			type: "customer",
			email: "contact@acme.example",
			phone: "+1-555-0101",
			taxId: "ACME-0001",
			country: "US",
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "acc_0002",
			name: "Jane Doe",
			type: "vendor",
			email: "jane.doe@example.com",
			phone: "+1-555-0123",
			taxId: "DOE-0002",
			country: "US",
			createdAt: now,
			updatedAt: now,
		},
	];
};

const inMemoryContactsSeed = (): AccountContact[] => {
	const now = new Date().toISOString();

	return [
		{
			id: "ctc_0001",
			accountId: "acc_0001",
			accountName: "Acme Manufacturing",
			name: "Stern Thireau",
			firstName: "Stern",
			lastName: "Thireau",
			fullName: "Stern Thireau",
			title: "Operations Manager",
			email: "sthireau@acme.example",
			phone: "+1-555-1001",
			ownerId: null,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "ctc_0002",
			accountId: "acc_0002",
			accountName: "Jane Doe",
			name: "Ford McKibbin",
			firstName: "Ford",
			lastName: "McKibbin",
			fullName: "Ford McKibbin",
			title: "Project Manager",
			email: "fmckibbin@collect.example",
			phone: "+1-555-1002",
			ownerId: null,
			createdAt: now,
			updatedAt: now,
		},
	];
};

/**
 * Factory funkcija za kreiranje in-memory AccountsRepository instance.
 *
 * Koristi se za testiranje bez potrebe za stvarnom bazom podataka.
 * Inicijalizuje se sa seed podacima.
 *
 * @returns Nova in-memory AccountsRepository instanca sa seed podacima
 */
export const createInMemoryAccountsRepository = (): AccountsRepository => {
	const accountsState: Account[] = inMemoryAccountsSeed();
	const contactsState: AccountContact[] = inMemoryContactsSeed();

	return {
		async list(search?: string) {
			if (!search || search.trim().length === 0) {
				return [...accountsState];
			}

			const searchLower = search.trim().toLowerCase();
			return accountsState.filter(
				(account) =>
					account.name.toLowerCase().includes(searchLower) ||
					account.email.toLowerCase().includes(searchLower),
			);
		},

		async listContacts() {
			return contactsState.map((contact) => ({ ...contact }));
		},

		async findById(id: string) {
			return accountsState.find((account) => account.id === id);
		},

		async findByIdWithDetails(id: string) {
			const account = accountsState.find((a) => a.id === id);
			if (!account) {
				return undefined;
			}
			const addresses: AccountAddress[] = [];
			const contacts = contactsState
				.filter((c) => c.accountId === id)
				.map((c) => ({ ...c }));
			const executives: AccountExecutive[] = [];
			const milestones: AccountMilestone[] = [];
			return { account, addresses, contacts, executives, milestones };
		},

		async findByEmail(email: string) {
			return accountsState.find((account) => account.email === email);
		},

		async create(input: AccountCreateInput) {
			const timestamp = new Date().toISOString();
			const account: Account = {
				id: randomUUID(),
				createdAt: timestamp,
				updatedAt: timestamp,
				...input,
			};

			accountsState.push(account);

			return account;
		},

		async update(id: string, input: AccountUpdateInput) {
			const index = accountsState.findIndex((account) => account.id === id);

			if (index === -1) {
				return undefined;
			}

			const updatedAccount: Account = {
				...accountsState[index],
				...input,
				updatedAt: new Date().toISOString(),
			};

			accountsState[index] = updatedAccount;

			return updatedAccount;
		},

		async delete(id: string) {
			const index = accountsState.findIndex((account) => account.id === id);

			if (index === -1) {
				return false;
			}

			accountsState.splice(index, 1);

			return true;
		},
	};
};
