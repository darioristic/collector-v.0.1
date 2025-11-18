"use client";

import * as React from "react";
import { Cell, Pie, PieChart } from "recharts";
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

const data = [
	{ name: "Product A", value: 35, fill: "hsl(var(--chart-1))" },
	{ name: "Product B", value: 28, fill: "hsl(var(--chart-2))" },
	{ name: "Product C", value: 22, fill: "hsl(var(--chart-3))" },
	{ name: "Product D", value: 15, fill: "hsl(var(--chart-4))" },
];

const chartConfig = {
	value: {
		label: "Sales",
	},
} satisfies ChartConfig;

export function SalesByProductChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Sales by Product</CardTitle>
				<CardDescription>Product sales distribution</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={chartConfig}
					className="mx-auto aspect-square max-h-[300px]"
				>
					<PieChart>
						<ChartTooltip content={<ChartTooltipContent hideLabel />} />
						<Pie
							data={data}
							dataKey="value"
							nameKey="name"
							cx="50%"
							cy="50%"
							outerRadius={80}
							label={({ name, percent }) =>
								`${name}: ${(percent * 100).toFixed(0)}%`
							}
						>
							{data.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={entry.fill} />
							))}
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
