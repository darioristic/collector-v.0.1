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
	searchParams: Record<string, string | string[] | undefined>;
}

export default function EmployeesPage({ searchParams }: EmployeesPageProps) {
	const initialQuery = parseEmployeesQueryState(searchParams);

	return <EmployeesPageClient initialQuery={initialQuery} />;
}
