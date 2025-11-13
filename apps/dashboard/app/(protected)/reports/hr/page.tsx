import CalendarDateRangePicker from "@/components/custom-date-range-picker";
import { ExportButton } from "@/components/CardActionMenus";
import { generateMeta } from "@/lib/utils";
import {
	HRKPICards,
	HRAttendanceChart,
	HRDepartmentChart,
	HRDataTable,
} from "./components";

export async function generateMetadata() {
	return generateMeta({
		title: "HR Reports - Collector Dashboard",
		description:
			"Comprehensive HR reports with employee statistics, attendance, and department analytics.",
		canonical: "/reports/hr",
	});
}

export default function HRReportsPage() {
	return (
		<div className="space-y-4">
			<div className="flex flex-row items-center justify-between">
				<h1 className="text-xl font-bold tracking-tight lg:text-2xl">
					HR Reports
				</h1>
				<div className="flex items-center space-x-2">
					<CalendarDateRangePicker />
					<ExportButton />
				</div>
			</div>

			<HRKPICards />

			<div className="grid gap-4 lg:grid-cols-2">
				<HRAttendanceChart />
				<HRDepartmentChart />
			</div>

			<HRDataTable />
		</div>
	);
}

