import { formatNumber } from "@/lib/utils";
import type { LineItem } from "../types";

type Props = {
  lineItems: LineItem[];
  currency: string;
  descriptionLabel: string;
  quantityLabel: string;
  priceLabel: string;
  totalLabel: string;
  includeVAT?: boolean;
  editable?: boolean;
  onChangeDescription?: (index: number, description: string) => void;
  onAddLineItem?: () => void;
};

export function LineItems({
  lineItems,
  currency: _currency,
  descriptionLabel,
  quantityLabel,
  priceLabel,
  totalLabel,
  includeVAT = false,
  editable = false,
  onChangeDescription,
  onAddLineItem,
}: Props) {
  // Use a more flexible grid that shows all columns
  const gridCols = includeVAT
    ? "grid-cols-[2fr_8%_8%_10%_8%_8%_12%]"
    : "grid-cols-[2fr_10%_10%_12%_12%]";

  return (
    <div className="mt-5 font-mono">
      <div
        className={`grid ${gridCols} gap-2 items-end relative group mb-2 w-full pb-1 border-b border-border`}
      >
        <div className="text-[11px] text-[#878787]">{descriptionLabel}</div>
        <div className="text-[11px] text-[#878787] text-right">{quantityLabel}</div>
        <div className="text-[11px] text-[#878787] text-right">Unit</div>
        <div className="text-[11px] text-[#878787] text-right">{priceLabel}</div>
        {includeVAT && (
          <>
            <div className="text-[11px] text-[#878787] text-right">Disc %</div>
            <div className="text-[11px] text-[#878787] text-right">VAT %</div>
          </>
        )}
        <div className="text-[11px] text-[#878787] text-right">{totalLabel}</div>
      </div>
      {lineItems.map((item, index) => {
        // Calculate item total (price * quantity with VAT if needed)
        const itemSubtotal = item.price * item.quantity;
        const discountAmount = itemSubtotal * ((item.discountRate || 0) / 100);
        const itemAfterDiscount = itemSubtotal - discountAmount;
        const vatAmount = itemAfterDiscount * ((item.vat || 0) / 100);
        const itemTotal = includeVAT ? itemAfterDiscount + vatAmount : itemAfterDiscount;

        return (
          <div
            key={`line-item-${index.toString()}`}
            className={`grid ${gridCols} gap-2 items-end relative group mb-1 w-full py-1`}
          >
            <div className="text-[11px]">
              {editable ? (
                <textarea
                  className="w-full bg-transparent font-mono text-[11px] leading-4 outline-none focus:ring-0 resize-none whitespace-pre-wrap"
                  value={item.name}
                  rows={1}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = `${t.scrollHeight}px`;
                  }}
                  onChange={(e) => onChangeDescription?.(index, e.target.value)}
                />
              ) : (
                <span className="whitespace-pre-wrap break-words">{item.name}</span>
              )}
            </div>
            <div className="text-[11px] text-right">{item.quantity}</div>
            <div className="text-[11px] text-right">{item.unit || "—"}</div>
            <div className="text-[11px] text-right">
              {formatNumber(item.price)}
            </div>
            {includeVAT && (
              <>
                <div className="text-[11px] text-right">
                  {item.discountRate ? `${item.discountRate}%` : "—"}
                </div>
                <div className="text-[11px] text-right">
                  {item.vat ? `${item.vat}%` : "—"}
                </div>
              </>
            )}
            <div className="text-[11px] text-right">
              {formatNumber(itemTotal)}
            </div>
          </div>
        );
      })}
      {editable && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onAddLineItem}
            className="text-[11px] font-mono text-primary underline underline-offset-2 hover:opacity-80"
          >
            + Add item
          </button>
        </div>
      )}
    </div>
  );
}

