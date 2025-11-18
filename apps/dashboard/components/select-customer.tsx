"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icons } from "@/components/ui/icons";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { transformCustomerToContent } from "@/components/invoices/utils";
import type { Customer } from "@/components/invoices/customer-details";

interface SelectCustomerProps {
  data: Customer[];
}

export function SelectCustomer({ data }: SelectCustomerProps) {
  const { setValue } = useFormContext();
  const [open, setOpen] = useState(false);

  const handleSelect = (customer: Customer) => {
    const initialContent = transformCustomerToContent(customer);
    setValue("customer_id", customer.id);
    setValue("customer_details", initialContent, { shouldValidate: true });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          Select customer...
          <Icons.ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search customer..." />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {data.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  onSelect={() => handleSelect(customer)}
                >
                  {customer.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

