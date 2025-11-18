import * as React from "react";
import type { LineItem } from "@crm/types";

const formatNumber = (n: number, currency?: string) => {
  return new Intl.NumberFormat(undefined, { style: currency ? "currency" : "decimal", currency: currency || undefined, minimumFractionDigits: 2 }).format(n);
};

export function LineItemsCore({
  items,
  currency,
  descriptionLabel = "Description",
  priceLabel = "Price",
  totalLabel = "Total",
  includeVAT = true,
}: {
  items: LineItem[];
  currency?: string;
  descriptionLabel?: string;
  priceLabel?: string;
  totalLabel?: string;
  includeVAT?: boolean;
}) {
  const gridCols = includeVAT ? "grid-cols-[20px_2fr_10%_10%_10%_80px]" : "grid-cols-[20px_2fr_12%_80px]";
  return (
    <div>
      <div className={`grid ${gridCols} group border-border relative mb-2 w-full items-start gap-2 border-b pb-1`}>
        <div className="text-right text-[9px] text-[#878787]">#</div>
        <div className="text-[11px] text-[#878787]">{descriptionLabel}</div>
        <div className="text-center text-[11px] text-[#878787]">Unit</div>
        <div className="text-center text-[11px] text-[#878787]">{priceLabel}</div>
        {includeVAT && (
          <>
            <div className="text-center text-[11px] text-[#878787]">VAT %</div>
          </>
        )}
        <div className="text-right text-[11px] text-[#878787]">{totalLabel}</div>
      </div>
      {items.map((item, index) => (
        <div key={item.id ? `line-item-${item.id}` : `line-item-${index}`} className={`grid ${gridCols} group relative mb-1 w-full items-start gap-2 py-1`}>
          <div className="self-start text-right text-[11px]">{index + 1}</div>
          <div className="self-start text-[11px]">{item.name}</div>
          <div className="self-start text-center text-[11px]">{item.unit || "—"}</div>
          <div className="self-start text-center text-[11px]">{formatNumber(item.price, currency)}</div>
          {includeVAT && (
            <div className="self-start text-center text-[11px]">{item.vat ? `${item.vat}%` : "—"}</div>
          )}
          <div className="self-start text-right text-[11px]">{formatNumber(item.price * item.quantity, currency)}</div>
        </div>
      ))}
    </div>
  );
}

