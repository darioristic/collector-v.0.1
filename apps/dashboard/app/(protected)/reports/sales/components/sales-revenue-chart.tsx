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
	{ month: "Jan", revenue: 12500, orders: 320 },
	{ month: "Feb", revenue: 15200, orders: 380 },
	{ month: "Mar", revenue: 18900, orders: 450 },
	{ month: "Apr", revenue: 22100, orders: 520 },
	{ month: "May", revenue: 19800, orders: 480 },
	{ month: "Jun", revenue: 24500, orders: 580 },
	{ month: "Jul", revenue: 26700, orders: 620 },
	{ month: "Aug", revenue: 28900, orders: 680 },
	{ month: "Sep", revenue: 31200, orders: 740 },
	{ month: "Oct", revenue: 29800, orders: 710 },
	{ month: "Nov", revenue: 32400, orders: 760 },
	{ month: "Dec", revenue: 35600, orders: 840 },
];

const chartConfig = {
	revenue: {
		label: "Revenue",
		color: "hsl(var(--chart-1))",
	},
	orders: {
		label: "Orders",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

export function SalesRevenueChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Revenue & Orders Overview</CardTitle>
				<CardDescription>Monthly revenue and order trends</CardDescription>
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
						<Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

