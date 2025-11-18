import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ExportButton } from "@/components/CardActionMenus";
import CalendarDateRangePicker from "@/components/custom-date-range-picker";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
	return generateMeta({
		title: "Reports & Analytics - Collector Dashboard",
		description:
			"Central hub for all reports and analytics across Sales, CRM, HR, Projects, and Finance modules.",
		canonical: "/reports",
	});
}

export default function ReportsOverviewPage() {
	const reportModules = [
		{
			title: "Sales Reports",
			description:
				"Revenue, orders, conversion rates, and sales performance metrics",
			href: "/reports/sales",
			metrics: [
				{ label: "Total Revenue", value: "$124,580" },
				{ label: "Total Orders", value: "1,247" },
				{ label: "Conversion Rate", value: "3.24%" },
			],
		},
		{
			title: "CRM Reports",
			description: "Leads, deals, pipeline analytics, and conversion metrics",
			href: "/reports/crm",
			metrics: [
				{ label: "Total Leads", value: "1,847" },
				{ label: "Active Deals", value: "342" },
				{ label: "Conversion Rate", value: "18.5%" },
			],
		},
		{
			title: "HR Reports",
			description: "Employee statistics, attendance, and department analytics",
			href: "/reports/hr",
			metrics: [
				{ label: "Total Employees", value: "247" },
				{ label: "Active Employees", value: "235" },
				{ label: "Avg Attendance", value: "94.5%" },
			],
		},
		{
			title: "Projects Reports",
			description:
				"Project status, budget, progress, and performance analytics",
			href: "/reports/projects",
			metrics: [
				{ label: "Active Projects", value: "42" },
				{ label: "Completed Projects", value: "128" },
				{ label: "On-Time Delivery", value: "87.5%" },
			],
		},
		{
			title: "Finance Reports",
			description:
				"Revenue, expenses, profit, and financial transaction analytics",
			href: "/reports/finance",
			metrics: [
				{ label: "Total Revenue", value: "$485,750" },
				{ label: "Net Profit", value: "$173,300" },
				{ label: "Profit Margin", value: "35.7%" },
			],
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-row items-center justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight lg:text-2xl">
						Reports & Analytics
					</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Central hub for all reports and analytics across all modules
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<CalendarDateRangePicker />
					<ExportButton />
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{reportModules.map((module) => (
					<Card
						key={module.title}
						className="hover:shadow-md transition-shadow"
					>
						<CardHeader>
							<CardTitle>{module.title}</CardTitle>
							<CardDescription>{module.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="grid grid-cols-3 gap-2">
									{module.metrics.map((metric) => (
										<div key={metric.label} className="space-y-1">
											<div className="text-xs text-muted-foreground">
												{metric.label}
											</div>
											<div className="text-sm font-semibold">
												{metric.value}
											</div>
										</div>
									))}
								</div>
								<Button asChild variant="outline" className="w-full">
									<Link href={module.href}>
										View Reports
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
