"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { TemplateProps } from "./types";
import { EditorContent } from "./components/editor-content";
import { LineItems } from "./components/line-items";
import { Logo } from "./components/logo";
import { Meta } from "./components/meta";
import { Summary } from "./components/summary";

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
  customer_name,
  width = "100%",
  height: _height = "100%",
  amountBeforeDiscount = 0,
  discountTotal = 0,
  subtotal = 0,
  totalVat = 0,
  total = 0,
}: TemplateProps) {
  return (
    <ScrollArea
      className="bg-background w-full md:w-auto h-full"
      style={{
        width: "100%",
        maxWidth: width,
        height: "100%",
      }}
    >
      <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
        <div className="flex flex-col">
          {template.logo_url && (
            <Logo logo={template.logo_url} customerName={customer_name || ""} />
          )}
        </div>

        <div className="mt-8">
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
            <EditorContent content={from_details} />
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-[11px] text-[#878787] font-mono mb-2 block">
              {template.customer_label}
            </p>
            <EditorContent content={customer_details} />
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
          />
        </div>

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
          {note_details && (
            <div>
              <p className="text-[11px] text-[#878787] font-mono mb-2 block">
                {template.note_label}
              </p>
              <EditorContent content={note_details} />
            </div>
          )}

          <div className="pt-6 border-t border-border mt-auto">
            <div className="text-[11px] text-[#878787] font-mono">
              <EditorContent content={payment_details} />
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

