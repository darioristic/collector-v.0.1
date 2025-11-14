"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import {
	Card,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";

export function HRKPICards() {
	const kpiData = [
		{
			title: "Total Employees",
			value: "247",
			change: "+5.2%",
			changeType: "positive" as const,
			description: "Compared to last month",
		},
		{
			title: "Active Employees",
			value: "235",
			change: "+3.1%",
			changeType: "positive" as const,
			description: "Compared to last month",
		},
		{
			title: "Average Attendance",
			value: "94.5%",
			change: "+1.8%",
			changeType: "positive" as const,
			description: "Compared to last month",
		},
		{
			title: "New Hires",
			value: "12",
			change: "-2",
			changeType: "negative" as const,
			description: "Compared to last month",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{kpiData.map((kpi) => (
				<Card key={kpi.title}>
					<CardHeader className="space-y-1">
						<CardDescription>{kpi.title}</CardDescription>
						<div className="font-display text-2xl lg:text-3xl">{kpi.value}</div>
						<div className="flex items-center text-xs">
							{kpi.changeType === "positive" ? (
								<ArrowUpIcon className="mr-1 size-3 text-green-500" />
							) : (
								<ArrowDownIcon className="mr-1 size-3 text-red-500" />
							)}
							<span
								className={`font-medium ${
									kpi.changeType === "positive"
										? "text-green-500"
										: "text-red-500"
								}`}
							>
								{kpi.change}
							</span>
							<span className="text-muted-foreground ml-1">
								{kpi.description}
							</span>
						</div>
					</CardHeader>
				</Card>
			))}
		</div>
	);
}

