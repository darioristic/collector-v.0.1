import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { db as defaultDb } from "../../db";
import {
  accountContacts as accountContactsTable,
  accounts as accountsTable
} from "../../db/schema/accounts.schema";
import type { Account, AccountContact, AccountCreateInput, AccountUpdateInput } from "./accounts.types";

export interface AccountsRepository {
  list(): Promise<Account[]>;
  listContacts(): Promise<AccountContact[]>;
  findById(id: string): Promise<Account | undefined>;
  findByEmail(email: string): Promise<Account | undefined>;
  create(input: AccountCreateInput): Promise<Account>;
  update(id: string, input: AccountUpdateInput): Promise<Account | undefined>;
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

const mapAccount = (row: AccountsTableRow): Account => ({
  id: row.id,
  name: row.name,
  type: row.type,
  email: row.email,
  phone: normalizeOptional(row.phone),
  website: normalizeOptional(row.website),
  taxId: row.taxId,
  country: row.country,
  createdAt: normalizeDate(row.createdAt),
  updatedAt: normalizeDate(row.updatedAt)
});

const mapAccountContact = (row: AccountContactsTableRow, accountName: string | null): AccountContact => ({
  id: row.id,
  accountId: row.accountId,
  accountName,
  name: row.name,
  firstName: normalizeOptional(row.firstName),
  lastName: normalizeOptional(row.lastName),
  title: normalizeOptional(row.title),
  email: normalizeOptional(row.email),
  phone: normalizeOptional(row.phone),
  ownerId: normalizeOptional(row.ownerId),
  createdAt: normalizeDate(row.createdAt),
  updatedAt: normalizeDate(row.updatedAt)
});

class DrizzleAccountsRepository implements AccountsRepository {
  constructor(private readonly database: Database = defaultDb) {}

  async list(): Promise<Account[]> {
    const rows = await this.database.select().from(accountsTable).orderBy(asc(accountsTable.createdAt));
    return rows.map(mapAccount);
  }

  async listContacts(): Promise<AccountContact[]> {
    const rows = await this.database
      .select({
        contact: accountContactsTable,
        accountName: accountsTable.name
      })
      .from(accountContactsTable)
      .leftJoin(accountsTable, eq(accountContactsTable.accountId, accountsTable.id))
      .orderBy(asc(accountContactsTable.createdAt));

    return rows.map(({ contact, accountName }) => mapAccountContact(contact, accountName ?? null));
  }

  async findById(id: string): Promise<Account | undefined> {
    const [row] = await this.database.select().from(accountsTable).where(eq(accountsTable.id, id)).limit(1);
    return row ? mapAccount(row) : undefined;
  }

  async findByEmail(email: string): Promise<Account | undefined> {
    const [row] = await this.database.select().from(accountsTable).where(eq(accountsTable.email, email)).limit(1);
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
        country: input.country
      })
      .returning();

    if (!row) {
      throw new Error("Failed to create account");
    }

    return mapAccount(row);
  }

  async update(id: string, input: AccountUpdateInput): Promise<Account | undefined> {
    const payload: Partial<typeof accountsTable.$inferInsert> = {
      updatedAt: new Date()
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

    const [row] = await this.database
      .update(accountsTable)
      .set(payload)
      .where(eq(accountsTable.id, id))
      .returning();

    return row ? mapAccount(row) : undefined;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.database.delete(accountsTable).where(eq(accountsTable.id, id)).returning({
      id: accountsTable.id
    });

    return deleted.length > 0;
  }
}

export const createDrizzleAccountsRepository = (database?: Database): AccountsRepository =>
  new DrizzleAccountsRepository(database);

const inMemoryAccountsSeed = (): Account[] => {
  const now = new Date().toISOString();

  return [
    {
      id: "acc_0001",
      name: "Acme Manufacturing",
      type: "company",
      email: "contact@acme.example",
      phone: "+1-555-0101",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "acc_0002",
      name: "Jane Doe",
      type: "individual",
      email: "jane.doe@example.com",
      phone: "+1-555-0123",
      createdAt: now,
      updatedAt: now
    }
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
      title: "Operations Manager",
      email: "sthireau@acme.example",
      phone: "+1-555-1001",
      ownerId: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "ctc_0002",
      accountId: "acc_0002",
      accountName: "Jane Doe",
      name: "Ford McKibbin",
      firstName: "Ford",
      lastName: "McKibbin",
      title: "Project Manager",
      email: "fmckibbin@collect.example",
      phone: "+1-555-1002",
      ownerId: null,
      createdAt: now,
      updatedAt: now
    }
  ];
};

export const createInMemoryAccountsRepository = (): AccountsRepository => {
  const accountsState: Account[] = inMemoryAccountsSeed();
  const contactsState: AccountContact[] = inMemoryContactsSeed();

  return {
    async list() {
      return [...accountsState];
    },

    async listContacts() {
      return contactsState.map((contact) => ({ ...contact }));
    },

    async findById(id: string) {
      return accountsState.find((account) => account.id === id);
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
        ...input
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
        updatedAt: new Date().toISOString()
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
    }
  };
};

