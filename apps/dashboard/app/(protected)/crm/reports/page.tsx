import { generateMeta } from "@/lib/utils";
import CRMReportsPage from "./reports-page-client";

export async function generateMetadata() {
	return generateMeta({
		title: "Reports - Collector Dashboard",
		description:
			"Performance analytics and visual reports for the CRM dashboard.",
		canonical: "/crm/reports",
	});
}

export default function Page() {
	return <CRMReportsPage />;
}
