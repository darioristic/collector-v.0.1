import { formatCurrency } from "@/lib/utils";
import type { LineItem } from "../types";

type Props = {
  includeVAT?: boolean;
  includeTax?: boolean;
  taxRate?: number;
  currency: string;
  vatLabel: string;
  taxLabel?: string;
  totalLabel: string;
  lineItems: LineItem[];
  amountBeforeDiscount: number;
  discountTotal: number;
  subtotal: number;
  totalVat: number;
  total: number;
};

export function Summary({
  includeVAT = false,
  includeTax = false,
  taxRate = 0,
  currency,
  vatLabel,
  taxLabel,
  totalLabel,
  lineItems,
  amountBeforeDiscount,
  discountTotal,
  subtotal,
  totalVat,
  total,
}: Props) {
  // Calculate average VAT rate (weighted by item subtotal)
  let averageVatRate = 0;
  if (includeVAT && subtotal > 0 && lineItems.length > 0) {
    const itemsWithSubtotal = lineItems.filter(
      (item) => item.price > 0 && item.quantity > 0 && (item.vat || 0) > 0
    );
    
    if (itemsWithSubtotal.length > 0) {
      const weightedSum = itemsWithSubtotal.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        const discountAmount = itemTotal * ((item.discountRate || 0) / 100);
        const itemSubtotal = itemTotal - discountAmount;
        const vatRate = item.vat || 0;
        return sum + (vatRate * itemSubtotal);
      }, 0);
      
      averageVatRate = weightedSum / subtotal;
    }
  }

  return (
    <div className="text-sm font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-muted-foreground">Amount before discount:</span>
        <span className="tabular-nums whitespace-nowrap">{formatCurrency(amountBeforeDiscount, currency)}</span>
      </div>
      <div className="flex items-center justify-between py-2 border-b border-border">
        <span className="text-muted-foreground">Discount:</span>
        <span className={`tabular-nums whitespace-nowrap ${discountTotal > 0 ? "text-red-600" : ""}`}>
          {discountTotal > 0 ? "-" : ""}{formatCurrency(discountTotal, currency)}
        </span>
      </div>
      <div className="flex items-center justify-between py-2 border-b border-border">
        <span className="text-muted-foreground">Subtotal:</span>
        <span className="tabular-nums whitespace-nowrap">{formatCurrency(subtotal, currency)}</span>
      </div>
      {includeVAT && (
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-muted-foreground">
            {vatLabel}{averageVatRate > 0 ? ` (${averageVatRate.toFixed(0)}%)` : ""}:
          </span>
          <span className="tabular-nums whitespace-nowrap">{formatCurrency(totalVat, currency)}</span>
        </div>
      )}
      {includeTax && taxRate > 0 && taxLabel && (
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-muted-foreground">{taxLabel}:</span>
          <span className="tabular-nums whitespace-nowrap">{formatCurrency((subtotal * taxRate) / 100, currency)}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-4 mt-2">
        <span className="text-muted-foreground">{totalLabel}</span>
        <span className="text-2xl font-bold tabular-nums whitespace-nowrap">
          {formatCurrency(total, currency)}
        </span>
      </div>
    </div>
  );
}
