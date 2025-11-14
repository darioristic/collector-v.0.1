import CalendarDateRangePicker from "@/components/custom-date-range-picker";
import { ExportButton } from "@/components/CardActionMenus";
import { generateMeta } from "@/lib/utils";
import {
	SalesKPICards,
	SalesRevenueChart,
	SalesByProductChart,
	SalesDataTable,
} from "./components";

export async function generateMetadata() {
	return generateMeta({
		title: "Sales Reports - Collector Dashboard",
		description:
			"Comprehensive sales reports with analytics, KPIs, and detailed transaction data.",
		canonical: "/reports/sales",
	});
}

export default function SalesReportsPage() {
	return (
		<div className="space-y-4">
			<div className="flex flex-row items-center justify-between">
				<h1 className="text-xl font-bold tracking-tight lg:text-2xl">
					Sales Reports
				</h1>
				<div className="flex items-center space-x-2">
					<CalendarDateRangePicker />
					<ExportButton />
				</div>
			</div>

			<SalesKPICards />

			<div className="grid gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<SalesRevenueChart />
				</div>
				<div>
					<SalesByProductChart />
				</div>
			</div>

			<SalesDataTable />
		</div>
	);
}

