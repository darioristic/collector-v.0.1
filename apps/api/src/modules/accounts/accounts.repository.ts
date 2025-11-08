import { randomUUID } from "node:crypto";

import type { Account, AccountCreateInput, AccountUpdateInput } from "./accounts.types";

export interface AccountsRepository {
  list(): Promise<Account[]>;
  findById(id: string): Promise<Account | undefined>;
  findByEmail(email: string): Promise<Account | undefined>;
  create(input: AccountCreateInput): Promise<Account>;
  update(id: string, input: AccountUpdateInput): Promise<Account | undefined>;
  delete(id: string): Promise<boolean>;
}

const now = () => new Date().toISOString();

const seedAccounts = (): Account[] => [
  {
    id: "acc_001",
    name: "Acme Manufacturing",
    type: "company",
    email: "contact@acme.example",
    phone: "+1-555-0101",
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: "acc_002",
    name: "Jane Doe",
    type: "individual",
    email: "jane.doe@example.com",
    phone: "+1-555-0123",
    createdAt: now(),
    updatedAt: now()
  }
];

export const createInMemoryAccountsRepository = (): AccountsRepository => {
  const accounts: Account[] = seedAccounts();

  return {
    async list() {
      return [...accounts];
    },

    async findById(id) {
      return accounts.find((account) => account.id === id);
    },

    async findByEmail(email) {
      return accounts.find((account) => account.email === email);
    },

    async create(input) {
      const timestamp = now();
      const account: Account = {
        id: `acc_${randomUUID()}`,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...input
      };

      accounts.push(account);

      return account;
    },

    async update(id, input) {
      const index = accounts.findIndex((account) => account.id === id);

      if (index === -1) {
        return undefined;
      }

      const updatedAccount: Account = {
        ...accounts[index],
        ...input,
        updatedAt: now()
      };

      accounts[index] = updatedAccount;

      return updatedAccount;
    },

    async delete(id) {
      const index = accounts.findIndex((account) => account.id === id);

      if (index === -1) {
        return false;
      }

      accounts.splice(index, 1);

      return true;
    }
  };
};

