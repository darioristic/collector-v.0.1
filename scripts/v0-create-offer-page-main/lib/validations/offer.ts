import { z } from "zod"

export const offerItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Naziv stavke je obavezan"),
  description: z.string().optional(),
  quantity: z.number().min(0.01, "Količina mora biti veća od 0"),
  unit: z.string().min(1, "Jedinica mere je obavezna"),
  unitPrice: z.number().min(0, "Cena mora biti pozitivna"),
  discount: z.number().min(0).max(100, "Popust mora biti između 0 i 100%"),
  vatRate: z.number().min(0).max(100, "PDV mora biti između 0 i 100%"),
})

export const clientSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(1, "Naziv kompanije je obavezan"),
  pib: z.string().min(9, "PIB mora imati 9 cifara").max(9),
  mb: z.string().min(8, "MB mora imati 8 cifara").max(8),
  address: z.string().min(1, "Adresa je obavezna"),
  city: z.string().min(1, "Grad je obavezan"),
  email: z.string().email("Neispravna email adresa"),
  phone: z.string().min(1, "Telefon je obavezan"),
  isVatRegistered: z.boolean().default(true),
})

export const offerSchema = z
  .object({
    offerNumber: z.string().min(1, "Broj ponude je obavezan"),
    offerDate: z.date(),
    validUntil: z.date(),
    currency: z.enum(["RSD", "EUR"]),
    status: z.enum(["draft", "sent", "accepted", "rejected"]),
    client: clientSchema,
    items: z.array(offerItemSchema).min(1, "Morate dodati bar jednu stavku"),
    notes: z.string().optional(),
    convertToInvoice: z.boolean().default(false),
    includeLogo: z.boolean().default(true),
  })
  .refine((data) => data.validUntil > data.offerDate, {
    message: "Datum važenja mora biti posle datuma ponude",
    path: ["validUntil"],
  })

export type OfferFormData = z.infer<typeof offerSchema>
export type OfferItem = z.infer<typeof offerItemSchema>
export type Client = z.infer<typeof clientSchema>
