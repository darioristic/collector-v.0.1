"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Client } from "@/lib/validations/offer"
import { ClientFormDialog } from "./client-form-dialog"

interface ClientSelectorProps {
  value?: Client
  onChange: (client: Client) => void
}

// Mock clients data
const mockClients: Client[] = [
  {
    id: "1",
    companyName: "Tech Solutions d.o.o.",
    pib: "123456789",
    mb: "12345678",
    address: "Knez Mihailova 10",
    city: "Beograd",
    email: "info@techsolutions.rs",
    phone: "+381 11 1234567",
    isVatRegistered: true,
  },
  {
    id: "2",
    companyName: "Digital Agency d.o.o.",
    pib: "987654321",
    mb: "87654321",
    address: "Bulevar Kralja Aleksandra 20",
    city: "Beograd",
    email: "contact@digitalagency.rs",
    phone: "+381 11 7654321",
    isVatRegistered: true,
  },
]

export function ClientSelector({ value, onChange }: ClientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent"
          >
            {value ? value.companyName : "Izaberite klijenta..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Pretražite klijente..." />
            <CommandList>
              <CommandEmpty>Klijent nije pronađen.</CommandEmpty>
              <CommandGroup>
                {mockClients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.companyName}
                    onSelect={() => {
                      onChange(client)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value?.id === client.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col">
                      <span className="font-medium">{client.companyName}</span>
                      <span className="text-sm text-muted-foreground">PIB: {client.pib}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setShowNewClientDialog(true)
                  }}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj novog klijenta
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ClientFormDialog
        open={showNewClientDialog}
        onOpenChange={setShowNewClientDialog}
        onSubmit={(client) => {
          onChange(client)
          setShowNewClientDialog(false)
        }}
      />
    </>
  )
}
