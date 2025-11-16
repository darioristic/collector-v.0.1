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
  const anchorIdRef = React.useRef<string | undefined>(anchorId);

  React.useEffect(() => {
    anchorIdRef.current = anchorId;
  }, [anchorId]);

  const recenter = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const currentAnchorId = anchorIdRef.current;
    const anchor = currentAnchorId ? document.getElementById(currentAnchorId) : null;
    const rect = anchor?.getBoundingClientRect();
    if (rect) {
      // Center relative to invoice preview container, not entire viewport
      el.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    } else {
      // Fallback to viewport center
      el.style.left = `${window.innerWidth / 2}px`;
    }
  }, []);

  React.useEffect(() => {
    recenter();
    const onResize = () => recenter();
    const onScroll = () => recenter();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Observe anchor resize
    const currentAnchorId = anchorIdRef.current;
    const anchor = currentAnchorId ? document.getElementById(currentAnchorId) : null;
    const ro = anchor ? new ResizeObserver(() => recenter()) : null;
    if (anchor && ro) ro.observe(anchor);
    // Observe scrollable parent (e.g., ScrollArea viewport)
    const findScrollableParent = (node: HTMLElement | null): HTMLElement | null => {
      let current: HTMLElement | null = node;
      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        if (overflowY === "auto" || overflowY === "scroll") return current;
        current = current.parentElement;
      }
      return null;
    };
    const scrollParent = findScrollableParent(anchor as HTMLElement | null);
    if (scrollParent) {
      scrollParent.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      if (scrollParent) {
        scrollParent.removeEventListener("scroll", onScroll);
      }
      if (ro && anchor) ro.unobserve(anchor);
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
      className="pointer-events-none fixed bottom-[20px] z-[9999] flex -translate-x-1/2 justify-center"
      style={{ left: "50%" }}>
      <div className="pointer-events-auto flex items-center justify-center gap-0.5">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full hover:bg-transparent focus-visible:ring-0"
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
                className={`size-7 rounded-full hover:bg-transparent focus-visible:ring-0 ${isEditing ? "text-red-600 hover:text-red-700" : ""}`}
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
                className="size-7 rounded-full hover:bg-transparent focus-visible:ring-0"
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
