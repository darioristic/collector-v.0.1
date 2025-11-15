import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { accountContacts, accounts } from "../schema/accounts.schema";

const COMPANY_COUNT = 50;
const COMPANY_ID_OFFSET = 1;
const CONTACT_ID_OFFSET = 201;
const ACCOUNT_TAGS = ["customer", "partner", "vendor"] as const;

const formatSeedUuid = (value: number) => `00000000-0000-0000-0000-${String(value).padStart(12, "0")}`;

const REAL_COMPANIES: { name: string; domain: string; registrationNumber?: string; address?: { street: string; city: string; postalCode: string; state: string } }[] = [
  { 
    name: "Collector Labs", 
    domain: "collectorlabs.test",
    registrationNumber: "123456/2024",
    address: {
      street: "Bulevar kralja Aleksandra 1",
      city: "Beograd",
      postalCode: "11000",
      state: "Srbija"
    }
  },
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

type AccountSeed = {
  id: string;
  name: string;
  type: typeof ACCOUNT_TAGS[number];
  email: string;
  phone: string;
  website: string;
  taxId: string;
  registrationNumber: string;
  country: "RS";
  ownerId: string | null;
  _address?: { street: string; city: string; postalCode: string; state: string };
};

/**
 * Validacija email formata
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validacija podataka kompanije pre kreiranja
 */
const validateCompanyData = (company: AccountSeed): boolean => {
  // Provera da li name postoji i nije prazan
  if (!company.name || company.name.trim().length === 0) {
    console.error(`[seed] Invalid company name for ID ${company.id}: "${company.name}"`);
    return false;
  }

  // Provera email formata
  if (!company.email || !isValidEmail(company.email)) {
    console.error(`[seed] Invalid email for company ${company.name} (ID: ${company.id}): "${company.email}"`);
    return false;
  }

  // Provera da li taxId postoji i nije prazan
  if (!company.taxId || company.taxId.trim().length === 0) {
    console.error(`[seed] Invalid taxId for company ${company.name} (ID: ${company.id}): "${company.taxId}"`);
    return false;
  }

  // Provera da li country ima tačno 2 karaktera (ISO code)
  if (!company.country || company.country.length !== 2) {
    console.error(`[seed] Invalid country for company ${company.name} (ID: ${company.id}): "${company.country}"`);
    return false;
  }

  // Provera da li type postoji u ACCOUNT_TAGS
  if (!ACCOUNT_TAGS.includes(company.type)) {
    console.error(`[seed] Invalid type for company ${company.name} (ID: ${company.id}): "${company.type}"`);
    return false;
  }

  return true;
};

const accountsSeedData: AccountSeed[] = Array.from({ length: COMPANY_COUNT }, (_value, index) => {
  const sequence = COMPANY_ID_OFFSET + index;
  const companyId = formatSeedUuid(sequence);
  const real = REAL_COMPANIES[index] ?? null;
  
  // Generisanje ili korišćenje stvarnog imena
  let companyName = real ? real.name : faker.company.name();
  // Osiguravanje da name nije prazan
  if (!companyName || companyName.trim().length === 0) {
    companyName = `Company ${index + 1}`;
  }

  // Generisanje ili korišćenje stvarnog domena
  let domain = real ? real.domain : faker.internet.domainName();
  // Osiguravanje da domain nije prazan
  if (!domain || domain.trim().length === 0) {
    domain = `example${index + 1}.com`;
  }

  // Generisanje email-a
  const email = `info@${domain}`;
  
  // Generisanje taxId-a
  const taxId = `RS${faker.number.int({ min: 1000000, max: 9999999 })}`;

  const company: AccountSeed = {
    id: companyId,
    name: companyName.trim(),
    type: ACCOUNT_TAGS[index % ACCOUNT_TAGS.length],
    email: email.trim().toLowerCase(),
    phone: faker.phone.number({ style: "international" }),
    website: `https://${domain}`,
    taxId: taxId.trim(),
    registrationNumber: real?.registrationNumber || `${faker.number.int({ min: 100000, max: 999999 })}/${faker.number.int({ min: 2020, max: 2024 })}`,
    country: "RS",
    ownerId: null,
    // Store address info for later use
    _address: real?.address
  };

  // Validacija pre dodavanja u niz
  if (!validateCompanyData(company)) {
    // Ako validacija ne uspe, koristimo fallback vrednosti
    console.warn(`[seed] Using fallback values for company at index ${index}`);
    company.name = company.name || `Company ${index + 1}`;
    company.email = company.email || `info@example${index + 1}.com`;
    company.taxId = company.taxId || `RS${1000000 + index}`;
    company.country = "RS";
    company.type = ACCOUNT_TAGS[0];
  }

  return company;
}).filter((company) => {
  // Filtriranje nevalidnih kompanija nakon generisanja
  const isValid = validateCompanyData(company);
  if (!isValid) {
    console.error(`[seed] Skipping invalid company with ID ${company.id}`);
  }
  return isValid;
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
    
    // Validacija svih kompanija pre unosa u bazu
    const validCompanies = accountsSeedData.filter((item) => {
      const isValid = validateCompanyData(item);
      if (!isValid) {
        console.error(`[seed] Skipping invalid company data for ID ${item.id}:`, item);
      }
      return isValid;
    });

    if (validCompanies.length === 0) {
      throw new Error("[seed] No valid companies to seed. Please check seed data generation.");
    }

    if (validCompanies.length < accountsSeedData.length) {
      console.warn(
        `[seed] Warning: ${accountsSeedData.length - validCompanies.length} companies were filtered out due to validation errors.`
      );
    }

    // Umetanje samo validnih kompanija sa error handling-om
    const insertResults = await Promise.allSettled(
      validCompanies.map((item) =>
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
              registrationNumber: item.registrationNumber,
              country: item.country,
              ownerId: item.ownerId,
              updatedAt: sql`NOW()`
            }
          })
      )
    );

    // Provera rezultata unosa
    const failedInserts = insertResults.filter((result) => result.status === "rejected");
    if (failedInserts.length > 0) {
      console.error(
        `[seed] Failed to insert ${failedInserts.length} companies:`,
        failedInserts.map((result) =>
          result.status === "rejected" ? result.reason : null
        )
      );
      // Ne baci grešku, ali loguje problem - možda neke kompanije već postoje
    }

    const successfulInserts = insertResults.filter((result) => result.status === "fulfilled");
    console.log(
      `[seed] Successfully processed ${successfulInserts.length} out of ${validCompanies.length} companies.`
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

    // Create addresses for accounts (svaka kompanija ima barem primary adresu)
    const addressesData = [];
    faker.seed(2025);

    for (let index = 0; index < COMPANY_COUNT; index++) {
      const account = accountsSeedData[index];
      // Svaka kompanija ima barem primary adresu
      // Svaka treća kompanija ima i billing adresu
      const addressCount = index % 3 === 0 ? 2 : 1;

      // Koristimo fiksnu adresu ako postoji, inače generišemo
      const fixedAddress = account._address;

      for (let addrIndex = 0; addrIndex < addressCount; addrIndex++) {
        addressesData.push({
          id: formatSeedUuid(1000 + index * 10 + addrIndex),
          accountId: account.id,
          label: addrIndex === 0 ? "primary" : "billing",
          street: (addrIndex === 0 && fixedAddress) ? fixedAddress.street : faker.location.streetAddress(),
          city: (addrIndex === 0 && fixedAddress) ? fixedAddress.city : faker.location.city(),
          state: (addrIndex === 0 && fixedAddress) ? fixedAddress.state : "Srbija",
          postalCode: (addrIndex === 0 && fixedAddress) ? fixedAddress.postalCode : faker.location.zipCode("#####"),
          country: "RS"
        });
      }
    }

    // Uvek kreiramo adrese - ne skip-ujemo
    // Prvo proveravamo da li postoji primary adresa za svaki account, ako ne - kreiramo je
    if (addressesData.length > 0) {
      // Kreiraj/azuriraj adrese - koristimo account_id + label kao unique constraint
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
      
      // Ako primary adresa ne postoji za neki account, kreiramo je
      for (const account of accountsSeedData) {
        const hasPrimaryAddress = addressesData.some(addr => addr.accountId === account.id && addr.label === "primary");
        if (!hasPrimaryAddress) {
          const fixedAddress = account._address;
          await tx.execute(sql`
            INSERT INTO "account_addresses" ("id", "account_id", "label", "street", "city", "state", "postal_code", "country")
            VALUES (
              ${formatSeedUuid(1000 + accountsSeedData.indexOf(account) * 10)},
              ${account.id},
              'primary',
              ${fixedAddress?.street || faker.location.streetAddress()},
              ${fixedAddress?.city || faker.location.city()},
              ${fixedAddress?.state || "Srbija"},
              ${fixedAddress?.postalCode || faker.location.zipCode("#####")},
              'RS'
            )
            ON CONFLICT ("id") DO UPDATE SET
              "street" = EXCLUDED."street",
              "city" = EXCLUDED."city",
              "state" = EXCLUDED."state",
              "postal_code" = EXCLUDED."postal_code"
          `);
        }
      }
    }
  });
};
