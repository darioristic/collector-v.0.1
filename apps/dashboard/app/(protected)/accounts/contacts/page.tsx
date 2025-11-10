import Link from "next/link";
import type { AccountContact } from "@crm/types";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { generateMeta } from "@/lib/utils";

import ContactsDataTable from "./data-table";

export async function generateMetadata() {
  return generateMeta({
    title: "Contacts",
    description:
      "Manage contacts and quickly access their related companies with a TanStack Table experience built with Tailwind CSS, shadcn/ui, and Next.js.",
    canonical: "/accounts/contacts"
  });
}

const apiBaseUrl = process.env.COLLECTOR_API_URL;

async function getContacts(): Promise<AccountContact[]> {
  if (!apiBaseUrl) {
    throw new Error("Environment variable COLLECTOR_API_URL is not defined.");
  }

  const response = await fetch(`${apiBaseUrl}/api/accounts/contacts`, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`API responded with status ${response.status}.`);
  }

  return (await response.json()) as AccountContact[];
}

export default async function Page() {
  let contacts: AccountContact[] = [];
  let error: string | null = null;

  try {
    contacts = await getContacts();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load contacts.";
  }

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground text-base">
            Browse account contacts and quickly find the people you collaborate with.
            <br />
            <br />
          </p>
        </div>
        <Button asChild>
          <Link href="#">
            <span className="flex items-center gap-2">Add New Contact</span>
          </Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Loading failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <ContactsDataTable data={contacts} />
      )}
    </>
  );
}
