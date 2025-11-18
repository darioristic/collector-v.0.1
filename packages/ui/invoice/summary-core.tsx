import * as React from "react";

const fmt = (n: number, currency?: string) => new Intl.NumberFormat(undefined, { style: currency ? "currency" : "decimal", currency: currency || undefined, minimumFractionDigits: 2 }).format(n);

export function SummaryCore({
  includeVAT = true,
  includeTax = false,
  taxRate = 0,
  currency,
  vatLabel = "VAT",
  taxLabel = "Tax",
  totalLabel = "Total",
  amountBeforeDiscount = 0,
  discountTotal = 0,
  subtotal = 0,
  totalVat = 0,
  total = 0,
}: {
  includeVAT?: boolean;
  includeTax?: boolean;
  taxRate?: number;
  currency?: string;
  vatLabel?: string;
  taxLabel?: string;
  totalLabel?: string;
  amountBeforeDiscount: number;
  discountTotal: number;
  subtotal: number;
  totalVat: number;
  total: number;
}) {
  return (
    <div className="w-full max-w-md ml-auto text-right font-mono text-sm">
      <div className="flex items-center justify-end gap-4 pb-2 border-b border-gray-200">
        <span className="text-[#878787]">Amount before discount:</span>
        <span className="tabular-nums whitespace-nowrap text-gray-900">{fmt(amountBeforeDiscount, currency)}</span>
      </div>
      <div className="flex items-center justify-end gap-4 py-2 border-b border-gray-200">
        <span className="text-[#878787]">Discount:</span>
        <span className={`tabular-nums whitespace-nowrap ${discountTotal > 0 ? "text-red-600" : "text-gray-900"}`}>
          {discountTotal > 0 ? "-" : ""}{fmt(discountTotal, currency)}
        </span>
      </div>
      <div className="flex items-center justify-end gap-4 py-2 border-b border-gray-200">
        <span className="text-[#878787]">Subtotal:</span>
        <span className="tabular-nums whitespace-nowrap text-gray-900">{fmt(subtotal, currency)}</span>
      </div>
      {includeVAT && (
        <div className={`flex items-center justify-end gap-4 py-2 ${includeTax ? "border-b border-gray-200" : ""}`}>
          <span className="text-[#878787]">{vatLabel}:</span>
          <span className="tabular-nums whitespace-nowrap text-gray-900">{fmt(totalVat, currency)}</span>
        </div>
      )}
      {includeTax && (
        <div className="flex items-center justify-end gap-4 py-2">
          <span className="text-[#878787]">{taxLabel} ({taxRate}%):</span>
          <span className="tabular-nums whitespace-nowrap text-gray-900">{fmt(subtotal * (taxRate / 100), currency)}</span>
        </div>
      )}
      <div className="flex items-center justify-end gap-4 pt-4 mt-2 border-t border-gray-300">
        <span className="text-[#878787] font-medium">{totalLabel}:</span>
        <span className="text-2xl font-bold tabular-nums whitespace-nowrap text-gray-900">{fmt(total, currency)}</span>
      </div>
    </div>
  );
}

