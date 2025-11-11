"use client";

import { useEffect, useState } from "react";

import { FolderPlus, Search, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type VaultHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onResetSearch?: () => void;
  onOpenUpload: () => void;
  onCreateFolder: () => void;
  isUploadDisabled?: boolean;
  isCreateDisabled?: boolean;
  isSearching?: boolean;
  className?: string;
};

export function VaultHeader({
  searchValue,
  onSearchChange,
  onResetSearch,
  onOpenUpload,
  onCreateFolder,
  isUploadDisabled,
  isCreateDisabled,
  isSearching,
  className
}: VaultHeaderProps) {
  const [value, setValue] = useState(searchValue);

  useEffect(() => {
    setValue(searchValue);
  }, [searchValue]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    onSearchChange(nextValue);
  };

  const handleClear = () => {
    setValue("");
    onSearchChange("");
    onResetSearch?.();
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-lg sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight sm:text-2xl">Vault</h1>
        <p className="text-muted-foreground text-sm">
          Organizujte i delite dokumente u okviru radnog prostora.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={handleChange}
            placeholder="Pretraži foldere i fajlove..."
            className="pl-10 pr-10"
            aria-label="Pretraga vault sadržaja"
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-2">
            {isSearching ? <Spinner className="size-4" /> : null}
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleClear}
              >
                <X className="size-4" />
                <span className="sr-only">Obriši pretragu</span>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCreateFolder}
            disabled={isCreateDisabled}
            className="flex-1 sm:flex-none"
          >
            <FolderPlus className="mr-2 size-4" />
            Novi folder
          </Button>
          <Button
            type="button"
            onClick={onOpenUpload}
            disabled={isUploadDisabled}
            className="flex-1 sm:flex-none"
          >
            <Upload className="mr-2 size-4" />
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}


