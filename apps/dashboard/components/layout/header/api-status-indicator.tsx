"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 30000;

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<"unknown" | "ok" | "error">("unknown");

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkHealth = async () => {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (!isMounted) return;
        setStatus(response.ok ? "ok" : "error");
      } catch {
        if (isMounted) {
          setStatus("error");
        }
      } finally {
        if (isMounted) {
          timeoutId = setTimeout(checkHealth, POLL_INTERVAL_MS);
        }
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const indicatorColor = useMemo(() => {
    switch (status) {
      case "ok":
        return "bg-emerald-500";
      case "error":
        return "bg-destructive";
      default:
        return "bg-muted-foreground/60";
    }
  }, [status]);

  const label = useMemo(() => {
    switch (status) {
      case "ok":
        return "API dostupna";
      case "error":
        return "API nedostupna";
      default:
        return "Provera API statusa";
    }
  }, [status]);

  return (
    <span
      aria-label={label}
      className={cn(
        "inline-flex h-3 w-3 items-center justify-center rounded-full transition-colors",
        indicatorColor
      )}
      role="status"
      title={label}
    />
  );
}
