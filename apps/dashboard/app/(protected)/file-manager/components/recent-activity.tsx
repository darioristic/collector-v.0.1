"use client";

import { FolderIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

import { useFileManager } from "./file-manager-provider";

export function RecentActivity() {
  const { rootFolders, navigateToPath } = useFileManager();

  if (rootFolders.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent activity</h2>
      </header>
      <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
        {rootFolders.map((folder) => (
          <Card
            key={folder.id}
            role="button"
            tabIndex={0}
            onClick={() => navigateToPath([folder.name])}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigateToPath([folder.name]);
              }
            }}
            className="flex h-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex size-20 items-center justify-center rounded-xl border border-border/50 bg-background/40 shadow-sm">
              <FolderIcon className="size-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{folder.name}</p>
              <p className="text-muted-foreground text-xs">
                {folder.children.length} {folder.children.length === 1 ? "item" : "items"}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

