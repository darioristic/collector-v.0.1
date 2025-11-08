import type {
  Account,
  AccountCreateInput,
  AccountType,
  AccountUpdateInput
} from "@crm/types";

export type { Account, AccountCreateInput, AccountType, AccountUpdateInput };

export const ACCOUNT_TYPES = ["company", "individual"] as const;

