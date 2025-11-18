import { formatDistanceToNow } from "date-fns";

/**
 * Format a number as currency with proper formatting
 */
export function formatAmount({
  amount,
  currency = "USD",
}: {
  amount: number;
  currency?: string;
}): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  // Ensure single space between currency and number
  return formatted
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/([A-Z]{3})(\d)/, "$1 $2") // Add space between currency code and number
    .replace(/([€$£¥])(\d)/, "$1 $2") // Add space between currency symbol and number
    .trim();
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "—";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "—";

  try {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return "—";
  }
}

