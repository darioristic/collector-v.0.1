import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { accountContacts, accounts } from "../schema/accounts.schema";

const COMPANY_COUNT = 50;
const COMPANY_ID_OFFSET = 1;
const CONTACT_ID_OFFSET = 201;
const ACCOUNT_TAGS = ["customer", "partner", "vendor"] as const;

const formatSeedUuid = (value: number) => `00000000-0000-0000-0000-${String(value).padStart(12, "0")}`;

const REAL_COMPANIES: { name: string; domain: string }[] = [
  { name: "Collector Labs", domain: "collectorlabs.test" },
  { name: "Nordeus", domain: "nordeus.com" },
  { name: "Seven Bridges", domain: "sevenbridges.com" },
  { name: "Telekom Srbija", domain: "mts.rs" },
  { name: "Comtrade", domain: "comtrade.com" },
  { name: "Endava", domain: "endava.com" },
  { name: "Levi9", domain: "levi9.com" },
  { name: "Vega IT", domain: "vegait.rs" },
  { name: "Quantox", domain: "quantox.com" },
  { name: "Schneider Electric Serbia", domain: "se.com" }
];

const accountsSeedData = Array.from({ length: COMPANY_COUNT }, (_value, index) => {
  const sequence = COMPANY_ID_OFFSET + index;
  const companyId = formatSeedUuid(sequence);
  const real = REAL_COMPANIES[index] ?? null;
  const companyName = real ? real.name : faker.company.name();
  const domain = real ? real.domain : faker.internet.domainName();

  return {
    id: companyId,
    name: companyName,
    type: ACCOUNT_TAGS[index % ACCOUNT_TAGS.length],
    email: `info@${domain}`,
    phone: faker.phone.number({ style: "international" }),
    website: `https://${domain}`,
    taxId: `RS${faker.number.int({ min: 1000000, max: 9999999 })}`,
    country: "RS",
    ownerId: null
  };
});

const contactsSeedData = accountsSeedData.flatMap((company, index) => {
  const primarySequence = CONTACT_ID_OFFSET + index * 2;
  const secondarySequence = primarySequence + 1;
  const domain = company.email.includes("@") ? company.email.split("@")[1] : "example.com";

  const pFirst = faker.person.firstName();
  const pLast = faker.person.lastName();
  const sFirst = faker.person.firstName();
  const sLast = faker.person.lastName();

  return [
    {
      id: formatSeedUuid(primarySequence),
      accountId: company.id,
      name: `${pFirst} ${pLast}`,
      firstName: pFirst,
      lastName: pLast,
      fullName: `${pFirst} ${pLast}`,
      title: "Account Manager",
      email: `${pFirst.toLowerCase()}.${pLast.toLowerCase()}@${domain}`,
      phone: faker.phone.number({ style: "international" }),
      ownerId: null
    },
    {
      id: formatSeedUuid(secondarySequence),
      accountId: company.id,
      name: `${sFirst} ${sLast}`,
      firstName: sFirst,
      lastName: sLast,
      fullName: `${sFirst} ${sLast}`,
      title: "Operations Lead",
      email: `${sFirst.toLowerCase()}.${sLast.toLowerCase()}@${domain}`,
      phone: faker.phone.number({ style: "international" }),
      ownerId: null
    }
  ];
});

export const seedAccounts = async (database = defaultDb) => {
  await database.transaction(async (tx) => {
    await tx.execute(sql`ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "legal_name" text;`);
    await tx.execute(sql`ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "registration_number" text;`);
    await tx.execute(sql`ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "date_of_incorporation" timestamptz;`);
    await tx.execute(sql`ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "industry" text;`);
    await tx.execute(sql`ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "number_of_employees" integer;`);
    await tx.execute(sql`ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "annual_revenue_range" text;`);
    await tx.execute(sql`ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "legal_status" text;`);
    await tx.execute(sql`ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "company_type" text;`);
    await tx.execute(sql`ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "description" text;`);
    await tx.execute(sql`ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "social_media_links" jsonb;`);
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

    // Create addresses for accounts (1-2 addresses per account)
    const addressesData = [];
    faker.seed(2025);

    for (let index = 0; index < COMPANY_COUNT; index++) {
      const account = accountsSeedData[index];
      const addressCount = index % 3 === 0 ? 2 : 1; // Every third account has 2 addresses

      for (let addrIndex = 0; addrIndex < addressCount; addrIndex++) {
        addressesData.push({
          id: formatSeedUuid(1000 + index * 10 + addrIndex),
          accountId: account.id,
          label: addrIndex === 0 ? "primary" : "billing",
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: "Srbija",
          postalCode: faker.location.zipCode("#####"),
          country: "RS"
        });
      }
    }

    const SKIP_ADDRESSES = process.env.SEED_SKIP_ACCOUNT_ADDRESSES === "true";

    if (!SKIP_ADDRESSES && addressesData.length > 0) {
      await Promise.all(
        addressesData.map((address) =>
          tx.execute(sql`
            INSERT INTO "account_addresses" ("id", "account_id", "label", "street", "city", "state", "postal_code", "country")
            VALUES (${address.id}, ${address.accountId}, ${address.label}, ${address.street}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country})
            ON CONFLICT ("id") DO UPDATE SET
              "account_id" = ${address.accountId},
              "label" = ${address.label},
              "street" = ${address.street},
              "city" = ${address.city},
              "state" = ${address.state},
              "postal_code" = ${address.postalCode},
              "country" = ${address.country}
          `)
        )
      );
    }
  });
};
