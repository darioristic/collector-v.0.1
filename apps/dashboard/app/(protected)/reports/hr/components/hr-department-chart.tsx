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
	{ name: "Engineering", value: 85, fill: "hsl(var(--chart-1))" },
	{ name: "Sales", value: 45, fill: "hsl(var(--chart-2))" },
	{ name: "Marketing", value: 32, fill: "hsl(var(--chart-3))" },
	{ name: "HR", value: 18, fill: "hsl(var(--chart-4))" },
	{ name: "Finance", value: 25, fill: "hsl(var(--chart-5))" },
	{ name: "Operations", value: 42, fill: "hsl(var(--chart-6))" },
];

const chartConfig = {
	value: {
		label: "Employees",
	},
} satisfies ChartConfig;

export function HRDepartmentChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Employees by Department</CardTitle>
				<CardDescription>
					Distribution of employees across departments
				</CardDescription>
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
