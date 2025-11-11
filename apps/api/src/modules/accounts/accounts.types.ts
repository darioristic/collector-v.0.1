import type {
  Account,
  AccountContact,
  AccountCreateInput,
  AccountType,
  AccountUpdateInput
} from "@crm/types";

export type { Account, AccountContact, AccountCreateInput, AccountType, AccountUpdateInput };

export const ACCOUNT_TYPES = ["customer", "partner", "vendor"] as const;

