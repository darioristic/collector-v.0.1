"use client";

import * as React from "react";
import { ChartAreaInteractive } from "@/components/charts/chart-area-interactive";
import { ChartBarInteractive } from "@/components/charts/chart-bar-interactive";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const dateRangeOptions = [
	{ value: "7d", label: "Last 7 days" },
	{ value: "30d", label: "Last 30 days" },
	{ value: "90d", label: "Last 3 months" },
] as const;

type Trend = "up" | "down";

type MetricCard = {
	id: number;
	label: string;
	value: string;
	change: string;
	changeLabel: string;
	trend: Trend;
	sparklineClass: string;
};

const KPI_METRICS: MetricCard[] = [
	{
		id: 1,
		label: "Total Leads Generated",
		value: "3,482",
		change: "+8.6%",
		changeLabel: "vs last period",
		trend: "up",
		sparklineClass: "from-[#C7D7FF] via-[#9DBDFF] to-[#007AFF]",
	},
	{
		id: 2,
		label: "Deals Closed",
		value: "842",
		change: "+5.1%",
		changeLabel: "conversion uplift",
		trend: "up",
		sparklineClass: "from-[#D1FAE5] via-[#6EE7B7] to-[#22C55E]",
	},
	{
		id: 3,
		label: "Conversion Rate",
		value: "24.1%",
		change: "+2.4%",
		changeLabel: "from previous cycle",
		trend: "up",
		sparklineClass: "from-[#FFE4E6] via-[#FDA4AF] to-[#FB7185]",
	},
	{
		id: 4,
		label: "Total Revenue",
		value: "€1.24M",
		change: "+11.2%",
		changeLabel: "quarterly growth",
		trend: "up",
		sparklineClass: "from-[#FDE68A] via-[#FBBF24] to-[#F59E0B]",
	},
];

type SalesRep = {
	id: number;
	name: string;
	avatar: string;
	leads: number;
	deals: number;
	conversionRate: string;
	revenue: number;
	change: string;
	trend: Trend;
};

const SALES_SUMMARY: SalesRep[] = [
	{
		id: 1,
		name: "Milica Nikolić",
		avatar: "/images/avatars/avatar-6.png",
		leads: 428,
		deals: 96,
		conversionRate: "22.4%",
		revenue: 184000,
		change: "+6.8%",
		trend: "up",
	},
	{
		id: 2,
		name: "Miloš Petrović",
		avatar: "/images/avatars/avatar-2.png",
		leads: 386,
		deals: 82,
		conversionRate: "21.2%",
		revenue: 168500,
		change: "+4.1%",
		trend: "up",
	},
	{
		id: 3,
		name: "Jelena Kovačević",
		avatar: "/images/avatars/avatar-1.png",
		leads: 352,
		deals: 74,
		conversionRate: "19.8%",
		revenue: 149200,
		change: "+3.5%",
		trend: "up",
	},
	{
		id: 4,
		name: "Nikola Stevanović",
		avatar: "/images/avatars/avatar-4.png",
		leads: 315,
		deals: 58,
		conversionRate: "18.4%",
		revenue: 132400,
		change: "-1.6%",
		trend: "down",
	},
	{
		id: 5,
		name: "Ana Stojanović",
		avatar: "/images/avatars/avatar-3.png",
		leads: 288,
		deals: 52,
		conversionRate: "18.1%",
		revenue: 126300,
		change: "+0.8%",
		trend: "up",
	},
];

const trendBadgeClass: Record<Trend, string> = {
	up: "bg-emerald-50 text-emerald-600",
	down: "bg-red-50 text-red-600",
};

const revenueFormatter = new Intl.NumberFormat("sr-RS", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0,
});

export default function CRMReportsPage() {
	const [dateRange, setDateRange] =
		React.useState<(typeof dateRangeOptions)[number]["value"]>("30d");

	const handleDateRangeChange = (value: string) => {
		setDateRange(value as (typeof dateRangeOptions)[number]["value"]);
	};

	return (
		<div className="max-w-7xl space-y-8 p-8 mx-auto">
			<section className="flex flex-col gap-6 rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight text-slate-900">
						Reports
					</h1>
					<p className="text-sm text-slate-500">
						Track your CRM growth, leads, and conversion performance over time.
					</p>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<Select value={dateRange} onValueChange={handleDateRangeChange}>
						<SelectTrigger className="w-[220px] rounded-xl border border-[#E5E5EA] bg-[#F9FAFB] text-sm font-medium text-slate-600 shadow-none">
							<SelectValue placeholder="Select range" />
						</SelectTrigger>
						<SelectContent className="rounded-xl border border-[#E5E5EA] bg-white shadow-lg">
							{dateRangeOptions.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
									className="rounded-lg text-sm"
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button className="h-11 rounded-xl bg-[#007AFF] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0063D1]">
						Export Report
					</Button>
				</div>
			</section>

			<section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
				{KPI_METRICS.map((metric) => (
					<Card
						key={metric.id}
						className="rounded-2xl border border-[#E5E5EA] bg-white shadow-sm"
					>
						<CardContent className="space-y-4 p-6">
							<div className="flex items-start justify-between">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
										{metric.label}
									</p>
									<div className="mt-3 flex items-end gap-2">
										<span className="text-3xl font-semibold text-slate-900">
											{metric.value}
										</span>
										<Badge
											className={cn(
												"rounded-full px-2.5 py-1 text-xs font-medium",
												trendBadgeClass[metric.trend],
											)}
										>
											{metric.change}
										</Badge>
									</div>
									<p className="text-xs text-slate-500">{metric.changeLabel}</p>
								</div>
							</div>
							<div
								className={cn(
									"h-2 w-full rounded-full bg-gradient-to-r",
									metric.sparklineClass,
								)}
							/>
						</CardContent>
					</Card>
				))}
			</section>

			<section className="grid gap-6 lg:grid-cols-2">
				<Card className="rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
					<CardHeader className="space-y-1">
						<CardTitle className="text-lg font-semibold text-slate-900">
							Leads by Platform
						</CardTitle>
						<CardDescription className="text-sm text-slate-500">
							Comparison of desktop vs mobile leads
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-4">
						<ChartBarInteractive />
					</CardContent>
				</Card>

				<Card className="rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
					<CardHeader className="space-y-1">
						<CardTitle className="text-lg font-semibold text-slate-900">
							Monthly Sales Performance
						</CardTitle>
						<CardDescription className="text-sm text-slate-500">
							Sales growth trend over selected period
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-4">
						<ChartAreaInteractive />
					</CardContent>
				</Card>
			</section>

			<section>
				<Card className="rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
					<CardHeader className="space-y-1 border-b border-[#E5E5EA] p-6">
						<CardTitle className="text-lg font-semibold text-slate-900">
							Sales Summary by Representative
						</CardTitle>
						<CardDescription className="text-sm text-slate-500">
							Overview of leads, deals, and conversion performance per sales
							rep.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<Table className="min-w-[720px]">
								<TableHeader className="bg-[#F9FAFB]">
									<TableRow>
										<TableHead className="rounded-tl-2xl text-xs uppercase tracking-wide text-slate-500">
											Representative
										</TableHead>
										<TableHead className="text-xs uppercase tracking-wide text-slate-500">
											Leads
										</TableHead>
										<TableHead className="text-xs uppercase tracking-wide text-slate-500">
											Deals Closed
										</TableHead>
										<TableHead className="text-xs uppercase tracking-wide text-slate-500">
											Conversion Rate
										</TableHead>
										<TableHead className="text-xs uppercase tracking-wide text-slate-500">
											Revenue
										</TableHead>
										<TableHead className="rounded-tr-2xl text-xs uppercase tracking-wide text-slate-500">
											Change
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{SALES_SUMMARY.map((rep) => (
										<TableRow
											key={rep.id}
											className="transition hover:bg-[#F1F5FF]"
										>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="size-10">
														<AvatarImage src={rep.avatar} alt={rep.name} />
														<AvatarFallback>
															{rep.name
																.split(" ")
																.map((part) => part[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
													<div className="flex flex-col">
														<span className="font-medium text-slate-700">
															{rep.name}
														</span>
														<span className="text-xs text-slate-500">
															Senior Account Executive
														</span>
													</div>
												</div>
											</TableCell>
											<TableCell className="text-slate-600">
												{rep.leads.toLocaleString("sr-RS")}
											</TableCell>
											<TableCell className="text-slate-600">
												{rep.deals.toLocaleString("sr-RS")}
											</TableCell>
											<TableCell className="text-slate-600">
												{rep.conversionRate}
											</TableCell>
											<TableCell className="text-slate-600">
												{revenueFormatter.format(rep.revenue)}
											</TableCell>
											<TableCell>
												<Badge
													className={cn(
														"rounded-full px-3 py-1 text-xs font-medium",
														trendBadgeClass[rep.trend],
													)}
												>
													{rep.change}
												</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
					<CardFooter className="flex items-center justify-between border-t border-[#E5E5EA] bg-[#FAFAFA] p-6">
						<span className="text-sm text-slate-500">
							Showing {SALES_SUMMARY.length} of {SALES_SUMMARY.length}{" "}
							representatives
						</span>
						<Button
							variant="link"
							className="text-[#007AFF] hover:text-[#0050A4]"
						>
							Show more
						</Button>
					</CardFooter>
				</Card>
			</section>
		</div>
	);
}
