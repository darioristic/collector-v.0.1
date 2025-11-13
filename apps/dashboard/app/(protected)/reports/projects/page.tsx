import CalendarDateRangePicker from "@/components/custom-date-range-picker";
import { ExportButton } from "@/components/CardActionMenus";
import { generateMeta } from "@/lib/utils";
import {
	ProjectsKPICards,
	ProjectsStatusChart,
	ProjectsBudgetChart,
	ProjectsDataTable,
} from "./components";

export async function generateMetadata() {
	return generateMeta({
		title: "Projects Reports - Collector Dashboard",
		description:
			"Comprehensive project reports with status, budget, progress, and performance analytics.",
		canonical: "/reports/projects",
	});
}

export default function ProjectsReportsPage() {
	return (
		<div className="space-y-4">
			<div className="flex flex-row items-center justify-between">
				<h1 className="text-xl font-bold tracking-tight lg:text-2xl">
					Projects Reports
				</h1>
				<div className="flex items-center space-x-2">
					<CalendarDateRangePicker />
					<ExportButton />
				</div>
			</div>

			<ProjectsKPICards />

			<div className="grid gap-4 lg:grid-cols-2">
				<ProjectsStatusChart />
				<ProjectsBudgetChart />
			</div>

			<ProjectsDataTable />
		</div>
	);
}

