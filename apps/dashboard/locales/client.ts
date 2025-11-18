"use client";

type TranslationKey = 
  | `invoice_status.${"draft" | "overdue" | "paid" | "unpaid" | "canceled" | "pending"}`
  | string;

const translations: Record<string, Record<string, string>> = {
  en: {
    "invoice_status.draft": "Draft",
    "invoice_status.overdue": "Overdue",
    "invoice_status.paid": "Paid",
    "invoice_status.unpaid": "Unpaid",
    "invoice_status.canceled": "Canceled",
    "invoice_status.pending": "Pending",
  },
  sr: {
    "invoice_status.draft": "Nacrt",
    "invoice_status.overdue": "Prekoračeno",
    "invoice_status.paid": "Plaćeno",
    "invoice_status.unpaid": "Neplaćeno",
    "invoice_status.canceled": "Otkazano",
    "invoice_status.pending": "Na čekanju",
  },
};

function getLocale(): string {
  if (typeof window === "undefined") return "en";
  return navigator.language.split("-")[0] || "en";
}

export function useI18n() {
  const locale = getLocale();
  const localeTranslations = translations[locale] || translations.en;

  return (key: TranslationKey): string => {
    return localeTranslations[key] || translations.en[key] || key;
  };
}

