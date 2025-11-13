import { generateMeta } from "@/lib/utils";
import PerformanceReviewsPageClient from "./performance-reviews-page-client";
import { parsePerformanceReviewsQueryState } from "./schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  return generateMeta({
    title: "Performance Reviews - Collector Dashboard",
    description:
      "Manage performance reviews with powerful search, filters, and detailed insights.",
    canonical: "/hr/performance-reviews",
  });
}

interface PerformanceReviewsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PerformanceReviewsPage({
  searchParams,
}: PerformanceReviewsPageProps) {
  const params = await searchParams;
  const initialQuery = parsePerformanceReviewsQueryState(params);

  return <PerformanceReviewsPageClient initialQuery={initialQuery} />;
}

