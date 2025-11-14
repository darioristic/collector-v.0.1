"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import {
	Card,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";

export function FinanceKPICards() {
	const kpiData = [
		{
			title: "Total Revenue",
			value: "$485,750",
			change: "+18.5%",
			changeType: "positive" as const,
			description: "Compared to last month",
		},
		{
			title: "Total Expenses",
			value: "$312,450",
			change: "+12.3%",
			changeType: "negative" as const,
			description: "Compared to last month",
		},
		{
			title: "Net Profit",
			value: "$173,300",
			change: "+28.2%",
			changeType: "positive" as const,
			description: "Compared to last month",
		},
		{
			title: "Profit Margin",
			value: "35.7%",
			change: "+2.1%",
			changeType: "positive" as const,
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

