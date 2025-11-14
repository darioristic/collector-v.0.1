"use client";

import * as React from "react";
import { CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts";
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
	{ month: "Jan", profit: 14000 },
	{ month: "Feb", profit: 14400 },
	{ month: "Mar", profit: 15600 },
	{ month: "Apr", profit: 16300 },
	{ month: "May", profit: 15400 },
	{ month: "Jun", profit: 16400 },
	{ month: "Jul", profit: 17000 },
	{ month: "Aug", profit: 18000 },
	{ month: "Sep", profit: 18700 },
	{ month: "Oct", profit: 18000 },
	{ month: "Nov", profit: 19600 },
	{ month: "Dec", profit: 20400 },
];

const chartConfig = {
	profit: {
		label: "Profit",
		color: "hsl(var(--chart-1))",
	},
} satisfies ChartConfig;

export function FinanceProfitTrendChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Profit Trend</CardTitle>
				<CardDescription>Monthly net profit trend</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<AreaChart
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
						<Area
							type="monotone"
							dataKey="profit"
							stroke="var(--color-profit)"
							fill="var(--color-profit)"
							fillOpacity={0.2}
							strokeWidth={2}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

