import { formatNumber } from "@/lib/utils";
import { DescriptionAutocompleteInline } from "../../description-autocomplete";
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
  useAutocomplete?: boolean;
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
  useAutocomplete = true
}: Props) {
  // Use a more flexible grid that shows all columns
  const gridCols = includeVAT
    ? "grid-cols-[20px_2fr_8%_8%_10%_8%_8%_12%]"
    : "grid-cols-[20px_2fr_10%_10%_12%_12%]";

  return (
    <div className="mt-5 font-mono">
      <div
        className={`grid ${gridCols} group border-border relative mb-2 w-full items-start gap-2 border-b pb-1`}>
        <div className="text-right text-[11px] text-[#878787]">#</div>
        <div className="text-[11px] text-[#878787]">{descriptionLabel}</div>
        <div className="text-right text-[11px] text-[#878787]">
          {quantityLabel === "Quantity" ? "Qty" : quantityLabel}
        </div>
        <div className="text-right text-[11px] text-[#878787]">Unit</div>
        <div className="text-right text-[11px] text-[#878787]">{priceLabel}</div>
        {includeVAT && (
          <>
            <div className="text-right text-[11px] text-[#878787]">Disc %</div>
            <div className="text-right text-[11px] text-[#878787]">VAT %</div>
          </>
        )}
        <div className="text-right text-[11px] text-[#878787]">{totalLabel}</div>
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
            className={`grid ${gridCols} group relative mb-1 w-full items-start gap-2 py-1`}>
            <div className="self-start text-right text-[11px]">{index + 1}</div>
            <div className="text-[11px]">
              {editable ? (
                (() => {
                  const enableAutocomplete =
                    index === lineItems.length - 1 && (!item.name || item.name.length === 0);
                  if (enableAutocomplete) {
                    return (
                      <DescriptionAutocompleteInline
                        value={item.name}
                        onChange={(val) => onChangeDescription?.(index, val)}
                        autoFocus
                        showIcon
                      />
                    );
                  }
                  return (
                    <textarea
                      className="max-h-64 w-full resize-none overflow-y-auto bg-transparent font-mono text-[11px] leading-4 wrap-break-word whitespace-pre-wrap outline-none focus:ring-0"
                      value={item.name}
                      rows={3}
                      spellCheck={false}
                      onKeyDown={(e) => {
                        // Allow native newline; just stop bubbling so no parent handler fires
                        if (e.key === "Enter") {
                          e.stopPropagation();
                        }
                      }}
                      onKeyUp={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                        }
                      }}
                      onChange={(e) => onChangeDescription?.(index, e.target.value)}
                    />
                  );
                })()
              ) : (
                <span className="wrap-break-word whitespace-pre-wrap">{item.name}</span>
              )}
            </div>
            <div className="self-start text-right text-[11px]">{item.quantity}</div>
            <div className="self-start text-right text-[11px]">{item.unit || "—"}</div>
            <div className="self-start text-right text-[11px]">{formatNumber(item.price)}</div>
            {includeVAT && (
              <>
                <div className="self-start text-right text-[11px]">
                  {item.discountRate ? `${item.discountRate}%` : "—"}
                </div>
                <div className="self-start text-right text-[11px]">
                  {item.vat ? `${item.vat}%` : "—"}
                </div>
              </>
            )}
            <div className="self-start text-right text-[11px]">{formatNumber(itemTotal)}</div>
          </div>
        );
      })}
      {editable && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onAddLineItem}
            className="text-primary font-mono text-[11px] underline underline-offset-2 hover:opacity-80">
            + Add item
          </button>
        </div>
      )}
    </div>
  );
}
