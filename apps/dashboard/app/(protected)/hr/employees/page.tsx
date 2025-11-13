import { generateMeta } from "@/lib/utils";
import EmployeesPageClient from "./employees-page-client";
import { parseEmployeesQueryState } from "./schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	return generateMeta({
		title: "Employees - Collector Dashboard",
		description:
			"Manage your workforce with powerful search, filters, and detailed employee insights.",
		canonical: "/hr/employees",
	});
}

interface EmployeesPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EmployeesPage({ searchParams }: EmployeesPageProps) {
	const params = await searchParams;
	const initialQuery = parseEmployeesQueryState(params);

	return <EmployeesPageClient initialQuery={initialQuery} />;
}
