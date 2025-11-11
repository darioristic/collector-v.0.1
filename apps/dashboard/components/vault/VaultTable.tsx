"use client";

import { useMemo } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

import { formatBytes, formatDate, getVaultIcon } from "@/components/vault/utils";

import type { VaultOwner } from "@/app/vault/types";

import {
  Download,
  ExternalLink,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2
} from "lucide-react";

type VaultTableItem = {
  id: string;
  kind: "folder" | "file";
  name: string;
  owner: VaultOwner;
  size?: number | null;
  mimeType?: string | null;
  url?: string | null;
  createdAt: string;
  updatedAt: string;
};

type VaultTableProps = {
  items: VaultTableItem[];
  isLoading?: boolean;
  className?: string;
  onOpenFolder?: (item: VaultTableItem) => void;
  onOpenFile?: (item: VaultTableItem) => void;
  onRename?: (item: VaultTableItem) => void;
  onDelete?: (item: VaultTableItem) => void;
  onDownload?: (item: VaultTableItem) => void;
};

const SKELETON_ROWS = 6;

const getOwnerInitials = (name?: string | null, fallback?: string | null) => {
  if (name) {
    const parts = name.split(" ").filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part[0] ?? "");
    const result = initials.join("").toUpperCase();
    if (result) {
      return result;
    }
  }

  if (fallback) {
    return fallback.slice(0, 2).toUpperCase();
  }

  return "??";
};

export function VaultTable({
  items,
  isLoading,
  className,
  onOpenFolder,
  onOpenFile,
  onRename,
  onDelete,
  onDownload
}: VaultTableProps) {
  const hasItems = items.length > 0;

  const skeletonRows = useMemo(
    () =>
      Array.from({ length: SKELETON_ROWS }).map((_, index) => (
        <TableRow key={`vault-skeleton-${index}`}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-10 ml-auto" />
          </TableCell>
        </TableRow>
      )),
    []
  );

  const handleOpen = (item: VaultTableItem) => {
    if (item.kind === "folder") {
      onOpenFolder?.(item);
      return;
    }

    if (onOpenFile) {
      onOpenFile(item);
      return;
    }

    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = (item: VaultTableItem) => {
    if (onDownload) {
      onDownload(item);
      return;
    }

    if (!item.url) {
      return;
    }

    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.name;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-lg",
        className
      )}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="min-w-[240px] px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Naziv
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Vlasnik
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Veličina
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Otpremljeno
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Akcije
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              skeletonRows
            ) : hasItems ? (
              items.map((item) => {
                const Icon = getVaultIcon({
                  kind: item.kind,
                  mimeType: item.mimeType,
                  name: item.name
                });

                const ownerName = item.owner?.name ?? null;

                return (
                  <TableRow
                    key={item.id}
                    tabIndex={0}
                    onDoubleClick={() => handleOpen(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleOpen(item);
                      }
                    }}
                    className="group cursor-pointer border-border/60 bg-background/70 transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground transition group-hover:border-border group-hover:text-foreground">
                          <Icon className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <span className="line-clamp-1 text-sm font-medium text-foreground">
                            {item.name}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {item.kind === "folder" ? "Folder" : item.mimeType ?? "Fajl"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {item.owner?.avatarUrl ? (
                            <AvatarImage src={item.owner.avatarUrl} alt={ownerName ?? "Vlasnik"} />
                          ) : (
                            <AvatarFallback>
                              {getOwnerInitials(ownerName, item.owner?.id ?? null)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">
                          {ownerName ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                      {item.kind === "file" && item.size
                        ? formatBytes(item.size)
                        : item.kind === "folder"
                          ? "—"
                          : item.size
                            ? formatBytes(item.size)
                            : "—"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                            <span className="sr-only">Otvori meni akcija</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              if (item.kind === "folder") {
                                onOpenFolder?.(item);
                              } else {
                                handleOpen(item);
                              }
                            }}
                          >
                            {item.kind === "folder" ? (
                              <>
                                <FolderOpen className="mr-2 size-4" />
                                Otvori folder
                              </>
                            ) : (
                              <>
                                <ExternalLink className="mr-2 size-4" />
                                Otvori fajl
                              </>
                            )}
                          </DropdownMenuItem>
                          {item.kind === "file" ? (
                            <DropdownMenuItem onClick={() => handleDownload(item)}>
                              <Download className="mr-2 size-4" />
                              Preuzmi
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem onClick={() => onRename?.(item)}>
                            <Pencil className="mr-2 size-4" />
                            Preimenuj
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete?.(item)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Obriši
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-10">
                  <Empty className="border border-dashed border-border/60 bg-background/70">
                    <EmptyMedia variant="icon">
                      <FolderOpen className="size-6" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>Još uvek nema fajlova ili foldera</EmptyTitle>
                      <EmptyDescription>
                        Dodajte nove foldere ili otpremite dokumente kako biste započeli.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


