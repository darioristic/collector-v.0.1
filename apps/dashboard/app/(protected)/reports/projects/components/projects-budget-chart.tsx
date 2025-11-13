"use client";

import * as React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
	{ month: "Jan", budget: 180000, spent: 165000 },
	{ month: "Feb", budget: 195000, spent: 182000 },
	{ month: "Mar", budget: 210000, spent: 198000 },
	{ month: "Apr", budget: 225000, spent: 215000 },
	{ month: "May", budget: 240000, spent: 228000 },
	{ month: "Jun", budget: 255000, spent: 245000 },
	{ month: "Jul", budget: 270000, spent: 262000 },
	{ month: "Aug", budget: 285000, spent: 278000 },
	{ month: "Sep", budget: 300000, spent: 292000 },
	{ month: "Oct", budget: 315000, spent: 308000 },
	{ month: "Nov", budget: 330000, spent: 325000 },
	{ month: "Dec", budget: 345000, spent: 338000 },
];

const chartConfig = {
	budget: {
		label: "Budget",
		color: "hsl(var(--chart-1))",
	},
	spent: {
		label: "Spent",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

export function ProjectsBudgetChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Budget vs Spent</CardTitle>
				<CardDescription>Monthly budget allocation and spending</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<LineChart
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
						<Line
							type="monotone"
							dataKey="budget"
							stroke="var(--color-budget)"
							strokeWidth={2}
							dot={false}
						/>
						<Line
							type="monotone"
							dataKey="spent"
							stroke="var(--color-spent)"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

