"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TemplateProps } from "./types";
import { EditorContent } from "./components/editor-content";
import { LineItems } from "./components/line-items";
import { Meta } from "./components/meta";
import { Summary } from "./components/summary";
import MinimalTiptapEditor from "@/components/ui/custom/minimal-tiptap/minimal-tiptap";

export function HtmlTemplate({
  invoice_number,
  issue_date,
  due_date,
  template,
  line_items,
  customer_details,
  from_details,
  payment_details,
  note_details,
  currency,
  customer_name: _customer_name,
  width = "100%",
  height: _height = "100%",
  amountBeforeDiscount = 0,
  discountTotal = 0,
  subtotal = 0,
  totalVat = 0,
  total = 0,
  editable = false,
  interactive = true,
  editors,
}: TemplateProps) {
  // Helpers to convert between plain text (with \n) and Tiptap JSON doc
  const stringToDoc = (input: unknown) => {
    if (input && typeof input === "object") return input as object;
    const text = typeof input === "string" ? input : "";
    const lines = text.split("\n");
    return {
      type: "doc",
      content: lines.map((line) => ({
        type: "paragraph",
        content: line ? [{ type: "text", text: line }] : [],
      })),
    } as object;
  };
  const contentToString = (content: unknown): string => {
    // Expecting Tiptap JSON: doc -> paragraphs -> text nodes (ignore marks)
    try {
      const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
      if (!doc?.content) return "";
      return doc.content
        .map((p) => (p?.content ? p.content.map((n) => n.text ?? "").join("") : ""))
        .join("\n");
    } catch {
      return typeof content === "string" ? content : "";
    }
  };
  // Approximate pagination to A4-like sections by limiting number of line items per page.
  // This improves layout (prevents toolbar overlap) and prepares for PDF rendering later.
  const itemsPerPage = template.include_vat ? 14 : 18;
  const pages: Array<typeof line_items> = [];
  for (let i = 0; i < line_items.length; i += itemsPerPage) {
    pages.push(line_items.slice(i, i + itemsPerPage));
  }
  const _isMultiPage = pages.length > 1;

  const PageContainer = ({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) => (
    <div className={isLast ? "" : "break-after-page"}>{children}</div>
  );

  return (
    <ScrollArea
      className="bg-transparent w-full md:w-auto h-full print-wrapper"
      style={{
        width: "100%",
        maxWidth: width,
        height: "100%",
      }}
    >
      <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
        {/* Print helpers */}
        <style>{`
          @media print {
            .break-after-page { page-break-after: always; }
            .print-wrapper { height: auto !important; overflow: visible !important; }
            .print-wrapper > div { height: auto !important; }
          }
        `}</style>
        {pages.map((items, pageIndex) => {
          const isFirst = pageIndex === 0;
          const isLast = pageIndex === pages.length - 1;
          return (
            <PageContainer key={`page-${pageIndex}`} isLast={isLast}>
              {isFirst && (
                <>
        <div className="mt-0">
          <Meta
            template={template}
            invoiceNumber={invoice_number}
            issueDate={issue_date}
            dueDate={due_date}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8">
          <div>
            <p className="text-[11px] text-[#878787] font-mono mb-2 block">
              {template.from_label}
            </p>
                      {editable && editors?.from ? (
                        <MinimalTiptapEditor
                className="mt-0"
                          value={stringToDoc(editors.from.value)}
                          onChange={(val) => {
                            editors.from && editors.from.onChange(contentToString(val));
                            setDirty(true);
                          }}
                          output="json"
                          editorContentClassName="min-h-24 font-mono text-[11px] leading-4 whitespace-pre-wrap break-words"
                hideToolbar
                unstyled
              />
            ) : (
              <EditorContent content={from_details} />
            )}
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-[11px] text-[#878787] font-mono mb-2 block">
              {template.customer_label}
            </p>
                      {editable && editors?.customer ? (
                        <MinimalTiptapEditor
                className="mt-0"
                          value={stringToDoc(editors.customer.value)}
                          onChange={(val) => {
                            editors.customer && editors.customer.onChange(contentToString(val));
                            setDirty(true);
                          }}
                          output="json"
                          editorContentClassName="min-h-24 font-mono text-[11px] leading-4 whitespace-pre-wrap break-words"
                hideToolbar
                unstyled
              />
            ) : (
              <EditorContent content={customer_details} />
            )}
          </div>
        </div>
                </>
              )}

        <div className="mt-4">
          <LineItems
                  lineItems={items}
            currency={currency}
            descriptionLabel={template.description_label}
            quantityLabel={template.quantity_label}
            priceLabel={template.price_label}
            totalLabel={template.total_label}
            includeVAT={template.include_vat}
                  editable={editable}
                  interactive={interactive}
                  onChangeDescription={editors?.onLineItemDescriptionChange}
                  onChangeQuantity={editors?.onLineItemQuantityChange}
                  onChangePrice={editors?.onLineItemPriceChange}
                  onChangeUnit={editors?.onLineItemUnitChange}
                  onChangeVat={editors?.onLineItemVatChange}
                  onChangeDiscount={editors?.onLineItemDiscountChange}
                  onAddLineItem={isLast ? editors?.onAddLineItem : undefined}
                  activeAutocompleteIndex={editors?.activeAutocompleteIndex}
                  onAutocompleteCommit={editors?.onAutocompleteCommit}
                  onDeleteLineItem={editors?.onDeleteLineItem}
                  onMoveLineItem={editors?.onMoveLineItem}
          />
        </div>

              {isLast && (
                <>
        <div className="mt-6 md:mt-8 flex justify-end mb-6 md:mb-8">
          <div className="w-full max-w-md">
            <Summary
              includeVAT={template.include_vat}
              includeTax={template.include_tax}
              taxRate={template.tax_rate}
              currency={currency}
              vatLabel={template.vat_label}
              taxLabel={template.tax_label}
              totalLabel={template.total_label}
              lineItems={line_items}
              amountBeforeDiscount={amountBeforeDiscount}
              discountTotal={discountTotal}
              subtotal={subtotal}
              totalVat={totalVat}
              total={total}
            />
          </div>
        </div>

        <div className="flex flex-col space-y-6 md:space-y-8 mt-auto">
            <div>
              <p className="text-[11px] text-[#878787] font-mono mb-2 block">
                {template.note_label}
              </p>
                    {editable && editors?.notes ? (
                      <MinimalTiptapEditor
                        className="mt-0"
                        value={
                          typeof editors.notes.value === "string"
                            ? stringToDoc(String(editors.notes.value))
                            : (editors.notes.value as object)
                        }
                        onChange={(val) => editors.notes && editors.notes.onChange(val)}
                        output="json"
                        editorContentClassName="min-h-24 font-mono text-[11px] leading-4 whitespace-pre-wrap"
                        hideToolbar
                        unstyled
                      />
                    ) : (
              note_details ? <EditorContent content={note_details} /> : null
            )}
            </div>

          <div className="pt-6 mt-auto">
            <div className="text-[11px] text-[#878787] font-mono">
              {editable && editors?.payment ? (
                <MinimalTiptapEditor
                  className="mt-0"
                  value={stringToDoc(editors.payment.value)}
                  onChange={(val) => editors.payment && editors.payment.onChange(contentToString(val))}
                  output="json"
                  editorContentClassName="min-h-24 font-mono text-[11px] leading-4 whitespace-pre-wrap break-words"
                  hideToolbar
                  unstyled
                />
              ) : (
              <EditorContent content={payment_details} />
              )}
            </div>
          </div>
        </div>
                </>
              )}
            </PageContainer>
          );
        })}
      </div>
    </ScrollArea>
  );
}
