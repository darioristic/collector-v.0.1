"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";

export function CRMKPICards() {
	const kpiData = [
		{
			title: "Total Leads",
			value: "1,847",
			change: "+15.3%",
			changeType: "positive" as const,
			description: "Compared to last month",
		},
		{
			title: "Active Deals",
			value: "342",
			change: "+8.7%",
			changeType: "positive" as const,
			description: "Compared to last month",
		},
		{
			title: "Conversion Rate",
			value: "18.5%",
			change: "+2.3%",
			changeType: "positive" as const,
			description: "Compared to last month",
		},
		{
			title: "Average Deal Value",
			value: "$12,450",
			change: "-1.2%",
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

