"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Copy } from "lucide-react";

type Props = {
  invoiceId: string;
  onDownload?: () => void;
  onCopyLink?: () => void;
};

export function InvoiceToolbar({
  invoiceId,
  onDownload,
  onCopyLink,
}: Props) {
  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink();
      return;
    }
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    // Default download behavior
    window.open(`/api/invoices/${invoiceId}/download`, "_blank");
  };

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex justify-center z-50">
      <div className="backdrop-filter backdrop-blur-lg bg-background/80 rounded-full pl-2 pr-4 py-3 h-10 flex items-center justify-center border-[0.5px] border-border shadow-lg">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full size-8"
                onClick={handleDownload}
              >
                <Download className="size-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={15}
              className="text-[10px] px-2 py-1 rounded-sm font-medium"
            >
              <p>Download</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full size-8"
                onClick={handleCopyLink}
              >
                <Copy className="size-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={15}
              className="text-[10px] px-2 py-1 rounded-sm font-medium"
            >
              <p>Copy link</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

