import type { Lead } from "@crm/types";

import { generateMeta } from "@/lib/utils";
import LeadsPageClient from "./leads-page-client";

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

  return <LeadsPageClient data={leads} error={error} />;
}

