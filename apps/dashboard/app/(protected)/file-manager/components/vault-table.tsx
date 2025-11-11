"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { MoreHorizontal, Folder, FileText, Search, Filter, LayoutGrid } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

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
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPageId = useId();

  const totalItems = tableItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pageStartIndex = (currentPage - 1) * rowsPerPage;
  const pageEndIndex = pageStartIndex + rowsPerPage;

  const displayedItems = useMemo(
    () => tableItems.slice(pageStartIndex, pageEndIndex),
    [tableItems, pageStartIndex, pageEndIndex]
  );

  const pageRangeStart = totalItems === 0 ? 0 : pageStartIndex + 1;
  const pageRangeEnd = totalItems === 0 ? 0 : Math.min(pageEndIndex, totalItems);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">All</span>
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

      <Card className="overflow-hidden border border-border/60 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[40%] px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Owner
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Year
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Uploaded
                </TableHead>
                <TableHead className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedItems.map((item) => (
                <TableRow
                  key={item.name}
                  className="border-border/60 bg-background/80 transition-colors hover:bg-muted/30"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-muted/20">
                        {item.type === "folder" ? (
                          <Folder className="size-5" />
                        ) : (
                          <FileText className="size-5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-semibold leading-none text-foreground">{item.name}</span>
                        <span className="text-muted-foreground text-xs uppercase tracking-wide">{item.size}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        {item.ownerAvatar ? (
                          <AvatarImage src={item.ownerAvatar} alt={item.owner} />
                        ) : (
                          <AvatarFallback>{item.owner.slice(0, 2).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{item.owner}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-muted-foreground">{item.year}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-muted-foreground">{item.uploaded}</TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
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
        </div>

        <footer className="border-t border-border/60 bg-background/70 px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-sm">
              <Label htmlFor={rowsPerPageId} className="text-muted-foreground">
                Redova po stranici
              </Label>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(value) => {
                  const parsedValue = Number(value);
                  setRowsPerPage(parsedValue);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id={rowsPerPageId} className="w-[120px]">
                  <SelectValue placeholder="Rows per page" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 25].map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
              <p className="text-sm text-muted-foreground">
                Prikaz {pageRangeStart}-{pageRangeEnd} od {totalItems}
              </p>
              <Pagination className="justify-start md:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                      aria-disabled={currentPage === 1}
                      onClick={(event) => {
                        event.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage((prev) => prev - 1);
                        }
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                      aria-disabled={currentPage === totalPages}
                      onClick={(event) => {
                        event.preventDefault();
                        if (currentPage < totalPages) {
                          setCurrentPage((prev) => prev + 1);
                        }
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </footer>
      </Card>
    </section>
  );
}

