"use client";

import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useQuote } from "@/src/hooks/useQuotes";
import { FileEdit, Trash2 } from "lucide-react";
import type { Quote } from "@crm/types";

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  sent: "default",
  accepted: "default",
  rejected: "destructive"
};

type QuoteDetailProps = {
  quoteId: number;
  onEdit?: (quote: Quote) => void;
  onDelete?: (quoteId: number) => void;
};

export function QuoteDetail({ quoteId, onEdit, onDelete }: QuoteDetailProps) {
  const { data: quote, isLoading } = useQuote(quoteId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading quote details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!quote) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">Quote not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Quote {quote.quoteNumber}
              <Badge variant={statusVariants[quote.status]}>{quote.status}</Badge>
            </CardTitle>
            <CardDescription>
              Issued on {quote.issueDate}
              {quote.expiryDate && ` • Expires on ${quote.expiryDate}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button onClick={() => onEdit(quote)} variant="outline" size="sm">
                <FileEdit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(quote.id)}
                variant="outline"
                size="sm"
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quote Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Currency</p>
            <p className="text-sm">{quote.currency}</p>
          </div>
          {quote.notes && (
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{quote.notes}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Quote Items */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Items</h3>
          {quote.items && quote.items.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.description || "—"}
                        {item.productId && (
                          <span className="text-xs text-muted-foreground block">
                            Product ID: {item.productId}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice, quote.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total, quote.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Subtotal
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(quote.subtotal, quote.currency)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Tax
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(quote.tax, quote.currency)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(quote.total, quote.currency)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No items in this quote</p>
          )}
        </div>

        {/* Metadata */}
        <Separator />
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Created:</span> {new Date(quote.createdAt).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Updated:</span> {new Date(quote.updatedAt).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}