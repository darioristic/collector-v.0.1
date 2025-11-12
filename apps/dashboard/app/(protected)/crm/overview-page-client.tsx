"use client";

import { format } from "date-fns";
import {
	ArrowDownRight,
	ArrowUpRight,
	CalendarIcon,
	CheckCircle,
	CircleUser,
	Download,
	Layers,
	LayoutDashboard,
	LineChart as LineChartIcon,
	Mail,
	MessageSquare,
	Phone,
	Search,
	Settings2,
	Share2,
	Target,
	Users,
	Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FilterFormValues = {
	search: string;
	period: "daily" | "weekly" | "monthly";
	date: Date;
};

type NavigationGroup = {
	label: string;
	items: Array<{
		label: string;
		href: string;
		icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	}>;
};

const NAVIGATION_GROUPS: NavigationGroup[] = [
	{
		label: "CRM",
		items: [
			{ label: "Overview", href: "/crm", icon: LayoutDashboard },
			{ label: "Leads", href: "/crm/leads", icon: Users },
			{ label: "Opportunities", href: "/crm/deals", icon: Target },
			{ label: "Contacts", href: "/accounts/contacts", icon: CircleUser },
			{ label: "Accounts", href: "/accounts/companies", icon: Layers },
			{ label: "Deals", href: "/crm/deals", icon: Workflow },
			{ label: "Pipelines", href: "/crm/activities", icon: Share2 },
		],
	},
	{
		label: "Communications",
		items: [
			{ label: "Emails", href: "#", icon: Mail },
			{ label: "Calls", href: "#", icon: Phone },
			{ label: "Meetings", href: "#", icon: MessageSquare },
		],
	},
	{
		label: "Analytics",
		items: [
			{ label: "Sales Reports", href: "#", icon: LineChartIcon },
			{ label: "Performance", href: "#", icon: Target },
			{ label: "Activity", href: "#", icon: Users },
		],
	},
	{
		label: "Customization",
		items: [
			{ label: "Themes", href: "#", icon: Settings2 },
			{ label: "Layouts", href: "#", icon: LayoutDashboard },
		],
	},
];

type KpiTrend = "up" | "down" | "neutral";

type KpiCard = {
	label: string;
	value: string;
	change: string | null;
	description: string | null;
	trend: KpiTrend;
};

const KPI_CARDS: KpiCard[] = [
	{
		label: "Engagement Score",
		value: "8.4 / 10",
		change: "+6%",
		description: "od prošlog meseca",
		trend: "up",
	},
	{
		label: "Active Contacts",
		value: "12,450",
		change: null,
		description: null,
		trend: "neutral",
	},
	{
		label: "Inactive Contacts",
		value: "1,375",
		change: null,
		description: null,
		trend: "neutral",
	},
	{
		label: "Lead Conversion Rate",
		value: "34%",
		change: "+4.2%",
		description: "vs. prethodni mesec",
		trend: "up" as const,
	},
	{
		label: "Qualified Leads",
		value: "3,290",
		change: null,
		description: null,
		trend: "neutral" as const,
	},
	{
		label: "Unqualified Leads",
		value: "1,045",
		change: null,
		description: null,
		trend: "neutral" as const,
	},
];

const SALES_GROWTH_DATA = [
	{ day: "Pon", value: 360 },
	{ day: "Uto", value: 420 },
	{ day: "Sre", value: 380 },
	{ day: "Čet", value: 440 },
	{ day: "Pet", value: 470 },
	{ day: "Sub", value: 510 },
	{ day: "Ned", value: 480 },
];

const ENGAGEMENT_ACTIVITY_DATA = [
	{ month: "Jan", email: 24, meeting: 16 },
	{ month: "Feb", email: 28, meeting: 18 },
	{ month: "Mar", email: 32, meeting: 20 },
	{ month: "Apr", email: 30, meeting: 19 },
	{ month: "Maj", email: 35, meeting: 23 },
	{ month: "Jun", email: 38, meeting: 26 },
];

const PERIOD_OPTIONS: Array<{
	value: FilterFormValues["period"];
	label: string;
}> = [
	{ value: "daily", label: "Daily" },
	{ value: "weekly", label: "Weekly" },
	{ value: "monthly", label: "Monthly" },
];

const INTERACTIONS = [
	{
		id: "INT-2048",
		name: "Jelena Kovačević",
		avatar: "/images/avatars/avatar-1.png",
		status: "Follow-Up Scheduled",
		statusTone: "blue" as const,
		channel: "Email",
		date: "08 Nov 2025",
	},
	{
		id: "INT-2047",
		name: "Miloš Petrović",
		avatar: "/images/avatars/avatar-2.png",
		status: "Meeting Confirmed",
		statusTone: "green" as const,
		channel: "Meeting",
		date: "07 Nov 2025",
	},
	{
		id: "INT-2046",
		name: "Ana Stojanović",
		avatar: "/images/avatars/avatar-3.png",
		status: "Awaiting Response",
		statusTone: "orange" as const,
		channel: "Call",
		date: "05 Nov 2025",
	},
	{
		id: "INT-2045",
		name: "Nikola Stevanović",
		avatar: "/images/avatars/avatar-4.png",
		status: "Closed Won",
		statusTone: "green" as const,
		channel: "Email",
		date: "04 Nov 2025",
	},
	{
		id: "INT-2044",
		name: "Sara Đorđević",
		avatar: "/images/avatars/avatar-5.png",
		status: "Follow-Up Scheduled",
		statusTone: "blue" as const,
		channel: "Meeting",
		date: "03 Nov 2025",
	},
];

const STATUS_STYLES: Record<string, string> = {
	blue: "bg-blue-50 text-blue-600 border border-blue-100",
	green: "bg-emerald-50 text-emerald-600 border border-emerald-100",
	orange: "bg-orange-50 text-orange-600 border border-orange-100",
};

const MONTHS = [
	{ value: "nov-2025", label: "Novembar 2025" },
	{ value: "oct-2025", label: "Oktobar 2025" },
	{ value: "sep-2025", label: "Septembar 2025" },
];

export default function CRMOverviewPage() {
	const pathname = usePathname();
	const { toast } = useToast();

	const form = useForm<FilterFormValues>({
		defaultValues: {
			search: "",
			period: "monthly",
			date: new Date(),
		},
	});

	const handleFilters = form.handleSubmit((values) => {
		toast({
			title: "Filteri primenjeni",
			description: `Prikazujemo ${values.period === "daily" ? "dnevni" : values.period === "weekly" ? "nedeljni" : "mesečni"} pregled za ${format(
				values.date,
				"dd.MM.yyyy",
			)}.`,
		});
	});

	const handleExport = () => {
		const values = form.getValues();
		toast({
			title: "Eksport pokrenut",
			description: `Generišemo ${values.period === "daily" ? "dnevni" : values.period === "weekly" ? "nedeljni" : "mesečni"} izveštaj za ${format(
				values.date,
				"dd.MM.yyyy",
			)}.`,
		});
	};

	return (
		<div className="space-y-6">
			<Form {...form}>
				<form
					onSubmit={handleFilters}
					className="grid gap-6 lg:grid-cols-[300px,minmax(0,1fr)]"
				>
					<aside className="hidden rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm lg:block">
						<div className="flex h-full flex-col justify-between gap-6">
							<div className="space-y-8">
								{NAVIGATION_GROUPS.map((group) => (
									<div key={group.label} className="space-y-3">
										<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
											{group.label}
										</p>
										<div className="space-y-1">
											{group.items.map((item) => {
												const isActive =
													item.href !== "#" &&
													(pathname === item.href ||
														pathname?.startsWith(`${item.href}/`));
												const Icon = item.icon;
												return (
													<Link
														key={item.label}
														href={item.href}
														className={cn(
															"flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
															"hover:bg-[#F1F5FF] hover:text-[#0063D1]",
															isActive
																? "bg-[#E8F1FF] text-[#0050A4] border-l-4 border-[#007AFF] pl-2"
																: "text-slate-600",
														)}
													>
														<Icon className="size-4" />
														<span>{item.label}</span>
													</Link>
												);
											})}
										</div>
									</div>
								))}
							</div>
							<div className="flex items-center gap-3 rounded-xl border border-[#E5E5EA] bg-[#F9FAFB] p-3">
								<Avatar className="size-10">
									<AvatarImage
										src="/images/avatars/avatar-6.png"
										alt="Milica Nikolić"
									/>
									<AvatarFallback>MN</AvatarFallback>
								</Avatar>
								<div className="flex flex-1 flex-col text-sm">
									<span className="font-semibold text-slate-700">
										Milica Nikolić
									</span>
									<span className="text-xs text-slate-500">CRM Manager</span>
								</div>
								<Button
									variant="outline"
									size="icon"
									className="rounded-full border-[#E5E5EA]"
								>
									<CheckCircle className="size-4" />
									<span className="sr-only">Otvorite korisnički meni</span>
								</Button>
							</div>
						</div>
					</aside>

					<div className="space-y-6 rounded-2xl border border-[#E5E5EA] bg-[#FAFAFA] p-6 shadow-sm">
						<section className="space-y-4 rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
							<div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
								<div className="relative flex-1 min-w-[220px]">
									<Input
										placeholder="Search…"
										className="rounded-xl border-[#E5E5EA] bg-[#F9FAFB] pl-11 shadow-none"
										{...form.register("search")}
									/>
									<span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
										<Search className="size-4" />
									</span>
								</div>
								<div className="flex flex-wrap items-center gap-3">
									<div className="flex gap-1 rounded-xl border border-[#E5E5EA] bg-[#F9FAFB] p-1">
										{PERIOD_OPTIONS.map((option) => {
											const isActive = form.watch("period") === option.value;
											return (
												<Button
													key={option.value}
													type="button"
													variant="ghost"
													className={cn(
														"rounded-lg px-4 py-2 text-sm font-medium transition",
														isActive
															? "bg-white text-[#007AFF] shadow-sm"
															: "text-slate-600 hover:bg-white/80",
													)}
													onClick={() => form.setValue("period", option.value)}
												>
													{option.label}
												</Button>
											);
										})}
									</div>
									<FormField
										control={form.control}
										name="date"
										render={({ field }) => (
											<FormItem>
												<Popover>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															className="flex items-center gap-2 rounded-xl border-[#E5E5EA] bg-[#F9FAFB] px-4 font-normal"
														>
															<CalendarIcon className="size-4 text-slate-500" />
															<span>
																{field.value
																	? format(field.value, "dd MMM yyyy")
																	: "Izaberi datum"}
															</span>
														</Button>
													</PopoverTrigger>
													<PopoverContent
														className="w-auto rounded-xl border-[#E5E5EA] bg-white p-0"
														align="end"
													>
														<Calendar
															mode="single"
															selected={field.value}
															onSelect={(date) =>
																field.onChange(date ?? new Date())
															}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
											</FormItem>
										)}
									/>
									<Button
										type="submit"
										variant="outline"
										className="h-11 rounded-xl border-[#E5E5EA] bg-[#F9FAFB] text-slate-600 hover:bg-[#F1F5FF] hover:text-[#0063D1]"
									>
										Primeni filtere
									</Button>
									<Button
										type="button"
										className="h-11 rounded-xl bg-[#007AFF] px-4 text-white shadow-sm transition hover:bg-[#0063D1]"
										onClick={handleExport}
									>
										<Download className="mr-2 size-4" />
										Export
									</Button>
								</div>
							</div>
						</section>

						<div>
							<h1 className="text-3xl font-semibold tracking-tight text-slate-900">
								Overview
							</h1>
							<p className="text-sm text-slate-500">
								Pratite ključne KPI-je, interakcije i prodajne performanse vašeg
								tima.
							</p>
						</div>

						<div className="grid gap-6 xl:grid-cols-2">
							<Card className="rounded-2xl border-[#E5E5EA] shadow-sm">
								<CardHeader className="flex flex-col gap-1">
									<CardTitle className="text-lg font-semibold text-slate-900">
										Projected Sales Growth
									</CardTitle>
									<CardDescription className="text-sm text-slate-500">
										Analiza performansi prodajnog levka po kanalima.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="grid gap-4 md:grid-cols-2">
										<div className="rounded-xl border border-[#E5E5EA] bg-[#F9FAFB] p-4">
											<p className="text-xs uppercase tracking-wide text-slate-500">
												Leads Generated
											</p>
											<div className="mt-2 flex items-end gap-2">
												<span className="text-2xl font-semibold text-slate-900">
													1,284
												</span>
												<Badge className="rounded-full bg-emerald-50 px-2 text-xs font-medium text-emerald-600">
													+6.4%
												</Badge>
											</div>
											<p className="mt-1 text-xs text-slate-500">
												u odnosu na prošlu nedelju
											</p>
										</div>
										<div className="rounded-xl border border-[#E5E5EA] bg-[#F9FAFB] p-4">
											<p className="text-xs uppercase tracking-wide text-slate-500">
												Conversion Rate (Today)
											</p>
											<div className="mt-2 flex items-end gap-2">
												<span className="text-2xl font-semibold text-slate-900">
													18.7%
												</span>
												<Badge className="rounded-full bg-blue-50 px-2 text-xs font-medium text-blue-600">
													16.2% juče
												</Badge>
											</div>
											<p className="mt-1 text-xs text-slate-500">
												trend rasta poslednjih 7 dana
											</p>
										</div>
									</div>
									<div className="h-56 w-full">
										<ResponsiveContainer width="100%" height="100%">
											<LineChart
												data={SALES_GROWTH_DATA}
												margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
											>
												<CartesianGrid stroke="#F3F4F6" vertical={false} />
												<XAxis
													dataKey="day"
													axisLine={false}
													tickLine={false}
													tick={{ fill: "#6B7280", fontSize: 12 }}
												/>
												<YAxis
													axisLine={false}
													tickLine={false}
													tick={{ fill: "#6B7280", fontSize: 12 }}
												/>
												<Tooltip
													cursor={{
														stroke: "#F97316",
														strokeWidth: 1,
														strokeDasharray: "3 3",
													}}
													contentStyle={{
														borderRadius: "12px",
														borderColor: "#E5E7EB",
													}}
												/>
												<Line
													type="monotone"
													dataKey="value"
													stroke="#F97316"
													strokeWidth={3}
													dot={false}
												/>
											</LineChart>
										</ResponsiveContainer>
									</div>
								</CardContent>
							</Card>

							<Card className="rounded-2xl border-[#E5E5EA] shadow-sm">
								<CardHeader className="flex flex-col gap-1">
									<CardTitle className="text-lg font-semibold text-slate-900">
										Engagement Activity
									</CardTitle>
									<CardDescription className="text-sm text-slate-500">
										Uporedni prikaz angažmana po mesecima.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="grid gap-4 md:grid-cols-2">
										<div className="rounded-xl border border-[#E5E5EA] bg-[#F9FAFB] p-4">
											<p className="text-xs uppercase tracking-wide text-slate-500">
												Responses Received
											</p>
											<div className="mt-2 flex items-end gap-2">
												<span className="text-2xl font-semibold text-slate-900">
													28
												</span>
												<Badge className="rounded-full bg-emerald-50 px-2 text-xs font-medium text-emerald-600">
													+12.0%
												</Badge>
											</div>
											<p className="mt-1 text-xs text-slate-500">
												u odnosu na prošlu nedelju
											</p>
										</div>
										<div className="rounded-xl border border-[#E5E5EA] bg-[#F9FAFB] p-4">
											<p className="text-xs uppercase tracking-wide text-slate-500">
												Response Rate (Today)
											</p>
											<div className="mt-2 flex items-end gap-2">
												<span className="text-2xl font-semibold text-slate-900">
													87.5%
												</span>
												<Badge className="rounded-full bg-blue-50 px-2 text-xs font-medium text-blue-600">
													82.3% juče
												</Badge>
											</div>
											<p className="mt-1 text-xs text-slate-500">
												konzistentan rast angažmana
											</p>
										</div>
									</div>
									<div className="h-56 w-full">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart
												data={ENGAGEMENT_ACTIVITY_DATA}
												barGap={10}
												margin={{ top: 10, left: -20, right: 10, bottom: 0 }}
											>
												<CartesianGrid stroke="#F3F4F6" vertical={false} />
												<XAxis
													dataKey="month"
													axisLine={false}
													tickLine={false}
													tick={{ fill: "#6B7280", fontSize: 12 }}
												/>
												<YAxis
													axisLine={false}
													tickLine={false}
													tick={{ fill: "#6B7280", fontSize: 12 }}
												/>
												<Tooltip
													contentStyle={{
														borderRadius: "12px",
														borderColor: "#E5E7EB",
													}}
												/>
												<Legend
													iconType="circle"
													wrapperStyle={{ fontSize: 12 }}
												/>
												<Bar
													dataKey="email"
													name="Email"
													fill="#F97316"
													radius={[8, 8, 0, 0]}
												/>
												<Bar
													dataKey="meeting"
													name="Meeting"
													fill="#22C55E"
													radius={[8, 8, 0, 0]}
												/>
											</BarChart>
										</ResponsiveContainer>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
							<h2 className="text-lg font-semibold text-slate-900">
								Customer Engagement Summary
							</h2>
							<p className="text-sm text-slate-500">
								Najvažnije metrike angažmana u aktuelnom periodu.
							</p>
							<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
								{KPI_CARDS.map((item) => (
									<div
										key={item.label}
										className="group rounded-2xl border border-[#E5E5EA] bg-[#F9FAFB] p-5 transition hover:border-[#C7D7FF] hover:bg-[#F1F5FF]"
									>
										<p className="text-xs uppercase tracking-wide text-slate-500">
											{item.label}
										</p>
										<div className="mt-3 flex items-center gap-2">
											<span className="text-2xl font-semibold text-slate-900">
												{item.value}
											</span>
											{item.change && (
												<span
													className={cn(
														"inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
														item.trend === "up"
															? "bg-emerald-50 text-emerald-600"
															: item.trend === "down"
																? "bg-red-50 text-red-600"
																: "bg-white text-slate-500 border border-[#E5E5EA]",
													)}
												>
													{item.trend === "up" ? (
														<ArrowUpRight className="size-3" />
													) : item.trend === "down" ? (
														<ArrowDownRight className="size-3" />
													) : null}
													{item.change}
												</span>
											)}
										</div>
										{item.description && (
											<p className="mt-1 text-xs text-slate-500">
												{item.description}
											</p>
										)}
									</div>
								))}
							</div>
						</div>

						<div className="rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
							<div className="flex flex-col gap-4 border-b border-[#E5E5EA] p-6 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<h2 className="text-lg font-semibold text-slate-900">
										Customer Interactions
									</h2>
									<p className="text-sm text-slate-500">
										Review your customer engagement activities for this month.
									</p>
								</div>
								<Select defaultValue={MONTHS[0]?.value}>
									<SelectTrigger className="w-[180px] rounded-xl border-[#E5E5EA] bg-white">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{MONTHS.map((month) => (
											<SelectItem key={month.value} value={month.value}>
												{month.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="overflow-x-auto">
								<Table className="min-w-[640px]">
									<TableHeader className="bg-[#F9FAFB]">
										<TableRow>
											<TableHead className="rounded-tl-2xl text-xs uppercase tracking-wide text-slate-500">
												Name
											</TableHead>
											<TableHead className="text-xs uppercase tracking-wide text-slate-500">
												Interaction ID
											</TableHead>
											<TableHead className="text-xs uppercase tracking-wide text-slate-500">
												Status
											</TableHead>
											<TableHead className="text-xs uppercase tracking-wide text-slate-500">
												Channel
											</TableHead>
											<TableHead className="rounded-tr-2xl text-xs uppercase tracking-wide text-slate-500">
												Date
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{INTERACTIONS.map((interaction) => (
											<TableRow
												key={interaction.id}
												className="transition hover:bg-[#F1F5FF]"
											>
												<TableCell className="font-medium text-slate-700">
													<div className="flex items-center gap-3">
														<Avatar className="size-9">
															<AvatarImage
																src={interaction.avatar}
																alt={interaction.name}
															/>
															<AvatarFallback>
																{interaction.name
																	.split(" ")
																	.map((part) => part[0])
																	.join("")
																	.toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<span>{interaction.name}</span>
													</div>
												</TableCell>
												<TableCell className="text-slate-500">
													{interaction.id}
												</TableCell>
												<TableCell>
													<Badge
														className={cn(
															"rounded-full px-3 py-1 text-xs font-medium",
															STATUS_STYLES[interaction.statusTone],
														)}
													>
														{interaction.status}
													</Badge>
												</TableCell>
												<TableCell className="text-slate-500">
													{interaction.channel}
												</TableCell>
												<TableCell className="text-slate-500">
													{interaction.date}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<div className="flex items-center justify-between border-t border-[#E5E5EA] p-6">
								<div className="text-sm text-slate-500">
									Prikazano {INTERACTIONS.length} interakcija
								</div>
								<Button
									variant="link"
									className="text-[#007AFF] hover:text-[#0050A4]"
								>
									Show all
								</Button>
							</div>
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
}
