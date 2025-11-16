"use client";

import React from "react";
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog";

type InvoiceCreateSheetProps = {
  open?: boolean;
  onClose?: () => void;
};

export function InvoiceCreateSheet({ open = true, onClose }: InvoiceCreateSheetProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(open);

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);
    if (!next) onClose?.();
  };

  return (
    <CreateInvoiceDialog open={isOpen} onOpenChange={handleOpenChange} />
  );
}

