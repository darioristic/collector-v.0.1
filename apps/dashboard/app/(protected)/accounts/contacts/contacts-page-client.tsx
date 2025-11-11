"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import ContactsDataTable, {
  type Contact,
  type ContactsDataTableHandle
} from "./data-table";

type ContactsPageClientProps = {
  data: Contact[];
  error: string | null;
};

export default function ContactsPageClient({ data, error }: ContactsPageClientProps) {
  const tableRef = React.useRef<ContactsDataTableHandle>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground text-sm">
            Browse account contacts and quickly find the people you collaborate with.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => tableRef.current?.openAddDialog()}
          className="gap-2"
          disabled={Boolean(error)}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Contact
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Loading failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <ContactsDataTable ref={tableRef} data={data} showAddActionInToolbar={false} />
      )}
    </div>
  );
}

