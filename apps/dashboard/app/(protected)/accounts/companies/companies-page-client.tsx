"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import CompaniesDataTable, { type CompaniesDataTableHandle, type CompanyRow } from "./data-table";

type CompaniesPageClientProps = {
  data: CompanyRow[];
  error: string | null;
};

export default function CompaniesPageClient({ data, error }: CompaniesPageClientProps) {
  const tableRef = React.useRef<CompaniesDataTableHandle>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground text-sm">
            Manage company accounts, validate primary contacts, and keep business records up to
            date.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => tableRef.current?.openCreateDialog()}
          className="gap-2"
          disabled={Boolean(error)}>
          <Plus className="size-4" aria-hidden="true" />
          Add Company
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Failed to load data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <CompaniesDataTable ref={tableRef} data={data} showCreateActionInToolbar={false} />
      )}
    </div>
  );
}
