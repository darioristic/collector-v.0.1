import { generateMeta } from "@/lib/utils";
import RecruitmentPageClient from "./recruitment-page-client";
import { parseCandidatesQueryState } from "./schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  return generateMeta({
    title: "Recruitment - Collector Dashboard",
    description: "Manage candidates and interviews with powerful search and filters.",
    canonical: "/hr/recruitment",
  });
}

interface RecruitmentPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RecruitmentPage({ searchParams }: RecruitmentPageProps) {
  const params = await searchParams;
  const initialQuery = parseCandidatesQueryState(params);

  return <RecruitmentPageClient initialQuery={initialQuery} />;
}

