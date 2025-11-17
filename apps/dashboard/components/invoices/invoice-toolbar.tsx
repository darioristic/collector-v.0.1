"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Pencil, Check, Eye } from "lucide-react";

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
  const [pulse, setPulse] = React.useState(false);

  React.useEffect(() => {
    anchorIdRef.current = anchorId;
  }, [anchorId]);

  const recenter = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const currentAnchorId = anchorIdRef.current;
    const anchor = currentAnchorId ? document.getElementById(currentAnchorId) : null;
    const rect = anchor?.getBoundingClientRect();
    const prevLeft = Number(el.style.left.replace("px", "")) || NaN;
    if (rect) {
      const nextLeft = rect.left + rect.width / 2;
      if (!Number.isFinite(prevLeft) || Math.abs(prevLeft - nextLeft) > 0.5) {
        el.style.left = `${nextLeft}px`;
      }
    } else {
      const nextLeft = window.innerWidth / 2;
      if (!Number.isFinite(prevLeft) || Math.abs(prevLeft - nextLeft) > 0.5) {
        el.style.left = `${nextLeft}px`;
      }
    }
  }, []);

  React.useEffect(() => {
    let rafId: number | null = null;
    const schedule = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        recenter();
      });
    };
    schedule();
    const onResize = () => schedule();
    const onScroll = () => schedule();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Observe anchor resize when not editing
    const currentAnchorId = anchorIdRef.current;
    const anchor = currentAnchorId ? document.getElementById(currentAnchorId) : null;
    const ro = anchor ? new ResizeObserver(() => schedule()) : null;
    if (anchor && ro) ro.observe(anchor);
    const imgs = anchor ? Array.from(anchor.querySelectorAll<HTMLImageElement>("img")) : [];
    imgs.forEach((img) => img.addEventListener("load", onResize));
    // Retry recenter a few times to cover hydration/data-load delays
    const t1 = setTimeout(schedule, 100);
    const t2 = setTimeout(schedule, 300);
    const t3 = setTimeout(schedule, 800);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      if (ro && anchor) ro.unobserve(anchor);
      imgs.forEach((img) => img.removeEventListener("load", onResize));
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [recenter, isEditing]);

  React.useEffect(() => {
    if (!isEditing) {
      recenter();
      const t = setTimeout(recenter, 120);
      return () => clearTimeout(t);
    }
  }, [anchorId, isEditing, recenter]);
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

  const handleEditClick = () => {
    if (isEditing) {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }
    if (onEdit) onEdit();
  };

  const handlePreview = () => {
    window.open(`/invoices/${invoiceId}/preview`, "_blank");
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed bottom-[20px] z-[9999] flex -translate-x-1/2 justify-center transition-[left,transform,opacity] duration-300 ease-out"
      style={{ left: "50%" }}>
      <div className={`pointer-events-auto flex items-center justify-center gap-1 bg-transparent rounded-full px-2 py-2 h-9 transition-all duration-300 ${pulse ? "" : ""}`}
      >
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full hover:bg-transparent focus-visible:ring-0"
            onClick={handleDownload}>
            <Download className="size-4" />
          </Button>
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100">Download</span>
        </div>

        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full hover:bg-transparent focus-visible:ring-0"
            onClick={handlePreview}>
            <Eye className="size-4" />
          </Button>
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100">Preview</span>
        </div>

        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className={`size-7 rounded-full hover:bg-transparent focus-visible:ring-0 ${isEditing ? "text-red-600 hover:text-red-700" : ""}`}
            onClick={handleEditClick}>
            {isEditing ? <Check className="size-4" /> : <Pencil className="size-4" />}
          </Button>
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100">{isEditing ? "Save" : "Edit"}</span>
        </div>

        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full hover:bg-transparent focus-visible:ring-0"
            onClick={handleCopyLink}>
            <Copy className="size-4" />
          </Button>
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100">Copy link</span>
        </div>
      </div>
    </div>
  );
}
