import type { FastifySchema } from "fastify";

import { ACCOUNT_TYPES } from "./accounts.types";

const accountProperties = {
  id: { type: "string" },
  name: { type: "string", minLength: 1 },
  type: { type: "string", enum: ACCOUNT_TYPES },
  email: { type: "string", format: "email" },
  phone: { type: "string", nullable: true },
  website: { type: "string", nullable: true },
  taxId: { type: "string" },
  country: { type: "string", minLength: 2, maxLength: 2 },
  legalName: { type: "string", nullable: true },
  registrationNumber: { type: "string", nullable: true },
  dateOfIncorporation: { type: "string", format: "date-time", nullable: true },
  industry: { type: "string", nullable: true },
  numberOfEmployees: { type: "integer", nullable: true },
  annualRevenueRange: { type: "string", nullable: true },
  legalStatus: { type: "string", nullable: true },
  companyType: { type: "string", nullable: true },
  description: { type: "string", nullable: true },
  socialMediaLinks: { type: "object", nullable: true, additionalProperties: { type: "string", nullable: true } }
} as const;

const accountResponseSchema = {
  type: "object",
  properties: {
    ...accountProperties,
    phone: { ...accountProperties.phone, nullable: true },
    website: { ...accountProperties.website, nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "name", "type", "email", "taxId", "country", "createdAt", "updatedAt"],
  additionalProperties: false
} as const;

const contactResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    accountId: { type: "string" },
    accountName: { anyOf: [{ type: "string" }, { type: "null" }] },
    name: { type: "string" },
    firstName: { anyOf: [{ type: "string" }, { type: "null" }] },
    lastName: { anyOf: [{ type: "string" }, { type: "null" }] },
    fullName: { anyOf: [{ type: "string" }, { type: "null" }] },
    title: { anyOf: [{ type: "string" }, { type: "null" }] },
    email: { anyOf: [{ type: "string", format: "email" }, { type: "null" }] },
    phone: { anyOf: [{ type: "string" }, { type: "null" }] },
    ownerId: { anyOf: [{ type: "string" }, { type: "null" }] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "accountId", "name", "createdAt", "updatedAt"],
  additionalProperties: false
} as const;

const accountBodySchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    type: { type: "string", enum: ACCOUNT_TYPES },
    email: { type: "string", format: "email" },
    phone: { type: "string" },
    website: { type: "string" },
    taxId: { type: "string" },
    country: { type: "string", minLength: 2, maxLength: 2 }
  },
  required: ["name", "type", "email", "taxId", "country"],
  additionalProperties: false
} as const;

const accountParamsSchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 }
  },
  required: ["id"],
  additionalProperties: false
} as const;

const errorResponseSchema = {
  type: "object",
  properties: {
    statusCode: { type: "number" },
    error: { type: "string" },
    message: { type: "string" }
  },
  required: ["statusCode", "error", "message"],
  additionalProperties: false
} as const;

export const listAccountsSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "List all accounts",
  description: "Vraća listu svih klijentskih naloga sa osnovnim informacijama. Rezultati se mogu filtrirati i sortirati.",
  querystring: {
    type: "object",
    properties: {
      search: { type: "string", minLength: 1, maxLength: 255 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "array",
      items: accountResponseSchema,
      description: "Lista svih naloga (filtrirana po search parametru ako je prosleđen)"
    }
  }
};

export const listContactsSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "List account contacts",
  description: "Vraća listu svih kontakata povezanih sa nalozima. Uključuje informacije o nalogu i kontakt osobi.",
  response: {
    200: {
      type: "array",
      items: contactResponseSchema,
      description: "Lista svih kontakata"
    }
  }
};

const addressResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    accountId: { type: "string" },
    label: { type: "string" },
    street: { type: "string", nullable: true },
    city: { type: "string", nullable: true },
    state: { type: "string", nullable: true },
    postalCode: { type: "string", nullable: true },
    country: { type: "string", nullable: true },
    latitude: { type: "string", nullable: true },
    longitude: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" }
  },
  required: ["id", "accountId", "label", "createdAt"],
  additionalProperties: false
} as const;

const executiveResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    accountId: { type: "string" },
    name: { type: "string" },
    title: { type: "string", nullable: true },
    email: { type: "string", format: "email", nullable: true },
    phone: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" }
  },
  required: ["id", "accountId", "name", "createdAt"],
  additionalProperties: false
} as const;

const milestoneResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    accountId: { type: "string" },
    title: { type: "string" },
    description: { type: "string", nullable: true },
    date: { type: "string", format: "date-time" },
    createdAt: { type: "string", format: "date-time" }
  },
  required: ["id", "accountId", "title", "date", "createdAt"],
  additionalProperties: false
} as const;

const accountWithDetailsResponseSchema = {
  type: "object",
  properties: {
    account: accountResponseSchema,
    addresses: {
      type: "array",
      items: addressResponseSchema
    },
    contacts: {
      type: "array",
      items: contactResponseSchema
    },
    executives: {
      type: "array",
      items: executiveResponseSchema
    },
    milestones: {
      type: "array",
      items: milestoneResponseSchema
    }
  },
  required: ["account", "addresses", "contacts", "executives", "milestones"],
  additionalProperties: false
} as const;

export const getAccountSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "Get account by id",
  description: "Vraća detaljne informacije o konkretnom nalogu na osnovu ID-a sa svim povezanim podacima (addresses, contacts, executives, milestones).",
  params: accountParamsSchema,
  response: {
    200: {
      ...accountWithDetailsResponseSchema,
      description: "Detalji naloga sa svim povezanim podacima"
    },
    404: {
      ...errorResponseSchema,
      description: "Nalog nije pronađen"
    }
  }
};

export const createAccountSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "Create new account",
  description: "Kreira novi klijentski nalog. Svi obavezni podaci moraju biti validni (email format, tip naloga, itd.).",
  body: accountBodySchema,
  response: {
    201: {
      ...accountResponseSchema,
      description: "Kreiran nalog"
    },
    400: {
      ...errorResponseSchema,
      description: "Nevalidni podaci za kreiranje naloga"
    },
    409: {
      ...errorResponseSchema,
      description: "Nalog sa istim email-om već postoji"
    }
  }
};

export const updateAccountSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "Update account",
  description: "Ažurira postojeći nalog. Mogu se ažurirati svi podaci osim ID-a.",
  params: accountParamsSchema,
  body: accountBodySchema,
  response: {
    200: {
      ...accountResponseSchema,
      description: "Ažuriran nalog"
    },
    400: {
      ...errorResponseSchema,
      description: "Nevalidni podaci za ažuriranje"
    },
    404: {
      ...errorResponseSchema,
      description: "Nalog nije pronađen"
    }
  }
};

export const deleteAccountSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "Delete account",
  description: "Briše nalog iz sistema. Operacija je trajna i ne može se poništiti.",
  params: accountParamsSchema,
  response: {
    204: {
      type: "null",
      description: "Nalog je uspešno obrisan"
    },
    404: {
      ...errorResponseSchema,
      description: "Nalog nije pronađen"
    }
  }
};

