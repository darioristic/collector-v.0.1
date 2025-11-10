import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { accountContacts, accounts } from "../schema/accounts.schema";

const accountsSeedData = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Acme Manufacturing",
    type: "company",
    email: "contact@acme.example",
    phone: "+1-555-0101",
    website: null,
    taxId: "RS0000001",
    country: "RS",
    ownerId: null
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Jane Doe",
    type: "individual",
    email: "jane.doe@example.com",
    phone: "+1-555-0123",
    website: null,
    taxId: "RS0000002",
    country: "RS",
    ownerId: null
  }
];

const contactsSeedData = [
  {
    id: "00000000-0000-0000-0000-000000000201",
    accountId: "00000000-0000-0000-0000-000000000001",
    name: "Stern Thireau",
    firstName: "Stern",
    lastName: "Thireau",
    fullName: "Stern Thireau",
    title: "Operations Manager",
    email: "sthireau@acme.example",
    phone: "+1-555-1001",
    ownerId: null
  },
  {
    id: "00000000-0000-0000-0000-000000000202",
    accountId: "00000000-0000-0000-0000-000000000001",
    name: "Durward Guenther",
    firstName: "Durward",
    lastName: "Guenther",
    fullName: "Durward Guenther",
    title: "Electrical Supervisor",
    email: "dguenther@acme.example",
    phone: "+1-555-1002",
    ownerId: null
  },
  {
    id: "00000000-0000-0000-0000-000000000203",
    accountId: "00000000-0000-0000-0000-000000000002",
    name: "Ford McKibbin",
    firstName: "Ford",
    lastName: "McKibbin",
    fullName: "Ford McKibbin",
    title: "Project Manager",
    email: "fmckibbin@collector.example",
    phone: "+1-555-1003",
    ownerId: null
  }
];

export const seedAccounts = async (database = defaultDb) => {
  await database.transaction(async (tx) => {
    await Promise.all(
      accountsSeedData.map((item) =>
        tx
          .insert(accounts)
          .values(item)
          .onConflictDoUpdate({
            target: accounts.id,
            set: {
              name: item.name,
              type: item.type,
              email: item.email,
              phone: item.phone,
              website: item.website,
              taxId: item.taxId,
              country: item.country,
              ownerId: item.ownerId,
              createdAt: sql`NOW()`,
              updatedAt: sql`NOW()`
            }
          })
      )
    );

    await Promise.all(
      contactsSeedData.map((item) =>
        tx
          .insert(accountContacts)
          .values(item)
          .onConflictDoUpdate({
            target: accountContacts.id,
            set: {
              accountId: item.accountId,
              name: item.name,
              firstName: item.firstName,
              lastName: item.lastName,
              fullName: item.fullName,
              title: item.title,
              email: item.email,
              phone: item.phone,
              ownerId: item.ownerId,
              createdAt: sql`NOW()`,
              updatedAt: sql`NOW()`
            }
          })
      )
    );
  });
};
