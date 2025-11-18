import { ExportButton } from "@/components/CardActionMenus";
import CalendarDateRangePicker from "@/components/custom-date-range-picker";
import { generateMeta } from "@/lib/utils";
import {
	CRMDataTable,
	CRMKPICards,
	CRMLeadsBySourceChart,
	CRMPipelineChart,
} from "./components";

export async function generateMetadata() {
	return generateMeta({
		title: "CRM Reports - Collector Dashboard",
		description:
			"Comprehensive CRM reports with leads, deals, pipeline analytics, and conversion metrics.",
		canonical: "/reports/crm",
	});
}

export default function CRMReportsPage() {
	return (
		<div className="space-y-4">
			<div className="flex flex-row items-center justify-between">
				<h1 className="text-xl font-bold tracking-tight lg:text-2xl">
					CRM Reports
				</h1>
				<div className="flex items-center space-x-2">
					<CalendarDateRangePicker />
					<ExportButton />
				</div>
			</div>

			<CRMKPICards />

			<div className="grid gap-4 lg:grid-cols-2">
				<CRMPipelineChart />
				<CRMLeadsBySourceChart />
			</div>

			<CRMDataTable />
		</div>
	);
}
