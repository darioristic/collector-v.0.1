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
	{ month: "Jan", active: 35, completed: 8, onHold: 5 },
	{ month: "Feb", active: 38, completed: 10, onHold: 4 },
	{ month: "Mar", active: 40, completed: 12, onHold: 3 },
	{ month: "Apr", active: 42, completed: 11, onHold: 6 },
	{ month: "May", active: 39, completed: 14, onHold: 4 },
	{ month: "Jun", active: 44, completed: 13, onHold: 5 },
	{ month: "Jul", active: 41, completed: 15, onHold: 3 },
	{ month: "Aug", active: 43, completed: 12, onHold: 4 },
	{ month: "Sep", active: 45, completed: 14, onHold: 5 },
	{ month: "Oct", active: 42, completed: 16, onHold: 3 },
	{ month: "Nov", active: 44, completed: 15, onHold: 4 },
	{ month: "Dec", active: 42, completed: 18, onHold: 2 },
];

const chartConfig = {
	active: {
		label: "Active",
		color: "hsl(var(--chart-1))",
	},
	completed: {
		label: "Completed",
		color: "hsl(var(--chart-2))",
	},
	onHold: {
		label: "On Hold",
		color: "hsl(var(--chart-3))",
	},
} satisfies ChartConfig;

export function ProjectsStatusChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Projects by Status</CardTitle>
				<CardDescription>Monthly project status distribution</CardDescription>
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
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="line" />}
						/>
						<Bar dataKey="active" fill="var(--color-active)" radius={4} />
						<Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
						<Bar dataKey="onHold" fill="var(--color-onHold)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

