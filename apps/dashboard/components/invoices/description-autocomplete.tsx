"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  price?: number | null;
  currency?: string | null;
  description?: string | null;
};

async function searchProducts(query: string, signal?: AbortSignal): Promise<Product[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const cleaned = trimmed.replace(/[%_]/g, "").slice(0, 255);
  const params = new URLSearchParams({ search: cleaned, limit: "10" });
  try {
    const res = await fetch(`/api/products?${params.toString()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: unknown };
    const list = Array.isArray(data.data) ? (data.data as unknown[]) : [];
    return list.map((raw) => {
      const p = raw as Partial<Product>;
      return {
        id: String(p.id ?? ""),
        name: String(p.name ?? ""),
        price:
          typeof p.price === "number"
            ? p.price
            : p.price
              ? Number.parseFloat(String(p.price)) || 0
              : null,
        currency: p.currency ?? null,
        description: p.description ?? null
      };
    });
  } catch {
    return [];
  }
}

export function DescriptionAutocompleteInline({
  value,
  onChange,
  autoFocus = false,
  showIcon = false,
  onCommit
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  showIcon?: boolean;
  onCommit?: (value: string) => void;
}) {
  const [query, setQuery] = React.useState(value || "");
  const [isOpen, setIsOpen] = React.useState(false);
  const [options, setOptions] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIdx, setSelectedIdx] = React.useState(-1);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [menuWidth, setMenuWidth] = React.useState<number | undefined>(undefined);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    setQuery(value || "");
  }, [value]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const q = query.trim();
      if (!isOpen || q.length < 3) {
        setOptions([]);
        return;
      }
      // abort previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      const res = await searchProducts(q, controller.signal).catch(() => []);
      if (!cancelled) {
        setOptions(res);
        setLoading(false);
      }
    };
    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [query, isOpen]);

  const textareaId = React.useId();
  // autofocus and open suggestions on mount for new empty row
  React.useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
        if (el) {
          el.focus();
          setIsOpen(true);
        }
      }, 0);
    }
  }, [autoFocus, textareaId]);

  return (
    <div className="relative w-full">
      <div className="relative">
        {showIcon ? (
          <Search className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-[45%]" />
        ) : null}
        <textarea
          ref={textareaRef}
          id={textareaId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            // do not auto-open while typing to avoid flicker; user can press Ctrl+Space to open
            setSelectedIdx(-1);
            if (textareaRef.current) {
              setMenuWidth(textareaRef.current.offsetWidth);
            }
          }}
          onKeyDown={(e) => {
            // Default: allow typing/newlines; only intercept when navigating/confirming a selection
            if (e.ctrlKey && e.code === "Space") {
              // explicit open
              setIsOpen(true);
              e.preventDefault();
              return;
            }
            if (!isOpen) {
              // Prevent parent shortcuts on Enter but keep newline
              if (e.key === "Enter") e.stopPropagation();
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIdx((i) => (i < options.length - 1 ? i + 1 : i));
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIdx((i) => (i > 0 ? i - 1 : -1));
              return;
            }
            if (e.key === "Enter") {
              // If an item is highlighted, select it; otherwise allow newline in textarea
              if (selectedIdx >= 0 && selectedIdx < options.length) {
                e.preventDefault();
                const picked = options[selectedIdx];
                const text =
                  picked.description && picked.description.trim().length > 0
                    ? picked.description
                    : picked.name;
                setQuery(text);
                onChange(text);
                onCommit?.(text);
                setIsOpen(false);
                return;
              }
              // No selection -> treat as newline in textarea, but avoid parent handlers
              e.stopPropagation();
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setIsOpen(false);
              setSelectedIdx(-1);
              return;
            }
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
            if (textareaRef.current) {
              setMenuWidth(textareaRef.current.offsetWidth);
            }
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          rows={2}
          className={cn(
            "focus:border-muted-foreground/20 max-h-64 w-full resize-none overflow-y-auto rounded-md border border-transparent bg-transparent py-0.5 pr-2 font-mono text-[11px] leading-4 wrap-break-word whitespace-pre-wrap outline-none focus:ring-0",
            showIcon ? "pl-7" : "pl-1.5"
          )}
          // Let CSS handle scrolling; avoid JS autosize jitter
          placeholder="Start typing to search products…"
        />
      </div>
      {isOpen && (
        <div
          className="border-border/80 bg-popover pointer-events-auto absolute left-0 z-50 mt-1.5 max-w-[640px] rounded-lg border shadow-xl transition-all duration-150 ease-out data-[state=closed]:-translate-y-1 data-[state=closed]:opacity-0 data-[state=open]:translate-y-0 data-[state=open]:opacity-100"
          style={{ width: menuWidth ? `${menuWidth}px` : undefined }}
          data-state={isOpen ? "open" : "closed"}>
          {loading ? (
            <div className="text-muted-foreground px-4 py-3 text-xs">Searching…</div>
          ) : options.length > 0 ? (
            <div className="max-h-56 overflow-y-auto py-1">
              {options.map((opt, idx) => (
                <button
                  key={opt.id || `${opt.name}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const text =
                      opt.description && opt.description.trim().length > 0
                        ? opt.description
                        : opt.name;
                    setQuery(text);
                    onChange(text);
                    onCommit?.(text);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "hover:bg-accent mx-1 w-[calc(100%-0.5rem)] rounded-md px-3 py-2 text-left text-xs transition-all",
                    selectedIdx === idx && "bg-accent"
                  )}
                  onMouseEnter={() => setSelectedIdx(idx)}>
                  <div className="line-clamp-1 font-medium">{opt.name}</div>
                  {opt.description && (
                    <div className="text-muted-foreground line-clamp-2">{opt.description}</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground px-4 py-3 text-xs">No products found</div>
          )}
        </div>
      )}
    </div>
  );
}
