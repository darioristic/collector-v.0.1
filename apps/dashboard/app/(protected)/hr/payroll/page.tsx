import { generateMeta } from "@/lib/utils";
import PayrollPageClient from "./payroll-page-client";
import { parsePayrollEntriesQueryState } from "./schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	return generateMeta({
		title: "Payroll - Collector Dashboard",
		description: "Manage payroll entries and employee compensation.",
		canonical: "/hr/payroll",
	});
}

interface PayrollPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
	const params = await searchParams;
	const initialQuery = parsePayrollEntriesQueryState(params);

	return <PayrollPageClient initialQuery={initialQuery} />;
}
