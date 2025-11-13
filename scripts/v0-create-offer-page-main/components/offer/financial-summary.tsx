"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { OfferItem } from "@/lib/validations/offer"
import {
  calculateSubtotal,
  calculateTotalDiscount,
  calculateTotalVat,
  calculateGrandTotal,
  calculateVatByRate,
  numberToWords,
} from "@/lib/utils/calculations"

interface FinancialSummaryProps {
  items: OfferItem[]
  currency: "RSD" | "EUR"
  showInWords?: boolean
}

export function FinancialSummary({ items, currency, showInWords = false }: FinancialSummaryProps) {
  const subtotal = calculateSubtotal(items)
  const totalDiscount = calculateTotalDiscount(items)
  const totalVat = calculateTotalVat(items)
  const grandTotal = calculateGrandTotal(items)
  const vatBreakdown = calculateVatByRate(items)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Finansijski pregled</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Osnovica (bez PDV-a):</span>
          <span className="font-medium">
            {subtotal.toFixed(2)} {currency}
          </span>
        </div>

        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ukupan popust:</span>
            <span className="font-medium text-green-600">
              -{totalDiscount.toFixed(2)} {currency}
            </span>
          </div>
        )}

        {vatBreakdown.length > 0 && (
          <div className="space-y-2">
            {vatBreakdown.map(({ rate, amount }) => (
              <div key={rate} className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT ({rate}%):</span>
                <span className="font-medium">
                  {amount.toFixed(2)} {currency}
                </span>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-semibold">Ukupno za plaćanje:</span>
          <span className="text-2xl font-bold">
            {grandTotal.toFixed(2)} {currency}
          </span>
        </div>

        {showInWords && grandTotal > 0 && (
          <div className="pt-2 text-sm text-muted-foreground italic">
            Slovima: {numberToWords(grandTotal, currency)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
