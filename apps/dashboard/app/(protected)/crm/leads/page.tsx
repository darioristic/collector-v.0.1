import type { Lead } from "@crm/types";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateMeta } from "@/lib/utils";
import { LeadsDataTable } from "./data-table";

export async function generateMetadata() {
  return generateMeta({
    title: "CRM Leads",
    description: "Overview and management of leads in the CRM module.",
    canonical: "/crm/leads"
  });
}

const apiBaseUrl = process.env.COLLECTOR_API_URL;

async function getLeads(): Promise<Lead[]> {
  if (!apiBaseUrl) {
    throw new Error("Environment variable COLLECTOR_API_URL is not defined.");
  }

  const response = await fetch(`${apiBaseUrl}/api/crm/leads`, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`API returned status ${response.status}.`);
  }

  const payload = (await response.json()) as { data: Lead[] };
  return payload.data;
}

export default async function Page() {
  let leads: Lead[] = [];
  let error: string | null = null;

  try {
    leads = await getLeads();
  } catch (err) {
    error =
      err instanceof Error ? err.message : "An error occurred while loading leads.";
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">CRM Leads</h1>
          <p className="text-muted-foreground text-base">
            Monitor the status, source, and next steps for every lead. Advanced controls make it
            easy to filter, export, and manage potential opportunities.
          </p>
        </div>
      </div>
      {error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Loading Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="mt-4">
          <LeadsDataTable data={leads} />
        </div>
      )}
    </>
  );
}

