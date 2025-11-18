"use client";
import { SummaryCore } from "@crm/ui/invoice";
import { format } from "date-fns";
import Image from "next/image";
import * as React from "react";
import MinimalTiptapEditor from "@/components/ui/custom/minimal-tiptap/minimal-tiptap";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { EditorContent } from "./components/editor-content";
import { LineItems } from "./components/line-items";
import { Meta } from "./components/meta";
import { Summary } from "./components/summary";
import { paginateByHeightsWithExtras, paginateFixed, paginateItems } from "./pager";
import type { TemplateProps } from "./types";

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
  items_per_page,
  pagination_mode = "measured",
  scroll_snap = true,
  lazy = true,
  preview_mode = false,
  editors
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
        content: line ? [{ type: "text", text: line }] : []
      }))
    } as object;
  };
  const contentToString = (content: unknown): string => {
    // Expecting Tiptap JSON: doc -> paragraphs -> text nodes (ignore marks)
    try {
      const doc = content as {
        content?: Array<{ content?: Array<{ text?: string }> }>;
      };
      if (!doc?.content) return "";
      return doc.content
        .map((p) => (p?.content ? p.content.map((n) => n.text ?? "").join("") : ""))
        .join("\n");
    } catch {
      return typeof content === "string" ? content : "";
    }
  };
  const cfg = React.useMemo(
    () =>
      ({
        pageHeightMm: 297,
        headerHeightMm: 40,
        footerHeightMm: 35,
        minLastPageRows: 3
      }) as const,
    []
  );
  const [measuredPages, setMeasuredPages] = React.useState<number[][] | null>(null);
  const [pages, setPages] = React.useState<Array<typeof line_items>>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [_dirty, setDirty] = React.useState(false);
  const pagesRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  React.useEffect(() => {
    const wrapper = document.querySelector<HTMLElement>(".print-wrapper");
    if (!wrapper) return;
    const onScroll = () => {
      const tops = pagesRefs.current.map((el) => {
        if (!el) return Infinity;
        const rect = el.getBoundingClientRect();
        const parentRect = wrapper.getBoundingClientRect();
        return Math.abs(rect.top - parentRect.top);
      });
      let idx = 0;
      let min = Infinity;
      for (let i = 0; i < tops.length; i++) {
        if (tops[i] < min) {
          min = tops[i];
          idx = i;
        }
      }
      setCurrentPage(idx + 1);
    };
    wrapper.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => wrapper.removeEventListener("scroll", onScroll);
  }, [pages.length]);

  React.useEffect(() => {
    let idx = paginateItems(
      line_items.map((li) => ({
        name: li.name,
        quantity: li.quantity,
        price: li.price
      })),
      cfg
    );
    if (pagination_mode === "fixed" && items_per_page && items_per_page > 0) {
      idx = paginateFixed(line_items.length, items_per_page);
    }
    setMeasuredPages((p) => p ?? null);
    setPages(idx.map((idxs) => idxs.map((i) => line_items[i])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line_items.length, pagination_mode, items_per_page]);

  const measureRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (pagination_mode !== "measured") return;
    const el = measureRef.current;
    if (!el) return;

    // Wait for layout to settle before measuring
    const measure = () => {
      const rows = Array.from(el.querySelectorAll<HTMLElement>(".li-row"));
      if (!rows.length) return;
      const heights = rows.map((r) => r.offsetHeight);
      const headerEl = el.querySelector<HTMLElement>(".measure-header");
      const footerEl = el.querySelector<HTMLElement>(".measure-footer");

      // Measure Meta and From/To sections separately
      const metaEl = headerEl?.querySelector<HTMLElement>(".meta-section");
      const fromToEl = headerEl?.querySelector<HTMLElement>(".from-to-section");

      const metaHeight = metaEl ? metaEl.offsetHeight : 0;
      const fromToHeight = fromToEl ? fromToEl.offsetHeight : 0;

      // extraTopPx = ONLY From/To section (Meta is handled by headerPx in pager)
      // But we override the config's headerHeightMm with actual measured height
      const extraTopPx = fromToHeight;

      console.log('📏 Measurements:', { metaHeight, fromToHeight, extraTopPx });

      // Measure footer components separately
      const summaryEl = footerEl?.querySelector<HTMLElement>(".measure-footer > div:first-child");
      const notesContainerEl = footerEl?.querySelector<HTMLElement>(
        ".measure-footer > div:nth-child(2)"
      );
      const paymentContainerEl = footerEl?.querySelector<HTMLElement>(
        ".measure-footer > div:last-child"
      );

      const summaryHeight = summaryEl ? summaryEl.offsetHeight : 0;
      const notesHeight = notesContainerEl ? notesContainerEl.offsetHeight : 0;
      const paymentHeight = paymentContainerEl ? paymentContainerEl.offsetHeight : 0;

      // Footer base height = summary + payment (notes handled separately)
      const footerBaseHeight = summaryHeight + paymentHeight + 30; // 30px for spacing

      // Use footer base height for last page capacity calculation
      // Notes will be added and may require additional pages if too long
      const extraBottomPx = footerBaseHeight + 10; // Small 10px safety margin

      const idxPages = paginateByHeightsWithExtras(
        heights,
        cfg,
        extraTopPx,
        extraBottomPx,
        notesHeight
      );
      setMeasuredPages(idxPages);
      setPages(idxPages.map((idxs) => idxs.map((i) => line_items[i])));
    };

    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(measure);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line_items, pagination_mode]);

  const PageContainer = ({
    children,
    isLast,
    pageIndex
  }: {
    children: React.ReactNode;
    isLast?: boolean;
    pageIndex?: number;
  }) => (
    <div
      className={cn(
        !isLast && "break-after-page",
        scroll_snap && "snap-start",
        preview_mode && "preview-page",
        !preview_mode && "mb-8"
      )}
      style={
        preview_mode
          ? {
              width: "210mm",
              minHeight: "297mm",
              background: "white",
              marginBottom: isLast ? 0 : "32px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.15)",
              borderRadius: "8px",
              position: "relative",
              overflow: "hidden"
            }
          : {
              background: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08)",
              marginTop: pageIndex && pageIndex > 0 ? "32px" : "0",
              marginBottom: "0",
              padding: "0",
              borderTop: "none"
            }
      }>
      {children}
    </div>
  );

  return (
    <ScrollArea
      className={cn(
        "print-wrapper h-full w-full md:w-auto",
        scroll_snap && "snap-y snap-mandatory",
        preview_mode && "preview-wrapper",
        !preview_mode && "bg-gray-100"
      )}
      style={{
        width: "100%",
        maxWidth: preview_mode ? undefined : width,
        height: "100%",
        scrollSnapType: scroll_snap ? "y mandatory" : undefined,
        backgroundColor: preview_mode ? "transparent" : "#f3f4f6"
      }}>
      {/* hidden measurement container */}
      <div
        ref={measureRef}
        style={{
          position: "absolute",
          left: -10000,
          top: 0,
          visibility: "hidden",
          width: "210mm"
        }}
        className={preview_mode ? "preview-page" : ""}>
        <div className="p-[20px]">
          <div className="measure-header mt-0">
            <div className="meta-section">
              <Meta
                template={template}
                invoiceNumber={invoice_number}
                issueDate={issue_date}
                dueDate={due_date}
              />
            </div>
            <div className="from-to-section mt-4 grid grid-cols-2 gap-8 pl-4">
              <div>
                <p className="mb-2 text-[11px] font-medium text-[#878787]">{template.from_label}</p>
                <div className="text-[11px] leading-relaxed">
                  <EditorContent content={from_details} />
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-medium text-[#878787]">To</p>
                <div className="text-[11px] leading-relaxed">
                  <EditorContent content={customer_details} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <LineItems
              lineItems={line_items}
              currency={currency}
              descriptionLabel={template.description_label}
              quantityLabel={template.quantity_label}
              priceLabel={template.price_label}
              totalLabel={template.total_label}
              includeVAT={template.include_vat}
              editable={false}
              interactive={false}
            />
          </div>
          <div className="measure-footer mt-6 md:mt-8">
            <div className="mb-6 flex justify-end md:mb-8">
              <div className="w-full max-w-md">
                <SummaryCore
                  includeVAT={template.include_vat}
                  includeTax={template.include_tax}
                  taxRate={template.tax_rate || 0}
                  currency={currency}
                  vatLabel={template.vat_label}
                  taxLabel={template.tax_label}
                  totalLabel={template.total_label}
                  amountBeforeDiscount={amountBeforeDiscount}
                  discountTotal={discountTotal}
                  subtotal={subtotal}
                  totalVat={totalVat}
                  total={total}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-6 md:space-y-8">
              {note_details ? (
                <div>
                  <p className="mb-2 block font-mono text-[11px] text-[#878787]">
                    {template.note_label}
                  </p>
                  <EditorContent content={note_details} />
                </div>
              ) : null}
              <div className="pt-6">
                <div className="font-mono text-[11px] text-[#878787]">
                  <EditorContent content={payment_details} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          preview_mode ? "flex flex-col items-center" : "flex h-full flex-col pb-4 sm:pb-6 md:pb-8",
          !preview_mode && "bg-gray-100"
        )}
        style={
          !preview_mode
            ? {
                marginTop: 0,
                paddingTop: 0,
                paddingLeft: 0,
                paddingRight: 0
              }
            : undefined
        }>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @page {
            size: A4;
            margin: 20mm;
          }
                   @media print {
                     .break-after-page { page-break-after: always; }
                     .print-wrapper { height: auto !important; overflow: visible !important; }
                     .print-wrapper > div { height: auto !important; }
                     .print-wrapper { width: 210mm !important; max-width: 210mm !important; }
                     body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                     .invoice-footer { position: fixed; bottom: 20px; left: 20px; right: 20px; }
                     .notes-section { page-break-inside: auto !important; break-inside: auto !important; }
                   }
          .print-wrapper[data-slot="scroll-area"] {
            background-color: #f3f4f6 !important;
          }
          .print-wrapper [data-slot="scroll-area-viewport"] {
            background-color: #f3f4f6 !important;
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
          .invoice-page {
            border-top: none !important;
          }
          .invoice-page > div:first-child {
            border-top: none !important;
          }
          [data-slot="scroll-area"] > div:first-child {
            border-top: none !important;
          }
          .print-wrapper > div > div:first-child > div {
            margin-top: 0 !important;
          }
        `
          }}
        />
        {pages.map((items, pageIndex) => {
          const isFirst = pageIndex === 0;
          const isLast = pageIndex === pages.length - 1;
          const shouldRenderPage = !lazy || Math.abs(pageIndex + 1 - currentPage) <= 1;
          // Calculate start index for line item numbering (sum of items on previous pages)
          const startIndex = pages
            .slice(0, pageIndex)
            .reduce((sum, pageItems) => sum + pageItems.length, 0);
          return (
            <div
              key={"page-" + pageIndex}
              ref={(el) => {
                pagesRefs.current[pageIndex] = el;
              }}>
              <PageContainer isLast={isLast} pageIndex={pageIndex}>
                <div
                  className="invoice-page relative flex flex-col px-[20px] pb-[20px]"
                  style={{
                    minHeight: preview_mode ? "297mm" : "297mm",
                    height: preview_mode ? "297mm" : "297mm",
                    paddingTop: preview_mode ? "20px" : "0",
                    borderTop: "none",
                    display: "flex",
                    flexDirection: "column"
                  }}>
                  {/* Header on every page */}
                  <div
                    className={cn("mb-4 flex-shrink-0 pb-4", !preview_mode && "pt-[20px]")}
                    style={{ borderTop: "none" }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5 font-mono">
                        <div className="text-[13px]">
                          <span className="text-[#878787]">Invoice No: </span>
                          <span className="text-gray-900 tabular-nums">{invoice_number}</span>
                        </div>
                        <div className="text-[11px]">
                          <span className="text-[#878787]">Issue Date: </span>
                          <span className="text-gray-900 tabular-nums">
                            {format(new Date(issue_date), "dd/MM/yyyy")}
                          </span>
                        </div>
                        {due_date && (
                          <div className="text-[11px]">
                            <span className="text-[#878787]">Due Date: </span>
                            <span className="text-gray-900 tabular-nums">
                              {format(new Date(due_date), "dd/MM/yyyy")}
                            </span>
                          </div>
                        )}
                      </div>
                      {template.logo_url && (
                        <div className="flex-shrink-0">
                          <Image
                            src={template.logo_url}
                            alt="Company Logo"
                            width={64}
                            height={64}
                            className="h-16 w-16 object-contain"
                          />
                        </div>
                      )}
                    </div>
                    {/* Page indicator for multi-page invoices */}
                    {pages.length > 1 && (
                      <div className="mt-2 text-right">
                        <span className="font-mono text-[10px] text-[#878787]">
                          Page {pageIndex + 1} of {pages.length}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className="flex-1"
                    style={{
                      minHeight: 0,
                      paddingBottom: isLast ? "0px" : "120px",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      overflow: "visible"
                    }}>
                    {isFirst && (
                      <>
                        <div className="mt-4 grid grid-cols-2 gap-8 pl-4">
                          <div>
                            <p className="mb-2 text-[11px] font-medium text-[#878787]">
                              {template.from_label}
                            </p>
                            <div className="text-[11px] leading-relaxed">
                              {editable && editors?.from ? (
                                <MinimalTiptapEditor
                                  className="mt-0"
                                  value={stringToDoc(editors.from.value)}
                                  onChange={(val) => {
                                    if (editors.from) {
                                      editors.from.onChange(contentToString(val));
                                    }
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
                          </div>
                          <div>
                            <p className="mb-2 text-[11px] font-medium text-[#878787]">To</p>
                            <div className="text-[11px] leading-relaxed">
                              {editable && editors?.customer ? (
                                <MinimalTiptapEditor
                                  className="mt-0"
                                  value={stringToDoc(editors.customer.value)}
                                  onChange={(val) => {
                                    if (editors.customer) {
                                      editors.customer.onChange(contentToString(val));
                                    }
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
                        startIndex={startIndex}
                        showHeader={true}
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
                        <div
                          className="mt-6 mb-6 flex justify-end md:mt-8 md:mb-8"
                          style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                          <div>
                            {editable || interactive ? (
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
                            ) : (
                              <SummaryCore
                                includeVAT={template.include_vat}
                                includeTax={template.include_tax}
                                taxRate={template.tax_rate || 0}
                                currency={currency}
                                vatLabel={template.vat_label}
                                taxLabel={template.tax_label}
                                totalLabel={template.total_label}
                                amountBeforeDiscount={amountBeforeDiscount}
                                discountTotal={discountTotal}
                                subtotal={subtotal}
                                totalVat={totalVat}
                                total={total}
                              />
                            )}
                          </div>
                        </div>

                        <div
                          className="notes-section flex flex-col space-y-6 md:space-y-8"
                          style={{
                            marginBottom: "0px",
                            marginTop: "auto",
                            pageBreakInside: "auto",
                            breakInside: "auto",
                            minHeight: 0,
                            flexShrink: 1
                          }}>
                          <div
                            className="notes-section"
                            style={{
                              pageBreakInside: "auto",
                              breakInside: "auto"
                            }}>
                            <p className="mb-2 block font-mono text-[11px] text-[#878787]">
                              {template.note_label}
                            </p>
                            {editable && editors?.notes ? (
                              <div
                                style={{
                                  pageBreakInside: "auto",
                                  breakInside: "auto"
                                }}>
                                <MinimalTiptapEditor
                                  className="mt-0"
                                  value={
                                    typeof editors.notes.value === "string"
                                      ? stringToDoc(String(editors.notes.value))
                                      : (editors.notes.value as object)
                                  }
                                  onChange={(val) => editors.notes && editors.notes.onChange(val)}
                                  output="json"
                                  editorContentClassName="min-h-24 font-mono text-[11px] leading-4 whitespace-pre-wrap break-words"
                                  hideToolbar
                                  unstyled
                                />
                              </div>
                            ) : note_details ? (
                              <div
                                className="notes-section"
                                style={{
                                  pageBreakInside: "auto",
                                  breakInside: "auto"
                                }}>
                                <EditorContent content={note_details} />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer on every page */}
                  <div
                    className="mt-auto flex-shrink-0 border-t border-gray-200 pt-4"
                    style={{
                      pageBreakInside: "avoid",
                      breakInside: "avoid",
                      marginTop: "auto",
                      flexShrink: 0,
                      minHeight: "80px"
                    }}>
                    <div className="mb-3 font-mono text-[11px] text-[#878787]">
                      {editable && editors?.payment ? (
                        <MinimalTiptapEditor
                          className="mt-0"
                          value={stringToDoc(editors.payment.value)}
                          onChange={(val) =>
                            editors.payment && editors.payment.onChange(contentToString(val))
                          }
                          output="json"
                          editorContentClassName="min-h-24 font-mono text-[11px] leading-4 whitespace-pre-wrap break-words"
                          hideToolbar
                          unstyled
                        />
                      ) : (
                        <EditorContent content={payment_details} />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#878787]">
                      <span className="tabular-nums">{new Date().toLocaleDateString()}</span>
                      <span className="tabular-nums">
                        {"Page " + (pageIndex + 1) + " / " + pages.length}
                      </span>
                    </div>
                  </div>
                </div>
              </PageContainer>
            </div>
          );
        })}
        {/* sticky indicator of current page when scroll snapping */}
        {scroll_snap && (
          <div className="fixed right-4 bottom-4 rounded bg-white/80 px-3 py-1 text-[11px] tabular-nums shadow">
            {"Page " + currentPage + " / " + pages.length}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
