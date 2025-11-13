import type { OfferItem } from "@/lib/validations/offer"

export function calculateItemTotal(item: OfferItem): number {
  const subtotal = item.quantity * item.unitPrice
  const afterDiscount = subtotal * (1 - item.discount / 100)
  const withVat = afterDiscount * (1 + item.vatRate / 100)
  return withVat
}

export function calculateSubtotal(items: OfferItem[]): number {
  return items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice
    return sum + itemSubtotal
  }, 0)
}

export function calculateTotalDiscount(items: OfferItem[]): number {
  return items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice
    const discount = itemSubtotal * (item.discount / 100)
    return sum + discount
  }, 0)
}

export function calculateTotalVat(items: OfferItem[]): number {
  return items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice
    const afterDiscount = itemSubtotal * (1 - item.discount / 100)
    const vat = afterDiscount * (item.vatRate / 100)
    return sum + vat
  }, 0)
}

export function calculateGrandTotal(items: OfferItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
}

export function calculateVatByRate(items: OfferItem[]): { rate: number; amount: number }[] {
  const vatMap = new Map<number, number>()

  items.forEach((item) => {
    const itemSubtotal = item.quantity * item.unitPrice
    const afterDiscount = itemSubtotal * (1 - item.discount / 100)
    const vat = afterDiscount * (item.vatRate / 100)

    const currentVat = vatMap.get(item.vatRate) || 0
    vatMap.set(item.vatRate, currentVat + vat)
  })

  return Array.from(vatMap.entries())
    .map(([rate, amount]) => ({ rate, amount }))
    .sort((a, b) => a.rate - b.rate)
}

export function numberToWords(num: number, currency: "RSD" | "EUR"): string {
  // Simplified Serbian number to words conversion
  const ones = ["", "jedan", "dva", "tri", "četiri", "pet", "šest", "sedam", "osam", "devet"]
  const teens = [
    "deset",
    "jedanaest",
    "dvanaest",
    "trinaest",
    "četrnaest",
    "petnaest",
    "šesnaest",
    "sedamnaest",
    "osamnaest",
    "devetnaest",
  ]
  const tens = [
    "",
    "",
    "dvadeset",
    "trideset",
    "četrdeset",
    "pedeset",
    "šezdeset",
    "sedamdeset",
    "osamdeset",
    "devedeset",
  ]

  const currencyName = currency === "RSD" ? "dinara" : "evra"

  if (num === 0) return `nula ${currencyName}`

  // Simplified for demo - full implementation would handle larger numbers
  const rounded = Math.floor(num)
  if (rounded < 10) return `${ones[rounded]} ${currencyName}`
  if (rounded < 20) return `${teens[rounded - 10]} ${currencyName}`
  if (rounded < 100) {
    const ten = Math.floor(rounded / 10)
    const one = rounded % 10
    return `${tens[ten]} ${ones[one]} ${currencyName}`.trim()
  }

  return `${rounded} ${currencyName}`
}
