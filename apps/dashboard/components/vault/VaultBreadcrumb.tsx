"use client";

import { Fragment, useCallback } from "react";

import type { VaultBreadcrumb as VaultBreadcrumbItem } from "@/app/vault/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type VaultBreadcrumbProps = {
  items: VaultBreadcrumbItem[];
  onNavigate?: (_item: VaultBreadcrumbItem) => void;
  className?: string;
};

export function VaultBreadcrumb({ items, onNavigate, className }: VaultBreadcrumbProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = useCallback(
    (target: VaultBreadcrumbItem) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (target.id) {
        params.set("folderId", target.id);
      } else {
        params.delete("folderId");
      }

      const query = params.toString();
      return `${pathname}${query ? `?${query}` : ""}`;
    },
    [pathname, searchParams]
  );

  const handleNavigate = (item: VaultBreadcrumbItem) => {
    const href = buildHref(item);
    router.push(href);
    onNavigate?.(item);
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const key = `${item.id ?? "root"}-${index}`;

            return (
              <Fragment key={key}>
                <BreadcrumbItem className="whitespace-nowrap">
                  {isLast ? (
                    <BreadcrumbPage className="text-foreground font-medium">
                      {item.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      asChild
                      className="text-muted-foreground hover:text-foreground transition">
                      <button
                        type="button"
                        onClick={() => handleNavigate(item)}
                        className="text-sm font-medium">
                        {item.name}
                      </button>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast ? <BreadcrumbSeparator /> : null}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
