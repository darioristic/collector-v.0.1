"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { type Client, clientSchema } from "@/lib/validations/offer"

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (client: Client) => void
}

export function ClientFormDialog({ open, onOpenChange, onSubmit }: ClientFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<Client>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      isVatRegistered: true,
    },
  })

  const isVatRegistered = watch("isVatRegistered")

  const onSubmitForm = (data: Client) => {
    onSubmit({ ...data, id: Date.now().toString() })
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dodaj novog klijenta</DialogTitle>
          <DialogDescription>Unesite podatke o novom klijentu. Sva polja su obavezna.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="companyName">Naziv kompanije</Label>
              <Input id="companyName" {...register("companyName")} placeholder="Tech Solutions d.o.o." />
              {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pib">PIB</Label>
              <Input id="pib" {...register("pib")} placeholder="123456789" maxLength={9} />
              {errors.pib && <p className="text-sm text-destructive">{errors.pib.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mb">Matični broj</Label>
              <Input id="mb" {...register("mb")} placeholder="12345678" maxLength={8} />
              {errors.mb && <p className="text-sm text-destructive">{errors.mb.message}</p>}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Adresa</Label>
              <Input id="address" {...register("address")} placeholder="Knez Mihailova 10" />
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Grad</Label>
              <Input id="city" {...register("city")} placeholder="Beograd" />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" {...register("phone")} placeholder="+381 11 1234567" />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="info@company.rs" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                id="isVatRegistered"
                checked={isVatRegistered}
                onCheckedChange={(checked) => setValue("isVatRegistered", checked)}
              />
              <Label htmlFor="isVatRegistered" className="cursor-pointer">
                Klijent je u sistemu PDV-a
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Otkaži
            </Button>
            <Button type="submit">Dodaj klijenta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
