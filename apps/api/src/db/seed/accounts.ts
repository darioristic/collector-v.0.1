import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { accountContacts, accounts } from "../schema/accounts.schema";

const COMPANY_COUNT = 50;
const COMPANY_ID_OFFSET = 1;
const CONTACT_ID_OFFSET = 201;
const ACCOUNT_TAGS = ["customer", "partner", "vendor"] as const;

const formatSeedUuid = (value: number) => `00000000-0000-0000-0000-${String(value).padStart(12, "0")}`;

const accountsSeedData = Array.from({ length: COMPANY_COUNT }, (_value, index) => {
  const sequence = COMPANY_ID_OFFSET + index;
  const companyId = formatSeedUuid(sequence);
  const label = String(sequence).padStart(2, "0");

  return {
    id: companyId,
    name: `Company ${label}`,
    type: ACCOUNT_TAGS[index % ACCOUNT_TAGS.length],
    email: `company${sequence}@example.com`,
    phone: `+381-60-${String(1000 + sequence).padStart(4, "0")}`,
    website: null,
    taxId: `RS${String(1000000 + sequence).padStart(7, "0")}`,
    country: "RS",
    ownerId: null
  };
});

const contactsSeedData = accountsSeedData.flatMap((company, index) => {
  const primarySequence = CONTACT_ID_OFFSET + index * 2;
  const secondarySequence = primarySequence + 1;

  return [
  {
      id: formatSeedUuid(primarySequence),
      accountId: company.id,
      name: `Primary Contact ${index + 1}`,
      firstName: `Primary${index + 1}`,
      lastName: "Contact",
      fullName: `Primary${index + 1} Contact`,
      title: "Account Manager",
      email: `primary${index + 1}@company${index + 1}.example`,
      phone: `+381-61-${String(2000 + index).padStart(4, "0")}`,
    ownerId: null
  },
  {
      id: formatSeedUuid(secondarySequence),
      accountId: company.id,
      name: `Secondary Contact ${index + 1}`,
      firstName: `Secondary${index + 1}`,
      lastName: "Contact",
      fullName: `Secondary${index + 1} Contact`,
      title: "Operations Lead",
      email: `secondary${index + 1}@company${index + 1}.example`,
      phone: `+381-62-${String(2000 + index).padStart(4, "0")}`,
    ownerId: null
  }
];
});

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
