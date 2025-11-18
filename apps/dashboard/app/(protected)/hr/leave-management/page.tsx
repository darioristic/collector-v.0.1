import { generateMeta } from "@/lib/utils";
import LeaveManagementPageClient from "./leave-management-page-client";
import { parseLeaveRequestsQueryState } from "./schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	return generateMeta({
		title: "Leave Management - Collector Dashboard",
		description: "Manage leave requests and time off with approval workflow.",
		canonical: "/hr/leave-management",
	});
}

interface LeaveManagementPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LeaveManagementPage({
	searchParams,
}: LeaveManagementPageProps) {
	const params = await searchParams;
	const initialQuery = parseLeaveRequestsQueryState(params);

	return <LeaveManagementPageClient initialQuery={initialQuery} />;
}
