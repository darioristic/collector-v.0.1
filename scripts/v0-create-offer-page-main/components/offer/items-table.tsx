"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { OfferItem } from "@/lib/validations/offer"
import { calculateItemTotal } from "@/lib/utils/calculations"

interface ItemsTableProps {
  items: OfferItem[]
  onChange: (items: OfferItem[]) => void
  currency: "RSD" | "EUR"
}

export function ItemsTable({ items, onChange, currency }: ItemsTableProps) {
  const addItem = () => {
    const newItem: OfferItem = {
      id: Date.now().toString(),
      name: "",
      description: "",
      quantity: 1,
      unit: "kom",
      unitPrice: 0,
      discount: 0,
      vatRate: 20,
    }
    onChange([...items, newItem])
  }

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, field: keyof OfferItem, value: any) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">Naziv</TableHead>
              <TableHead className="w-[150px]">Opis</TableHead>
              <TableHead className="w-[80px]">Količina</TableHead>
              <TableHead className="w-[80px]">Jedinica</TableHead>
              <TableHead className="w-[100px]">Cena</TableHead>
              <TableHead className="w-[80px]">Popust %</TableHead>
              <TableHead className="w-[80px]">PDV %</TableHead>
              <TableHead className="w-[120px] text-right">Ukupno</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <TableCell>
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      placeholder="Naziv stavke"
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Opis"
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", Number.parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                      placeholder="kom"
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.discount}
                      onChange={(e) => updateItem(item.id, "discount", Number.parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.01"
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.vatRate}
                      onChange={(e) => updateItem(item.id, "vatRate", Number.parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.01"
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {calculateItemTotal(item).toFixed(2)} {currency}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <Button type="button" variant="outline" onClick={addItem} className="w-full bg-transparent">
        <Plus className="mr-2 h-4 w-4" />
        Dodaj stavku
      </Button>
    </div>
  )
}
