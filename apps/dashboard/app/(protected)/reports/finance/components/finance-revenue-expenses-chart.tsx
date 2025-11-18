"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
	{ month: "Jan", revenue: 38500, expenses: 24500 },
	{ month: "Feb", revenue: 41200, expenses: 26800 },
	{ month: "Mar", revenue: 44800, expenses: 29200 },
	{ month: "Apr", revenue: 47500, expenses: 31200 },
	{ month: "May", revenue: 45200, expenses: 29800 },
	{ month: "Jun", revenue: 48900, expenses: 32500 },
	{ month: "Jul", revenue: 51200, expenses: 34200 },
	{ month: "Aug", revenue: 53800, expenses: 35800 },
	{ month: "Sep", revenue: 56500, expenses: 37800 },
	{ month: "Oct", revenue: 54200, expenses: 36200 },
	{ month: "Nov", revenue: 58800, expenses: 39200 },
	{ month: "Dec", revenue: 61200, expenses: 40800 },
];

const chartConfig = {
	revenue: {
		label: "Revenue",
		color: "hsl(var(--chart-1))",
	},
	expenses: {
		label: "Expenses",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

export function FinanceRevenueExpensesChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Revenue vs Expenses</CardTitle>
				<CardDescription>
					Monthly revenue and expenses comparison
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart
						accessibilityLayer
						data={chartData}
						margin={{
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => `$${value / 1000}k`}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="line" />}
						/>
						<Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
						<Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
