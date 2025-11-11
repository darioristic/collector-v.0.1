"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const chartData = [
  { label: "Pon", desktop: 420, mobile: 360 },
  { label: "Uto", desktop: 480, mobile: 390 },
  { label: "Sre", desktop: 450, mobile: 410 },
  { label: "Čet", desktop: 520, mobile: 440 },
  { label: "Pet", desktop: 560, mobile: 470 },
  { label: "Sub", desktop: 510, mobile: 430 },
  { label: "Ned", desktop: 470, mobile: 400 }
];

const chartConfig = {
  desktop: {
    label: "Desktop Leads",
    color: "#007AFF"
  },
  mobile: {
    label: "Mobile Leads",
    color: "#34C759"
  }
} satisfies ChartConfig;

type Platform = "desktop" | "mobile";

type ChartBarInteractiveProps = {
  className?: string;
};

export function ChartBarInteractive({ className }: ChartBarInteractiveProps) {
  const [activePlatform, setActivePlatform] = React.useState<Platform>("desktop");

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-end">
        <ToggleGroup
          type="single"
          value={activePlatform}
          onValueChange={(value) => value && setActivePlatform(value as Platform)}
          variant="outline"
          className="h-10 rounded-xl border border-[#E5E5EA] bg-[#F9FAFB] p-1">
          <ToggleGroupItem
            value="desktop"
            className="rounded-lg px-4 py-1 text-sm font-medium data-[state=on]:bg-white data-[state=on]:text-[#007AFF] data-[state=on]:shadow-sm">
            Desktop
          </ToggleGroupItem>
          <ToggleGroupItem
            value="mobile"
            className="rounded-lg px-4 py-1 text-sm font-medium data-[state=on]:bg-white data-[state=on]:text-[#007AFF] data-[state=on]:shadow-sm">
            Mobile
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <ChartContainer config={chartConfig} className="h-[320px] w-full">
        <BarChart data={chartData} barGap={14}>
          <CartesianGrid vertical={false} stroke="#E5E5EA" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <ChartTooltip
            cursor={{ fill: "#F1F5FF" }}
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  if (typeof value !== "number") {
                    return null;
                  }

                  return (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-slate-500">{name}</span>
                      <span className="font-semibold text-slate-900">{value.toLocaleString("sr-RS")}</span>
                    </div>
                  );
                }}
              />
            }
          />
          <ChartLegend
            verticalAlign="top"
            content={<ChartLegendContent className="pt-0" />}
          />
          <Bar
            dataKey="desktop"
            radius={[10, 10, 6, 6]}
            fill="var(--color-desktop)"
            maxBarSize={48}
            opacity={activePlatform === "mobile" ? 0.35 : 1}
          />
          <Bar
            dataKey="mobile"
            radius={[10, 10, 6, 6]}
            fill="var(--color-mobile)"
            maxBarSize={48}
            opacity={activePlatform === "desktop" ? 0.35 : 1}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
