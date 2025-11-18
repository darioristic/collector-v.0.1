export type Settings = {
  currency: string;
  size: string;
  include_tax: boolean;
  include_vat: boolean;
};

/**
 * Get default settings for invoice
 * TODO: Add country detection to automatically determine currency and size
 */
export function getDefaultSettings(): Settings {
  // For now, return sensible defaults
  // TODO: Implement country detection and currency mapping
  const currency = "USD";
  const size = "a4"; // Default to A4
  const include_tax = false;
  const include_vat = true; // VAT is more common globally

  return {
    currency,
    size,
    include_tax,
    include_vat,
  };
}
