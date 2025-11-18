export function formatAmount({
  currency,
  amount,
  locale = "en-US",
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
}: {
  currency: string;
  amount: number;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch (error) {
    // Fallback if currency is invalid
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatCurrency(amount: number, currency: string): string {
  return formatAmount({ amount, currency });
}
