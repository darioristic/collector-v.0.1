"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const rawData = [
  { month: "Jan 2025", closed: 42000, pipeline: 36000 },
  { month: "Feb 2025", closed: 46000, pipeline: 38000 },
  { month: "Mar 2025", closed: 48000, pipeline: 41000 },
  { month: "Apr 2025", closed: 51000, pipeline: 43000 },
  { month: "May 2025", closed: 54000, pipeline: 45000 },
  { month: "Jun 2025", closed: 57000, pipeline: 47000 },
  { month: "Jul 2025", closed: 59000, pipeline: 48000 },
  { month: "Aug 2025", closed: 61000, pipeline: 49500 },
  { month: "Sep 2025", closed: 64000, pipeline: 51000 },
  { month: "Oct 2025", closed: 66500, pipeline: 52500 },
  { month: "Nov 2025", closed: 69000, pipeline: 54000 },
  { month: "Dec 2025", closed: 72000, pipeline: 55500 }
];

const chartConfig = {
  closed: {
    label: "Closed Revenue",
    color: "#007AFF"
  },
  pipeline: {
    label: "Pipeline Forecast",
    color: "#94A3B8"
  }
} satisfies ChartConfig;

type RangeKey = "3m" | "6m" | "12m";

type ChartAreaInteractiveProps = {
  className?: string;
};

const RANGE_TO_SLICE: Record<RangeKey, number> = {
  "3m": 3,
  "6m": 6,
  "12m": 12
};

const rangeOptions: Array<{ value: RangeKey; label: string }> = [
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" }
];

export function ChartAreaInteractive({ className }: ChartAreaInteractiveProps) {
  const [range, setRange] = React.useState<RangeKey>("6m");

  const filteredData = React.useMemo(() => {
    const count = RANGE_TO_SLICE[range];
    return rawData.slice(-count);
  }, [range]);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex w-full items-center justify-end">
        <Select value={range} onValueChange={(value) => setRange(value as RangeKey)}>
          <SelectTrigger className="w-[180px] rounded-xl border border-[#E5E5EA] bg-white text-sm font-medium text-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-[#E5E5EA] shadow-lg">
            {rangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="rounded-lg text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ChartContainer config={chartConfig} className="h-[320px] w-full">
        <AreaChart data={filteredData} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="fillClosed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-closed)" stopOpacity={0.9} />
              <stop offset="95%" stopColor="var(--color-closed)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillPipeline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-pipeline)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-pipeline)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E5E5EA" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            minTickGap={24}
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value, name) => {
                  if (typeof value !== "number") {
                    return null;
                  }

                  return (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-slate-500">{name}</span>
                      <span className="font-semibold text-slate-900">
                        {value.toLocaleString("sr-RS", {
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 0
                        })}
                      </span>
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
          <Area
            type="monotone"
            dataKey="pipeline"
            fill="url(#fillPipeline)"
            stroke="var(--color-pipeline)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="closed"
            fill="url(#fillClosed)"
            stroke="var(--color-closed)"
            strokeWidth={3}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
