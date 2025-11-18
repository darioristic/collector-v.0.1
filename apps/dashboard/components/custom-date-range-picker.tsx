"use client";

import {
	endOfDay,
	endOfMonth,
	format,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
	subDays,
	subMonths,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const dateFilterPresets = [
	{ name: "Today", value: "today" },
	{ name: "Yesterday", value: "yesterday" },
	{ name: "This Week", value: "thisWeek" },
	{ name: "Last 7 Days", value: "last7Days" },
	{ name: "Last 28 Days", value: "last28Days" },
	{ name: "This Month", value: "thisMonth" },
	{ name: "Last Month", value: "lastMonth" },
	{ name: "This Year", value: "thisYear" },
];

export default function CalendarDateRangePicker({
	className,
}: React.HTMLAttributes<HTMLDivElement>) {
	const isMobile = useIsMobile();
	const [mounted, setMounted] = React.useState(false);

	// Initialize with undefined to avoid hydration mismatch
	// Set actual date range after component mounts on client
	const [date, setDate] = React.useState<DateRange | undefined>(undefined);
	const [open, setOpen] = React.useState(false);
	const [currentMonth, setCurrentMonth] = React.useState<Date | undefined>(
		undefined,
	);

	// Initialize date range after mount to avoid hydration mismatch
	React.useEffect(() => {
		setMounted(true);
		const today = new Date();
		const twentyEightDaysAgo = startOfDay(subDays(today, 27));
		setDate({
			from: twentyEightDaysAgo,
			to: endOfDay(today),
		});
		setCurrentMonth(today);
	}, []);

	const handleQuickSelect = (from: Date, to: Date) => {
		setDate({ from, to });
		setCurrentMonth(from);
	};

	const changeHandle = (type: string) => {
		const today = new Date();

		switch (type) {
			case "today":
				handleQuickSelect(startOfDay(today), endOfDay(today));
				break;
			case "yesterday": {
				const yesterday = subDays(today, 1);
				handleQuickSelect(startOfDay(yesterday), endOfDay(yesterday));
				break;
			}
			case "thisWeek": {
				const startOfCurrentWeek = startOfWeek(today);
				handleQuickSelect(startOfDay(startOfCurrentWeek), endOfDay(today));
				break;
			}
			case "last7Days": {
				const sevenDaysAgo = subDays(today, 6);
				handleQuickSelect(startOfDay(sevenDaysAgo), endOfDay(today));
				break;
			}
			case "last28Days": {
				const twentyEightDaysAgo = subDays(today, 27); // 27 days ago + today = 28 days
				handleQuickSelect(startOfDay(twentyEightDaysAgo), endOfDay(today));
				break;
			}
			case "thisMonth":
				handleQuickSelect(startOfMonth(today), endOfDay(today));
				break;
			case "lastMonth": {
				const lastMonth = subMonths(today, 1);
				handleQuickSelect(startOfMonth(lastMonth), endOfMonth(lastMonth));
				break;
			}
			case "thisYear": {
				const startOfCurrentYear = startOfYear(today);
				handleQuickSelect(startOfDay(startOfCurrentYear), endOfDay(today));
				break;
			}
		}
	};

	return (
		<div className={cn("grid gap-2", className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					{isMobile ? (
						<div>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant={"outline"}
											className={cn(
												"justify-start text-left font-normal",
												!date && "text-muted-foreground",
											)}
										>
											<CalendarIcon />
										</Button>
									</TooltipTrigger>
									<TooltipContent suppressHydrationWarning>
										{mounted && date?.from ? (
											date.to ? (
												<>
													{format(date.from, "dd MMM yyyy")} -{" "}
													{format(date.to, "dd MMM yyyy")}
												</>
											) : (
												format(date.from, "dd MMM yyyy")
											)
										) : (
											<span>Select date range</span>
										)}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					) : (
						<Button
							variant={"outline"}
							className={cn(
								"justify-start text-left font-normal",
								!date && "text-muted-foreground",
							)}
							suppressHydrationWarning
						>
							<CalendarIcon />
							{mounted && date?.from ? (
								date.to ? (
									<>
										{format(date.from, "dd MMM yyyy")} -{" "}
										{format(date.to, "dd MMM yyyy")}
									</>
								) : (
									format(date.from, "dd MMM yyyy")
								)
							) : (
								<span>Select date range</span>
							)}
						</Button>
					)}
				</PopoverTrigger>
				<PopoverContent className="w-auto" align="end">
					<div className="flex flex-col lg:flex-row">
						<div className="me-0 lg:me-4">
							<ToggleGroup
								type="single"
								defaultValue="last28Days"
								className="hidden w-28 flex-col lg:block"
							>
								{dateFilterPresets.map((item, key) => (
									<ToggleGroupItem
										key={key}
										className="text-muted-foreground w-full"
										value={item.value}
										onClick={() => changeHandle(item.value)}
										asChild
									>
										<Button className="justify-start rounded-md">
											{item.name}
										</Button>
									</ToggleGroupItem>
								))}
							</ToggleGroup>
							<Select
								defaultValue="last28Days"
								onValueChange={(value) => changeHandle(value)}
							>
								<SelectTrigger
									className="mb-4 flex w-full lg:hidden"
									size="sm"
									aria-label="Select a value"
								>
									<SelectValue placeholder="Last 28 Days" />
								</SelectTrigger>
								<SelectContent>
									{dateFilterPresets.map((item, key) => (
										<SelectItem key={key} value={item.value}>
											{item.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{mounted && currentMonth ? (
							<Calendar
								className="border-s-0 py-0! ps-0! pe-0! lg:border-s lg:ps-4!"
								mode="range"
								month={currentMonth}
								selected={date}
								onSelect={(newDate) => {
									setDate(newDate);
									if (newDate?.from) {
										setCurrentMonth(newDate.from);
									}
								}}
								onMonthChange={setCurrentMonth}
							/>
						) : (
							<div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
								Loading calendar...
							</div>
						)}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
