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
	{ month: "Jan", attendance: 92, target: 95 },
	{ month: "Feb", attendance: 94, target: 95 },
	{ month: "Mar", attendance: 93, target: 95 },
	{ month: "Apr", attendance: 95, target: 95 },
	{ month: "May", attendance: 94, target: 95 },
	{ month: "Jun", attendance: 96, target: 95 },
	{ month: "Jul", attendance: 95, target: 95 },
	{ month: "Aug", attendance: 94, target: 95 },
	{ month: "Sep", attendance: 95, target: 95 },
	{ month: "Oct", attendance: 96, target: 95 },
	{ month: "Nov", attendance: 94, target: 95 },
	{ month: "Dec", attendance: 95, target: 95 },
];

const chartConfig = {
	attendance: {
		label: "Attendance",
		color: "hsl(var(--chart-1))",
	},
	target: {
		label: "Target",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

export function HRAttendanceChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Employee Attendance</CardTitle>
				<CardDescription>Monthly attendance rate vs target</CardDescription>
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
							tickFormatter={(value) => `${value}%`}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="line" />}
						/>
						<Bar
							dataKey="attendance"
							fill="var(--color-attendance)"
							radius={4}
						/>
						<Bar dataKey="target" fill="var(--color-target)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
