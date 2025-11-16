"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Copy, Pencil, Check } from "lucide-react";

type Props = {
  invoiceId: string;
  onDownload?: () => void;
  onCopyLink?: () => void;
  onEdit?: () => void;
  anchorId?: string;
  isEditing?: boolean;
};

export function InvoiceToolbar({
  invoiceId,
  onDownload,
  onCopyLink,
  onEdit,
  anchorId,
  isEditing = false
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const recenter = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const anchor = anchorId ? document.getElementById(anchorId) : null;
    const rect = anchor?.getBoundingClientRect();
    if (!rect) {
      el.style.left = `${window.innerWidth / 2}px`;
    } else {
      el.style.left = `${rect.left + rect.width / 2}px`;
    }
  }, [anchorId]);

  React.useEffect(() => {
    recenter();
    const onResize = () => recenter();
    const onScroll = () => recenter();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [recenter]);
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
    window.open(`/api/sales/invoices/${invoiceId}/download`, "_blank");
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed bottom-5 z-50 flex -translate-x-1/2 justify-center"
      style={{ left: "50%" }}>
      <div className="bg-background/80 supports-backdrop-filter:bg-background/60 pointer-events-auto flex items-center justify-center gap-0.5 rounded-full border px-2.5 py-1.5 shadow-sm backdrop-blur">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full"
                onClick={handleDownload}>
                <Download className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={15}
              className="rounded-sm px-2 py-1 text-[10px] font-medium">
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
                className={`size-7 rounded-full ${isEditing ? "text-red-600 hover:text-red-700" : ""}`}
                onClick={onEdit}>
                {isEditing ? <Check className="size-4" /> : <Pencil className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={15}
              className="rounded-sm px-2 py-1 text-[10px] font-medium">
              <p>{isEditing ? "Save" : "Edit"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full"
                onClick={handleCopyLink}>
                <Copy className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={15}
              className="rounded-sm px-2 py-1 text-[10px] font-medium">
              <p>Copy link</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
