import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { db as defaultDb } from "../../db";
import { accounts as accountsTable } from "../../db/schema/accounts.schema";
import type { Account, AccountCreateInput, AccountUpdateInput } from "./accounts.types";

export interface AccountsRepository {
  list(): Promise<Account[]>;
  findById(id: string): Promise<Account | undefined>;
  findByEmail(email: string): Promise<Account | undefined>;
  create(input: AccountCreateInput): Promise<Account>;
  update(id: string, input: AccountUpdateInput): Promise<Account | undefined>;
  delete(id: string): Promise<boolean>;
}

type AccountsTableRow = typeof accountsTable.$inferSelect;
type Database = typeof defaultDb;

const normalizeDate = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const mapAccount = (row: AccountsTableRow): Account => ({
  id: row.id,
  name: row.name,
  type: row.type,
  email: row.email,
  phone: row.phone ?? null,
  createdAt: normalizeDate(row.createdAt),
  updatedAt: normalizeDate(row.updatedAt)
});

class DrizzleAccountsRepository implements AccountsRepository {
  constructor(private readonly database: Database = defaultDb) {}

  async list(): Promise<Account[]> {
    const rows = await this.database.select().from(accountsTable).orderBy(asc(accountsTable.createdAt));
    return rows.map(mapAccount);
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
        phone: input.phone ?? null
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

const inMemorySeed = (): Account[] => {
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

export const createInMemoryAccountsRepository = (): AccountsRepository => {
  const state: Account[] = inMemorySeed();

  return {
    async list() {
      return [...state];
    },

    async findById(id: string) {
      return state.find((account) => account.id === id);
    },

    async findByEmail(email: string) {
      return state.find((account) => account.email === email);
    },

    async create(input: AccountCreateInput) {
      const timestamp = new Date().toISOString();
      const account: Account = {
        id: randomUUID(),
        createdAt: timestamp,
        updatedAt: timestamp,
        ...input
      };

      state.push(account);

      return account;
    },

    async update(id: string, input: AccountUpdateInput) {
      const index = state.findIndex((account) => account.id === id);

      if (index === -1) {
        return undefined;
      }

      const updatedAccount: Account = {
        ...state[index],
        ...input,
        updatedAt: new Date().toISOString()
      };

      state[index] = updatedAccount;

      return updatedAccount;
    },

    async delete(id: string) {
      const index = state.findIndex((account) => account.id === id);

      if (index === -1) {
        return false;
      }

      state.splice(index, 1);

      return true;
    }
  };
};

