import { formatNumber, parseNumber } from "@/lib/utils";
import { GripVertical, X } from "lucide-react";
import * as React from "react";
import type { LineItem } from "../types";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  lineItems: LineItem[];
  currency: string;
  descriptionLabel: string;
  quantityLabel: string;
  priceLabel: string;
  totalLabel: string;
  includeVAT?: boolean;
  editable?: boolean;
  interactive?: boolean;
  onChangeDescription?: (index: number, description: string) => void;
  onChangeQuantity?: (index: number, quantity: number) => void;
  onChangePrice?: (index: number, price: number) => void;
  onChangeUnit?: (index: number, unit: string) => void;
  onChangeVat?: (index: number, vat: number) => void;
  onChangeDiscount?: (index: number, discountRate: number) => void;
  onAddLineItem?: () => void;
  _useAutocomplete?: boolean;
  activeAutocompleteIndex?: number;
  onAutocompleteCommit?: (index: number, value: string) => void;
  onDeleteLineItem?: (index: number) => void;
  onMoveLineItem?: (fromIndex: number, toIndex: number) => void;
};

// Memoized textarea to prevent unnecessary remounts
const EditableDescription = React.memo(
  ({
    value,
    onChange,
    index,
    onBlur,
    onKeyDownCapture,
    onFocus
  }: {
    value: string;
    onChange: (index: number, value: string) => void;
    index: number;
    onBlur?: () => void;
    onKeyDownCapture?: React.KeyboardEventHandler<HTMLTextAreaElement>;
    onFocus?: () => void;
  }) => {
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(index, e.target.value);
      },
      [index, onChange]
    );

    return (
      <textarea
        dir="ltr"
        className="max-h-64 w-full resize-none overflow-y-auto bg-transparent text-left font-mono text-[11px] leading-4 break-words whitespace-pre-wrap outline-none focus:ring-0"
        value={value}
        rows={3}
        spellCheck={false}
        autoComplete="off"
        onChange={handleChange}
        onKeyDownCapture={onKeyDownCapture}
        onKeyDown={(e) => e.stopPropagation()}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );
  }
);

EditableDescription.displayName = "EditableDescription";

function SortableRow({
  id,
  disabled,
  children
}: {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    disabled
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  } as React.CSSProperties;
  return (
    <SortableHandleCtx.Provider value={{ attributes, listeners }}>
      <div ref={setNodeRef} style={style} className="contents">
        {children as React.ReactElement}
      </div>
    </SortableHandleCtx.Provider>
  );
}

export function LineItems({
  lineItems,
  currency: _currency,
  descriptionLabel,
  quantityLabel,
  priceLabel,
  totalLabel,
  includeVAT = false,
  editable = false,
  interactive = true,
  onChangeDescription,
  onChangeQuantity,
  onChangePrice,
  onChangeUnit,
  onChangeVat,
  onChangeDiscount,
  onAddLineItem,
  _useAutocomplete = true,
  activeAutocompleteIndex,
  onAutocompleteCommit,
  onDeleteLineItem,
  onMoveLineItem
}: Props) {
  // Grid columns - must be identical in view and edit mode to prevent layout shift
  const gridCols = includeVAT
    ? "grid-cols-[20px_2fr_8%_8%_10%_8%_8%_80px]"
    : "grid-cols-[20px_2fr_10%_10%_12%_80px]";

  const [qtyInput, setQtyInput] = React.useState<Record<number, string>>({});
  const [descInput, setDescInput] = React.useState<Record<number, string>>({});

  const [priceInput, setPriceInput] = React.useState<Record<number, string>>({});
  const [vatInput, setVatInput] = React.useState<Record<number, string>>({});
  const [discountInput, setDiscountInput] = React.useState<Record<number, string>>({});
  const numericPattern = React.useMemo(() => /^-?\d*(?:[.,]\d*)?$/, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIndex = lineItems.findIndex(
        (it, i) => (it.id ? `line-item-${it.id}` : `line-item-${i}`) === active.id
      );
      const toIndex = lineItems.findIndex(
        (it, i) => (it.id ? `line-item-${it.id}` : `line-item-${i}`) === over.id
      );
      if (fromIndex >= 0 && toIndex >= 0) onMoveLineItem?.(fromIndex, toIndex);
    },
    [lineItems, onMoveLineItem]
  );

  const itemsIds = React.useMemo(
    () => lineItems.map((it, i) => (it.id ? `line-item-${it.id}` : `line-item-${i}`)),
    [lineItems]
  );

  const onDescriptionKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent bubbling to DnD/sheet/toolbars; keep arrow/home/end local to textarea
    if (
      e.key === "Enter" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "Home" ||
      e.key === "End" ||
      e.key === "PageUp" ||
      e.key === "PageDown"
    ) {
      e.stopPropagation();
    }
  }, []);

  const gridStatic = includeVAT ? "40px 2fr 56px 60px 80px 60px 60px 100px" : "40px 2fr 56px 60px 80px 100px";

  return (
    <div className="mt-5 font-mono">
      {interactive ? (
        <div
          className={`grid ${gridCols} group border-border relative mb-2 w-full items-start gap-2 border-b pb-1`}>
          <div className="text-right text-[9px] text-[#878787]">#</div>
          <div className="text-[9px] text-[#878787]">{descriptionLabel}</div>
          <div className="text-right text-[9px] text-[#878787]">{quantityLabel}</div>
          <div className="text-right text-[9px] text-[#878787]">Unit</div>
          <div className="text-right text-[9px] text-[#878787]">{priceLabel}</div>
          {includeVAT && (
            <>
              <div className="text-right text-[9px] text-[#878787]">Disc %</div>
              <div className="text-right text-[9px] text-[#878787]">VAT %</div>
            </>
          )}
          <div className="text-right text-[9px] text-[#878787]">{totalLabel}</div>
        </div>
      ) : (
        <div
          className={`group border-border relative mb-2 grid w-full items-start gap-2 border-b pb-1`}
          style={{ gridTemplateColumns: gridStatic }}>
          <div className="text-right text-[9px] text-[#878787]">#</div>
          <div className="text-[9px] text-[#878787]">{descriptionLabel}</div>
          <div className="text-right text-[9px] text-[#878787]">{quantityLabel}</div>
          <div className="text-right text-[9px] text-[#878787]">Unit</div>
          <div className="text-right text-[9px] text-[#878787]">{priceLabel}</div>
          {includeVAT && (
            <>
              <div className="text-right text-[9px] text-[#878787]">Disc %</div>
              <div className="text-right text-[9px] text-[#878787]">VAT %</div>
            </>
          )}
          <div className="text-right text-[9px] text-[#878787]">{totalLabel}</div>
        </div>
      )}
      {editable ? (
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={itemsIds} strategy={verticalListSortingStrategy}>
            {lineItems.map((item, index) => {
              const itemSubtotal = item.price * item.quantity;
              const discountAmount = itemSubtotal * ((item.discountRate || 0) / 100);
              const itemAfterDiscount = itemSubtotal - discountAmount;
              const vatAmount = itemAfterDiscount * ((item.vat || 0) / 100);
              const itemTotal = includeVAT ? itemAfterDiscount + vatAmount : itemAfterDiscount;

              return (
                <SortableRow
                  key={item.id ? `line-item-${item.id}` : `line-item-${index.toString()}`}
                  id={item.id ? `line-item-${item.id}` : `line-item-${index.toString()}`}
                  disabled={false}>
                  <div
                    className={`li-row grid ${gridCols} group relative mb-1 w-full items-start gap-2 py-1`}>
                    <div className="flex items-center justify-end gap-1 self-start text-right text-[11px]">
                      <SortableHandle />
                      <span>{index + 1}</span>
                      <button
                        type="button"
                        aria-label="Delete line"
                        className="text-muted-foreground hover:text-destructive ml-1 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLineItem?.(index);
                        }}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px]">
                      <EditableDescription
                        value={descInput[index] ?? item.name}
                        onChange={(i, val) => {
                          setDescInput((p) => ({ ...p, [i]: val }));
                        }}
                        index={index}
                        onKeyDownCapture={onDescriptionKeyDown}
                        onBlur={() => {
                          const v = descInput[index];
                          if (v !== undefined) {
                            onChangeDescription?.(index, v);
                            setDescInput((p) => {
                              const next = { ...p };
                              delete next[index];
                              return next;
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="self-start text-right text-[11px]">
                      <input
                        className="w-full bg-transparent text-right outline-none"
                        inputMode="decimal"
                        value={qtyInput[index] ?? String(item.quantity)}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || numericPattern.test(v))
                            setQtyInput((p) => ({ ...p, [index]: v }));
                        }}
                        onBlur={(e) => {
                          const v = e.target.value;
                          onChangeQuantity?.(index, parseNumber(v, item.quantity));
                          setQtyInput((p) => {
                            const next = { ...p };
                            delete next[index];
                            return next;
                          });
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const v = (e.target as HTMLInputElement).value;
                            onChangeQuantity?.(index, parseNumber(v, item.quantity));
                            setQtyInput((p) => {
                              const next = { ...p };
                              delete next[index];
                              return next;
                            });
                          } else if (e.key === "Escape") {
                            setQtyInput((p) => {
                              const next = { ...p };
                              next[index] = String(item.quantity);
                              return next;
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="self-start text-right text-[11px]">
                      <input
                        className="w-full bg-transparent text-right outline-none"
                        value={item.unit || ""}
                        onChange={(e) => onChangeUnit?.(index, e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="self-start text-right text-[11px]">
                      <input
                        className="w-full bg-transparent text-right outline-none"
                        inputMode="decimal"
                        value={priceInput[index] ?? String(item.price)}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || numericPattern.test(v))
                            setPriceInput((p) => ({ ...p, [index]: v }));
                        }}
                        onBlur={(e) => {
                          const v = e.target.value;
                          onChangePrice?.(index, parseNumber(v, item.price));
                          setPriceInput((p) => {
                            const next = { ...p };
                            delete next[index];
                            return next;
                          });
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const v = (e.target as HTMLInputElement).value;
                            onChangePrice?.(index, parseNumber(v, item.price));
                            setPriceInput((p) => {
                              const next = { ...p };
                              delete next[index];
                              return next;
                            });
                          } else if (e.key === "Escape") {
                            setPriceInput((p) => {
                              const next = { ...p };
                              next[index] = String(item.price);
                              return next;
                            });
                          }
                        }}
                      />
                    </div>
                    {includeVAT && (
                      <>
                        <div className="self-start text-right text-[11px]">
                          <input
                            className="w-full bg-transparent text-right outline-none"
                            inputMode="decimal"
                            value={discountInput[index] ?? String(item.discountRate ?? 0)}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === "" || numericPattern.test(v))
                                setDiscountInput((p) => ({ ...p, [index]: v }));
                            }}
                            onBlur={(e) => {
                              const v = e.target.value;
                              onChangeDiscount?.(index, parseNumber(v, item.discountRate ?? 0));
                              setDiscountInput((p) => {
                                const next = { ...p };
                                delete next[index];
                                return next;
                              });
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const v = (e.target as HTMLInputElement).value;
                                onChangeDiscount?.(index, parseNumber(v, item.discountRate ?? 0));
                                setDiscountInput((p) => {
                                  const next = { ...p };
                                  delete next[index];
                                  return next;
                                });
                              } else if (e.key === "Escape") {
                                setDiscountInput((p) => {
                                  const next = { ...p };
                                  next[index] = String(item.discountRate ?? 0);
                                  return next;
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="self-start text-right text-[11px]">
                          <input
                            className="w-full bg-transparent text-right outline-none"
                            inputMode="decimal"
                            value={vatInput[index] ?? String(item.vat ?? 0)}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === "" || numericPattern.test(v))
                                setVatInput((p) => ({ ...p, [index]: v }));
                            }}
                            onBlur={(e) => {
                              const v = e.target.value;
                              onChangeVat?.(index, parseNumber(v, item.vat ?? 0));
                              setVatInput((p) => {
                                const next = { ...p };
                                delete next[index];
                                return next;
                              });
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const v = (e.target as HTMLInputElement).value;
                                onChangeVat?.(index, parseNumber(v, item.vat ?? 0));
                                setVatInput((p) => {
                                  const next = { ...p };
                                  delete next[index];
                                  return next;
                                });
                              } else if (e.key === "Escape") {
                                setVatInput((p) => {
                                  const next = { ...p };
                                  next[index] = String(item.vat ?? 0);
                                  return next;
                                });
                              }
                            }}
                          />
                        </div>
                      </>
                    )}
                    <div className="self-start text-right text-[11px]">
                      {formatNumber(itemTotal)}
                    </div>
                  </div>
                </SortableRow>
              );
            })}
          </SortableContext>
        </DndContext>
      ) : interactive ? (
        lineItems.map((item, index) => {
          const itemSubtotal = item.price * item.quantity;
          const discountAmount = itemSubtotal * ((item.discountRate || 0) / 100);
          const itemAfterDiscount = itemSubtotal - discountAmount;
          const vatAmount = itemAfterDiscount * ((item.vat || 0) / 100);
          const itemTotal = includeVAT ? itemAfterDiscount + vatAmount : itemAfterDiscount;
          return (
            <div
              key={item.id ? `line-item-${item.id}` : `line-item-${index.toString()}`}
              className={`li-row grid ${gridCols} group relative mb-1 w-full items-start gap-2 py-1`}>
              <div className="flex items-center justify-end gap-1 self-start text-right text-[11px]">
                <span>{index + 1}</span>
              </div>
              <div className="text-[11px]">
                <span className="break-words whitespace-pre-wrap">{item.name}</span>
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
              <div className="self-start text-right text-[11px]">
                {formatNumber(
                  itemSubtotal -
                    itemSubtotal * ((item.discountRate || 0) / 100) +
                    (itemSubtotal - itemSubtotal * ((item.discountRate || 0) / 100)) *
                      ((item.vat || 0) / 100)
                )}
              </div>
            </div>
          );
        })
      ) : (
        lineItems.map((item, index) => {
          const itemSubtotal = item.price * item.quantity;
          const discountAmount = itemSubtotal * ((item.discountRate || 0) / 100);
          const itemAfterDiscount = itemSubtotal - discountAmount;
          const vatAmount = itemAfterDiscount * ((item.vat || 0) / 100);
          const itemTotal = includeVAT ? itemAfterDiscount + vatAmount : itemAfterDiscount;
          return (
            <div
              key={item.id ? `line-item-${item.id}` : `line-item-${index.toString()}`}
              className={`li-row group relative mb-1 grid w-full items-start gap-2 py-1`}
              style={{ gridTemplateColumns: gridStatic }}>
              <div className="self-start text-right text-[11px] tabular-nums">{index + 1}</div>
              <div className="text-[11px]">
                <span className="break-words whitespace-pre-wrap">{item.name}</span>
              </div>

              <div className="self-start text-right text-[11px] tabular-nums">{item.quantity}</div>
              <div className="self-start text-right text-[11px]">{item.unit || "—"}</div>
              <div className="self-start text-right text-[11px] tabular-nums">{formatNumber(item.price)}</div>
              {includeVAT && (
                <>
                  <div className="self-start text-right text-[11px] tabular-nums">
                    {item.discountRate ? <span className="text-red-600">{item.discountRate}%</span> : "—"}
                  </div>
                  <div className="self-start text-right text-[11px] tabular-nums">
                    {item.vat ? `${item.vat}%` : "—"}
                  </div>
                </>
              )}
              <div className="self-start text-right text-[11px] tabular-nums font-medium">{formatNumber(itemTotal)}</div>
            </div>
          );
        })
      )}
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
type SortableHandleCtxType = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
};

const SortableHandleCtx = React.createContext<SortableHandleCtxType | null>(null);

function SortableHandle() {
  const ctx = React.useContext(SortableHandleCtx);
  if (!ctx) return <GripVertical className="text-muted-foreground h-3.5 w-3.5" />;
  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground cursor-grab"
      {...ctx.attributes}
      {...ctx.listeners}>
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  );
}
