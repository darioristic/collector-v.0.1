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
	{ stage: "Prospecting", count: 120, value: 240000 },
	{ stage: "Qualification", count: 85, value: 170000 },
	{ stage: "Proposal", count: 65, value: 195000 },
	{ stage: "Negotiation", count: 45, value: 180000 },
	{ stage: "Closed Won", count: 28, value: 350000 },
	{ stage: "Closed Lost", count: 12, value: 0 },
];

const chartConfig = {
	count: {
		label: "Deals",
		color: "hsl(var(--chart-1))",
	},
	value: {
		label: "Value",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

export function CRMPipelineChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Sales Pipeline</CardTitle>
				<CardDescription>Deals by stage in the sales pipeline</CardDescription>
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
							dataKey="stage"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							angle={-45}
							textAnchor="end"
							height={80}
						/>
						<YAxis tickLine={false} axisLine={false} tickMargin={8} />
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="line" />}
						/>
						<Bar dataKey="count" fill="var(--color-count)" radius={4} />
						<Bar dataKey="value" fill="var(--color-value)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
