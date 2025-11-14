import { Download } from "lucide-react";
import CalendarDateRangePicker from "@/components/custom-date-range-picker";

import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/ui/page-header";
import { generateMeta } from "@/lib/utils";
import KPICards from "@/app/(protected)/finance/components/kpi-cards";
import MonthlyExpenses from "@/app/(protected)/finance/components/monthly-expenses";
import CreditCards from "@/app/(protected)/finance/components/my-wallet";
import Revenue from "@/app/(protected)/finance/components/revenue";
import SavingGoal from "@/app/(protected)/finance/components/saving-goal";
import Summary from "@/app/(protected)/finance/components/summary";
import Transactions from "@/app/(protected)/finance/components/transactions";

export async function generateMetadata() {
	return generateMeta({
		title: "Dashboard - Collector Dashboard",
		description:
			"A finance dashboard is an admin panel that visualizes key financial data such as income, expenses, cash flow, budget, and profit. Built with shadcn/ui, Tailwind CSS, Next.js.",
		canonical: "/dashboard",
	});
}

export default function Page() {
	return (
		<div className="space-y-4">
			<DashboardPageHeader
				title="Finance Dashboard"
				description="Overview of your financial performance, transactions, and key metrics."
				actions={
					<>
						<CalendarDateRangePicker />
						<Button size="icon">
							<Download />
						</Button>
					</>
				}
			/>

			<KPICards />

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
				<Revenue />
				<MonthlyExpenses />
				<Summary />
			</div>

			<div className="grid-cols-2 gap-4 space-y-4 lg:grid lg:space-y-0">
				<Transactions />
				<div className="space-y-4">
					<SavingGoal />
					<CreditCards />
				</div>
			</div>
		</div>
	);
}

