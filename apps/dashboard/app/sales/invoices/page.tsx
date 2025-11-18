import { InvoiceHeader } from "@/components/invoices/invoice-header";
import { InvoicesTable } from "@/components/invoices/tables";
import { InvoiceSkeleton } from "@/components/invoices/tables/skeleton";
import { getDefaultSettings } from "@crm/invoice";
import type { Metadata } from "next";
import { Suspense } from "react";
import { searchParamsCache } from "./search-params";

export const metadata: Metadata = {
  title: "Invoices | Collector Dashboard",
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const {
    q: query,
    sort,
    start,
    end,
    statuses,
    customers,
    page,
  } = searchParamsCache.parse(params);

  const defaultSettings = getDefaultSettings();

  const loadingKey = JSON.stringify({
    q: query,
    sort,
    start,
    end,
    statuses,
    customers,
    page,
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <InvoiceHeader />

      <Suspense fallback={<InvoiceSkeleton />} key={loadingKey}>
        <InvoicesTable
          query={query}
          sort={sort}
          start={start}
          end={end}
          statuses={statuses}
          customers={customers}
          page={page}
        />
      </Suspense>
    </div>
  );
}
