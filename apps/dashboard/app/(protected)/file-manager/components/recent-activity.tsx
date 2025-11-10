import { FolderIcon, ImageIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

type ActivityItem = {
  name: string;
  size: string;
  type: "folder" | "file";
};

const activity: ActivityItem[] = [
  { name: "Clients", size: "89.17 kb", type: "folder" },
  { name: "Agreements", size: "89.17 kb", type: "folder" },
  { name: "Important", size: "89.17 kb", type: "folder" },
  { name: "Agreement", size: "89.17 kb", type: "file" },
  { name: "Client", size: "89.17 kb", type: "file" },
  { name: "Prio", size: "89.17 kb", type: "file" },
  { name: "Inbox", size: "89.17 kb", type: "folder" },
  { name: "Portfolio", size: "89.17 kb", type: "folder" },
  { name: "Folder 2", size: "89.17 kb", type: "folder" }
];

export function RecentActivity() {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent activity
        </h2>
      </header>
      <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
        {activity.map((item) => (
          <Card
            key={item.name}
            className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/40">
            <div className="flex size-20 items-center justify-center rounded-xl border border-border/50 bg-background/40 shadow-sm">
              {item.type === "folder" ? (
                <FolderIcon className="size-8" />
              ) : (
                <ImageIcon className="size-8" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-muted-foreground text-xs">{item.size}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

