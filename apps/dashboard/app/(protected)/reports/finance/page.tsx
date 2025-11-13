import CalendarDateRangePicker from "@/components/custom-date-range-picker";
import { ExportButton } from "@/components/CardActionMenus";
import { generateMeta } from "@/lib/utils";
import {
	FinanceKPICards,
	FinanceRevenueExpensesChart,
	FinanceProfitTrendChart,
	FinanceDataTable,
} from "./components";

export async function generateMetadata() {
	return generateMeta({
		title: "Finance Reports - Collector Dashboard",
		description:
			"Comprehensive finance reports with revenue, expenses, profit, and transaction analytics.",
		canonical: "/reports/finance",
	});
}

export default function FinanceReportsPage() {
	return (
		<div className="space-y-4">
			<div className="flex flex-row items-center justify-between">
				<h1 className="text-xl font-bold tracking-tight lg:text-2xl">
					Finance Reports
				</h1>
				<div className="flex items-center space-x-2">
					<CalendarDateRangePicker />
					<ExportButton />
				</div>
			</div>

			<FinanceKPICards />

			<div className="grid gap-4 lg:grid-cols-2">
				<FinanceRevenueExpensesChart />
				<FinanceProfitTrendChart />
			</div>

			<FinanceDataTable />
		</div>
	);
}

