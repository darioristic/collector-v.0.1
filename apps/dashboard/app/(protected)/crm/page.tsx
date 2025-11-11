import { generateMeta } from "@/lib/utils";
import CRMOverviewPage from "@/app/(protected)/crm/overview-page-client";

export async function generateMetadata() {
  return generateMeta({
    title: "CRM Admin Dashboard",
    description:
      "CRM admin dashboard template offers a streamlined and interactive interface for managing customer relationships, tracking sales, and analyzing performance metrics. Built with shadcn/ui, Tailwind CSS, Next.js.",
    canonical: "/crm"
  });
}

export default function Page() {
  return <CRMOverviewPage />;
}
