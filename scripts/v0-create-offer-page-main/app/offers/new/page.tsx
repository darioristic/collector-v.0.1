"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { ChevronRight, FileText, Save, Send, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { type OfferFormData, offerSchema } from "@/lib/validations/offer"
import { ClientSelector } from "@/components/offer/client-selector"
import { ItemsTable } from "@/components/offer/items-table"
import { FinancialSummary } from "@/components/offer/financial-summary"
import { useToast } from "@/hooks/use-toast"

export default function NewOfferPage() {
  const { toast } = useToast()
  const [showAmountInWords, setShowAmountInWords] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      offerNumber: `PON-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      offerDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: "RSD",
      status: "draft",
      items: [
        {
          id: "1",
          name: "",
          description: "",
          quantity: 1,
          unit: "kom",
          unitPrice: 0,
          discount: 0,
          vatRate: 20,
        },
      ],
      notes: "",
      convertToInvoice: false,
      includeLogo: true,
    },
  })

  const items = watch("items")
  const currency = watch("currency")
  const status = watch("status")
  const offerDate = watch("offerDate")
  const validUntil = watch("validUntil")

  const onSubmit = (data: OfferFormData) => {
    console.log("Offer data:", data)
    toast({
      title: "Ponuda sačuvana",
      description: `Ponuda ${data.offerNumber} je uspešno sačuvana.`,
    })
  }

  const handleSaveDraft = () => {
    setValue("status", "draft")
    handleSubmit(onSubmit)()
  }

  const handleSendToClient = () => {
    setValue("status", "sent")
    handleSubmit(onSubmit)()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Nacrt", variant: "secondary" },
      sent: { label: "Poslato", variant: "default" },
      accepted: { label: "Prihvaćeno", variant: "default" },
      rejected: { label: "Odbijeno", variant: "destructive" },
    }
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Dashboard</span>
                <ChevronRight className="h-4 w-4" />
                <span>Ponude</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">Nova ponuda</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Nova ponuda</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => window.history.back()}>
                <X className="mr-2 h-4 w-4" />
                Otkaži
              </Button>
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="mr-2 h-4 w-4" />
                Sačuvaj nacrt
              </Button>
              <Button onClick={handleSendToClient}>
                <Send className="mr-2 h-4 w-4" />
                Pošalji klijentu
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* A4 Page Container */}
          <div className="max-w-[210mm] mx-auto bg-card shadow-lg">
            <div className="p-12 space-y-8">
              {/* Offer Header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold">PONUDA</h2>
                    <div className="flex items-center gap-2">
                      <Input
                        {...register("offerNumber")}
                        readOnly
                        className="w-auto bg-muted border-0 px-2 h-8 text-sm"
                      />
                      {getStatusBadge(status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right space-y-1 text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-muted-foreground">Datum:</span>
                        <Controller
                          control={control}
                          name="offerDate"
                          render={({ field }) => (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "h-8 px-2 text-sm font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? format(field.value, "dd.MM.yyyy") : "Izaberite"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-muted-foreground">Važi do:</span>
                        <Controller
                          control={control}
                          name="validUntil"
                          render={({ field }) => (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "h-8 px-2 text-sm font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? format(field.value, "dd.MM.yyyy") : "Izaberite"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-muted-foreground">Valuta:</span>
                        <Controller
                          control={control}
                          name="currency"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-24 h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="RSD">RSD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/20">
                      <div className="text-center text-xs text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <span>Logo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <Separator />

              {/* Client Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Klijent</h3>
                  <Controller
                    control={control}
                    name="client"
                    render={({ field }) => <ClientSelector value={field.value} onChange={field.onChange} />}
                  />
                  {errors.client && <p className="text-sm text-destructive">{errors.client.message}</p>}

                  {watch("client") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-muted/30 p-4 rounded-lg space-y-1 text-sm"
                    >
                      <p className="font-semibold text-base">{watch("client.companyName")}</p>
                      <p className="text-muted-foreground">
                        PIB: {watch("client.pib")} | MB: {watch("client.mb")}
                      </p>
                      <p className="text-muted-foreground">
                        {watch("client.address")}, {watch("client.city")}
                      </p>
                      <p className="text-muted-foreground">
                        {watch("client.email")} | {watch("client.phone")}
                      </p>
                      {watch("client.isVatRegistered") && (
                        <Badge variant="outline" className="mt-2">
                          U sistemu PDV-a
                        </Badge>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              <Separator />

              {/* Items Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Stavke ponude</h3>
                  <Controller
                    control={control}
                    name="items"
                    render={({ field }) => (
                      <ItemsTable items={field.value} onChange={field.onChange} currency={currency} />
                    )}
                  />
                  {errors.items && <p className="text-sm text-destructive">{errors.items.message}</p>}
                </div>
              </motion.div>

              <Separator />

              {/* Financial Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <div className="flex justify-end">
                  <div className="w-full max-w-md">
                    <FinancialSummary items={items} currency={currency} showInWords={showAmountInWords} />
                    <div className="flex items-center space-x-2 mt-3">
                      <Switch id="showInWords" checked={showAmountInWords} onCheckedChange={setShowAmountInWords} />
                      <Label htmlFor="showInWords" className="text-sm cursor-pointer">
                        Prikaži iznos slovima
                      </Label>
                    </div>
                  </div>
                </div>
              </motion.div>

              <Separator />

              {/* Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Napomene i uslovi
                  </h3>
                  <Textarea
                    {...register("notes")}
                    placeholder="Unesite dodatne napomene, uslove plaćanja, rok isporuke..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </motion.div>

              <Separator />

              {/* Settings & Attachments */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Podešavanja</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Controller
                        control={control}
                        name="convertToInvoice"
                        render={({ field }) => (
                          <Switch id="convertToInvoice" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                      <Label htmlFor="convertToInvoice" className="text-sm cursor-pointer">
                        Pretvori u fakturu nakon prihvatanja
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Controller
                        control={control}
                        name="includeLogo"
                        render={({ field }) => (
                          <Switch id="includeLogo" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                      <Label htmlFor="includeLogo" className="text-sm cursor-pointer">
                        Uključi logo kompanije
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Prilozi</Label>
                    <Button type="button" variant="outline" className="w-full bg-transparent">
                      <Upload className="mr-2 h-4 w-4" />
                      Dodaj prilog
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Action Buttons Below A4 Page */}
          <div className="max-w-[210mm] mx-auto mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Pregled PDF
            </Button>
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="mr-2 h-4 w-4" />
              Sačuvaj nacrt
            </Button>
            <Button onClick={handleSendToClient}>
              <Send className="mr-2 h-4 w-4" />
              Pošalji klijentu
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
