"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ensureResponse } from "@/src/lib/fetch-utils";

type Product = {
  id: string;
  name: string;
  price?: number | null;
  currency?: string | null;
  description?: string | null;
};

async function searchProducts(query: string): Promise<Product[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const cleaned = trimmed.replace(/[%_]/g, "").slice(0, 255);
  const params = new URLSearchParams({ search: cleaned, limit: "10" });
  try {
    const res = await ensureResponse(
      fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      })
    );
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
  showIcon = true
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  showIcon?: boolean;
}) {
  const [query, setQuery] = React.useState(value || "");
  const [isOpen, setIsOpen] = React.useState(false);
  const [options, setOptions] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIdx, setSelectedIdx] = React.useState(-1);

  React.useEffect(() => {
    setQuery(value || "");
  }, [value]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const q = query.trim();
      if (!isOpen || q.length < 2) {
        setOptions([]);
        return;
      }
      setLoading(true);
      const res = await searchProducts(q);
      if (!cancelled) {
        setOptions(res);
        setLoading(false);
      }
    };
    const t = setTimeout(run, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, textareaId]);

  return (
    <div className="relative w-full">
      <div className="relative">
        {showIcon ? (
          <Search className="text-muted-foreground/60 absolute top-2 left-2 h-3.5 w-3.5" />
        ) : null}
        <textarea
          id={textareaId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(e.target.value.trim().length > 0);
            setSelectedIdx(-1);
          }}
          onKeyDown={(e) => {
            // When suggestions are closed, allow newline and stop propagation to avoid dialog shortcuts
            if (!isOpen && e.key === "Enter") {
              e.stopPropagation();
              return;
            }
            if (!isOpen) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIdx((i) => (i < options.length - 1 ? i + 1 : i));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIdx((i) => (i > 0 ? i - 1 : -1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (selectedIdx >= 0 && selectedIdx < options.length) {
                const picked = options[selectedIdx];
                const text =
                  picked.description && picked.description.trim().length > 0
                    ? picked.description
                    : picked.name;
                setQuery(text);
                onChange(text);
                setIsOpen(false);
              }
            } else if (e.key === "Escape") {
              setIsOpen(false);
              setSelectedIdx(-1);
            }
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          rows={3}
          className={cn(
            "focus:border-muted-foreground/20 max-h-64 w-full resize-none overflow-y-auto rounded-md border border-transparent bg-transparent py-1 pr-2 font-mono text-[11px] leading-4 wrap-break-word whitespace-pre-wrap outline-none focus:ring-0",
            showIcon ? "pl-7" : "pl-1.5"
          )}
          // Let CSS handle scrolling; avoid JS autosize jitter
          placeholder="Start typing to search products…"
        />
      </div>
      {isOpen && (
        <div className="border-border/80 bg-popover absolute left-0 z-50 mt-1.5 w-[42vw] max-w-[600px] rounded-lg border shadow-2xl backdrop-blur-md">
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
