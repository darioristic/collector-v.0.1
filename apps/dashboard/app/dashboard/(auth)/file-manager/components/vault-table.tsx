"use client";

import { useMemo } from "react";
import { MoreHorizontal, Folder, FileText, Search, Filter, LayoutGrid } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Card } from "@/components/ui/card";

type VaultItem = {
  name: string;
  type: "folder" | "file";
  size: string;
  owner: string;
  ownerAvatar?: string;
  year: string;
  uploaded: string;
};

const items: VaultItem[] = [
  { name: "Inbox", type: "folder", size: "89.17 kb", owner: "Sam", year: "2023", uploaded: "Jan 11, 2023" },
  { name: "Exports", type: "folder", size: "89.17 kb", owner: "Gabriel", year: "2022", uploaded: "Dec 11, 2022" },
  { name: "Contract 1.jpeg", type: "file", size: "89.17 kb", owner: "Lauren", year: "2022", uploaded: "Jan 11, 2023" },
  { name: "Client list.txt", type: "file", size: "89.17 kb", owner: "Lauren", year: "2023", uploaded: "Jan 11, 2023" },
  { name: "Agreement.pdf", type: "file", size: "2.16 mb", owner: "Carl", year: "2023", uploaded: "Jan 11, 2023" },
  { name: "Portfolio.zip", type: "file", size: "89.17 kb", owner: "Lauren", year: "2023", uploaded: "Jan 11, 2023" },
  { name: "Options.pdf", type: "file", size: "89.17 kb", owner: "Carl", year: "2023", uploaded: "Jan 11, 2023" },
  { name: "List.txt", type: "file", size: "89.17 kb", owner: "Lauren", year: "2023", uploaded: "Jan 11, 2023" }
];

export function VaultTable() {
  const tableItems = useMemo(() => items, []);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">All</span>
          <span className="text-muted-foreground/60">/</span>
          <span>Folder 1</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-9">
            <Search className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-9">
            <Filter className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-9">
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      </header>

      <Card className="overflow-hidden border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[40%]">Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableItems.map((item) => (
              <TableRow key={item.name} className="border-border/60">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/20">
                      {item.type === "folder" ? (
                        <Folder className="size-4" />
                      ) : (
                        <FileText className="size-4" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium leading-none">{item.name}</span>
                      <span className="text-muted-foreground text-xs">{item.size}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7">
                      {item.ownerAvatar ? (
                        <AvatarImage src={item.ownerAvatar} alt={item.owner} />
                      ) : (
                        <AvatarFallback>{item.owner.slice(0, 2).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-sm font-medium">{item.owner}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.year}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.uploaded}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Open actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem>Open</DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                      <DropdownMenuItem>Download</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}

