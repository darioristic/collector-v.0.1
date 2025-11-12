"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Bell,
	Building2,
	CreditCard,
	type LucideIcon,
	Mail,
	MessageSquare,
	Monitor,
	Paintbrush,
	Plug2,
	Shield,
	Smartphone,
	UserRound,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
	type SettingsFormValues,
	settingsSchema,
} from "@/lib/validations/settings";
import CompanyTab from "./company/company-tab";
import {
	fetchTeamMembers,
	type TeamMember,
	type TeamMemberStatus,
} from "./teams/api";
import TeamsTab from "./teams/teams-tab";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockFetchSettings = async (): Promise<SettingsFormValues> => {
	await sleep(700);

	return {
		profilePhoto: null,
		firstName: "Andrea",
		lastName: "Milutinović",
		username: "amilutinovic",
		email: "andrea.milutinovic@example.com",
		website: "https://company.example.com",
		timezone: "Europe/Belgrade",
		language: "sr",
		startOfWeek: "monday",
		dateFormat: "DD.MM.YYYY",
		use24HourFormat: true,
		showActiveDot: false,
	};
};

const TIMEZONES = [
	{ value: "Europe/Belgrade", label: "(GMT+01:00) Belgrade" },
	{ value: "Europe/London", label: "(GMT+00:00) London" },
	{ value: "Europe/Paris", label: "(GMT+01:00) Paris" },
	{ value: "America/New_York", label: "(GMT-05:00) New York" },
	{ value: "America/Los_Angeles", label: "(GMT-08:00) Los Angeles" },
	{ value: "Asia/Tokyo", label: "(GMT+09:00) Tokyo" },
];

const LANGUAGES = [
	{ value: "sr", label: "Serbian" },
	{ value: "en", label: "English" },
	{ value: "de", label: "German" },
	{ value: "es", label: "Spanish" },
	{ value: "fr", label: "French" },
];

const START_OF_WEEK = [
	{ value: "monday", label: "Monday" },
	{ value: "sunday", label: "Sunday" },
];

const DATE_FORMATS = [
	{ value: "DD.MM.YYYY", label: "DD.MM.YYYY" },
	{ value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
	{ value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

type NotificationChannel = {
	key: string;
	label: string;
	description: string;
	icon: LucideIcon;
	hasAction?: boolean;
};

type ProjectNotification = {
	key: string;
	label: string;
	description: string;
	email: boolean;
	push: boolean;
};

const NOTIFICATION_CHANNELS: NotificationChannel[] = [
	{
		key: "inbox",
		label: "Inbox",
		description:
			"You’ll consistently get notifications for your subscriptions within your dashboard inbox.",
		icon: Bell,
	},
	{
		key: "email",
		label: "Email",
		description:
			"Get an email summary for unread notifications, grouped and sent according to urgency.",
		icon: Mail,
	},
	{
		key: "integrations",
		label: "Integrations",
		description:
			"Receive messages inside your preferred chat tools such as Slack or Discord.",
		icon: Plug2,
		hasAction: true,
	},
	{
		key: "mobile",
		label: "Mobile",
		description:
			"Get notifications directly to your mobile inbox on iOS or Android.",
		icon: Smartphone,
	},
	{
		key: "desktop",
		label: "Desktop",
		description:
			"Receive notifications on the desktop app or browser when you’re signed in.",
		icon: Monitor,
	},
];

const PROJECT_NOTIFICATIONS: ProjectNotification[] = [
	{
		key: "comments",
		label: "Comments for your tasks",
		description: "Someone leaves a comment on tasks you're assigned to.",
		email: true,
		push: true,
	},
	{
		key: "assigned",
		label: "New tasks assigned to you",
		description: "You’re assigned to a new task or subtask.",
		email: true,
		push: true,
	},
	{
		key: "completed",
		label: "Tasks completed",
		description: "Tasks you created or were assigned to are completed.",
		email: true,
		push: false,
	},
	{
		key: "uncompleted",
		label: "Tasks uncompleted",
		description: "A task you created or assigned is reopened.",
		email: false,
		push: true,
	},
	{
		key: "mentions",
		label: "You are mentioned in a task",
		description: "Someone mentions you in a comment, description or checklist.",
		email: true,
		push: true,
	},
	{
		key: "status",
		label: "Change in status",
		description: "Status updates for tasks you follow or are assigned.",
		email: false,
		push: true,
	},
];

const tabs: Array<{ value: string; label: string; icon: LucideIcon }> = [
	{ value: "profile", label: "Profile", icon: UserRound },
	{ value: "company", label: "Company", icon: Building2 },
	{ value: "teams", label: "Teams", icon: Users },
	{ value: "security", label: "Security", icon: Shield },
	{ value: "integrations", label: "Integrations", icon: Plug2 },
	{ value: "billing", label: "Billing", icon: CreditCard },
	{ value: "communication", label: "Communication", icon: MessageSquare },
	{ value: "notifications", label: "Notifications", icon: Bell },
	{ value: "appearance", label: "Appearance", icon: Paintbrush },
];

const defaultValues: SettingsFormValues = {
	profilePhoto: null,
	firstName: "",
	lastName: "",
	username: "",
	email: "",
	website: undefined,
	timezone: "",
	language: "",
	startOfWeek: "",
	dateFormat: "",
	use24HourFormat: true,
	showActiveDot: false,
};

const TEAM_MEMBER_STATUS_META: Record<
	TeamMemberStatus,
	{ label: string; dotClassName: string }
> = {
	online: { label: "Online", dotClassName: "bg-emerald-500" },
	offline: { label: "Offline", dotClassName: "bg-rose-500" },
	idle: { label: "Idle", dotClassName: "bg-amber-400" },
	invited: { label: "Invited", dotClassName: "bg-slate-400" },
};

const MAX_PROFILE_COLLEAGUES = 5;
const COLLEAGUE_SKELETON_KEYS = Array.from(
	{ length: MAX_PROFILE_COLLEAGUES },
	(_, index) => `colleague-skeleton-slot-${index}`,
);

function SettingsSkeleton() {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-7 w-40 rounded-md" />
				<Skeleton className="h-4 w-64 rounded-md" />
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center gap-2">
					{tabs.map((tab) => (
						<Skeleton
							key={`settings-skeleton-tab-${tab.value}`}
							className="h-9 w-28 rounded-xl"
						/>
					))}
				</div>
				<Card className="p-6 md:p-8">
					<SkeletonLayout />
				</Card>
			</div>
		</div>
	);
}

export default function SettingsPage() {
	const searchParams = useSearchParams();
	const defaultTab = searchParams?.get("tab") || "profile";
	const [activeTab, setActiveTab] = useState(defaultTab);
	const [isReady, setIsReady] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [initialData, setInitialData] = useState<SettingsFormValues | null>(
		null,
	);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [channelPreferences, setChannelPreferences] = useState<
		Record<string, boolean>
	>(() =>
		NOTIFICATION_CHANNELS.reduce<Record<string, boolean>>((acc, channel) => {
			acc[channel.key] = ["inbox", "email", "integrations"].includes(
				channel.key,
			);
			return acc;
		}, {}),
	);
	const [projectPreferences, setProjectPreferences] = useState<
		Record<string, { email: boolean; push: boolean }>
	>(() =>
		PROJECT_NOTIFICATIONS.reduce<
			Record<string, { email: boolean; push: boolean }>
		>((acc, notification) => {
			acc[notification.key] = {
				email: notification.email,
				push: notification.push,
			};
			return acc;
		}, {}),
	);
	const [colleagues, setColleagues] = useState<TeamMember[]>([]);
	const [colleaguesLoading, setColleaguesLoading] = useState<boolean>(true);
	const [colleaguesError, setColleaguesError] = useState<string | null>(null);
	const { toast } = useToast();

	const form = useForm<SettingsFormValues>({
		resolver: zodResolver(settingsSchema),
		defaultValues,
	});

	const watchedFirstName = form.watch("firstName");
	const watchedLastName = form.watch("lastName");

	const initials = useMemo(() => {
		const parts = [watchedFirstName, watchedLastName]
			.filter((part) => part && part.length > 0)
			.map((part) => part[0]?.toUpperCase());
		return parts.slice(0, 2).join("") || "PR";
	}, [watchedFirstName, watchedLastName]);

	useEffect(() => {
		setIsReady(true);
	}, []);

	useEffect(() => {
		const tab = searchParams?.get("tab") || "profile";
		setActiveTab(tab);
	}, [searchParams]);

	useEffect(() => {
		let isMounted = true;

		const bootstrap = async () => {
			try {
				const data = await mockFetchSettings();
				if (!isMounted) {
					return;
				}

				setInitialData(data);
				setPhotoPreview(data.profilePhoto ?? null);
				form.reset({
					...data,
					website: data.website ?? undefined,
				});
			} catch (error) {
				console.error(error);
				toast({
					title: "Učitavanje nije uspelo",
					description: "Pokušajte ponovo kasnije.",
					variant: "destructive",
				});
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		bootstrap();

		return () => {
			isMounted = false;
		};
	}, [form, toast]);

	useEffect(() => {
		let active = true;

		const loadColleagues = async () => {
			try {
				setColleaguesError(null);
				setColleaguesLoading(true);
				const members = await fetchTeamMembers({});
				if (!active) {
					return;
				}
				setColleagues(members.slice(0, MAX_PROFILE_COLLEAGUES));
			} catch (error) {
				if (!active) {
					return;
				}
				const message =
					error instanceof Error
						? error.message
						: "Nije moguće učitati kolege.";
				setColleaguesError(message);
				setColleagues([]);
			} finally {
				if (active) {
					setColleaguesLoading(false);
				}
			}
		};

		void loadColleagues();

		return () => {
			active = false;
		};
	}, []);

	const handleFileChange = (
		file: File | undefined,
		onChange: (value: string | null) => void,
	) => {
		if (!file) {
			onChange(null);
			setPhotoPreview(null);
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast({
				title: "Datoteka je prevelika",
				description: "Maksimalna veličina je 5MB.",
				variant: "destructive",
			});
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			const result = event.target?.result;
			if (typeof result === "string") {
				onChange(result);
				setPhotoPreview(result);
			}
		};
		reader.onerror = () => {
			toast({
				title: "Greška pri učitavanju slike",
				description: "Pokušajte ponovo.",
				variant: "destructive",
			});
		};
		reader.readAsDataURL(file);
	};

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const response = await fetch("/api/settings", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(values),
				credentials: "include",
			});

			if (!response.ok) {
				const error = await response.json().catch(() => null);
				throw new Error(error?.error ?? "Čuvanje nije uspelo.");
			}

			const payload = (await response.json()) as { success?: boolean };
			if (!payload.success) {
				throw new Error("Čuvanje nije uspelo.");
			}

			setInitialData(values);
			toast({
				title: "Podešavanja sačuvana",
				description: "Vaše izmene su uspešno sačuvane.",
			});
			form.reset(values);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Čuvanje nije uspelo.";
			toast({
				title: "Greška",
				description: message,
				variant: "destructive",
			});
		}
	});

	const handleCancel = () => {
		const snapshot = initialData ?? defaultValues;
		form.reset(snapshot);
		setPhotoPreview(snapshot.profilePhoto ?? null);
	};

	const disableActions = isLoading || form.formState.isSubmitting;

	if (!isReady) {
		return <SettingsSkeleton />;
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-foreground text-2xl font-semibold tracking-tight">
					Settings
				</h1>
				<p className="text-muted-foreground text-sm">
					Configure your profile, teams, billing and more.
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-6">
				<TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-xl bg-transparent p-0">
					{tabs.map(({ value, label, icon: Icon }) => (
						<TabsTrigger
							key={value}
							value={value}
							className={cn(
								"text-muted-foreground flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
								"hover:text-primary data-[state=active]:text-primary",
								"data-[state=active]:bg-card relative data-[state=active]:shadow-sm",
								"data-[state=active]:after:bg-primary data-[state=active]:after:absolute data-[state=active]:after:right-3 data-[state=active]:after:-bottom-px data-[state=active]:after:left-3 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full",
							)}
						>
							<Icon className="h-4 w-4" />
							{label}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="profile" className="mt-0">
					<Card>
						<div className="flex flex-col gap-6 p-6 md:p-8">
							<div className="flex flex-col gap-1">
								<h2 className="text-foreground text-xl font-semibold">
									Profile
								</h2>
								<p className="text-muted-foreground text-sm">
									Manage your information, preferences, and connected data.
								</p>
							</div>

							{isLoading ? (
								<SkeletonLayout />
							) : (
								<Form {...form}>
									<form className="flex flex-col gap-8" onSubmit={onSubmit}>
										<section className="flex flex-col gap-6">
											<header className="flex flex-col gap-1">
												<h3 className="text-foreground text-base font-semibold">
													Personal Information
												</h3>
											</header>

											<FormField
												control={form.control}
												name="profilePhoto"
												render={({ field }) => (
													<FormItem className="flex flex-col gap-4">
														<FormLabel className="text-foreground text-sm font-medium">
															Profile photo
														</FormLabel>
														<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
															<Avatar className="h-16 w-16 rounded-xl">
																{photoPreview ? (
																	<AvatarImage
																		src={photoPreview}
																		alt="Profile preview"
																		className="object-cover"
																	/>
																) : (
																	<AvatarFallback className="rounded-xl text-base font-semibold uppercase">
																		{initials}
																	</AvatarFallback>
																)}
															</Avatar>
															<div className="flex flex-col gap-2">
																<Input
																	type="file"
																	accept="image/png, image/jpeg, image/svg+xml"
																	disabled={disableActions}
																	onChange={(event) =>
																		handleFileChange(
																			event.target.files?.[0],
																			(value) => field.onChange(value),
																		)
																	}
																	onBlur={field.onBlur}
																/>
																<FormDescription className="text-muted-foreground text-xs">
																	PNG, JPEG, SVG (Less than 5MB)
																</FormDescription>
															</div>
														</div>
														<FormMessage />
													</FormItem>
												)}
											/>

											<div className="grid gap-4 md:grid-cols-2">
												<FormField
													control={form.control}
													name="firstName"
													render={({ field }) => (
														<FormItem>
															<FormLabel>First Name</FormLabel>
															<FormControl>
																<Input
																	placeholder="Enter first name"
																	disabled={disableActions}
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="lastName"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Last Name</FormLabel>
															<FormControl>
																<Input
																	placeholder="Enter last name"
																	disabled={disableActions}
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="username"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Username</FormLabel>
															<FormControl>
																<Input
																	placeholder="Enter username"
																	disabled
																	className="bg-muted"
																	{...field}
																/>
															</FormControl>
															<FormDescription>
																This field is managed by your organization.
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="email"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Email</FormLabel>
															<FormControl>
																<Input
																	type="email"
																	placeholder="Enter email"
																	disabled={disableActions}
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="website"
													render={({ field }) => (
														<FormItem className="md:col-span-2">
															<FormLabel>Website</FormLabel>
															<FormControl>
																<Input
																	placeholder="https://company.com"
																	disabled={disableActions}
																	value={field.value ?? ""}
																	onChange={(event) =>
																		field.onChange(event.target.value)
																	}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</section>

										<section className="flex flex-col gap-4">
											<header className="flex flex-wrap items-center justify-between gap-2">
												<div className="flex flex-col">
													<h3 className="text-foreground text-base font-semibold">
														Team directory
													</h3>
													<p className="text-muted-foreground text-sm">
														Kratak pregled kolega iz vaše kompanije.
													</p>
												</div>
												<Button
													asChild
													size="sm"
													variant="ghost"
													className="h-8 rounded-full px-3 text-xs"
												>
													<Link href="/settings?tab=teams">
														Upravljaj članovima
													</Link>
												</Button>
											</header>

											{colleaguesLoading ? (
												<div className="flex flex-col gap-3">
													{COLLEAGUE_SKELETON_KEYS.map((skeletonKey) => (
														<div
															key={skeletonKey}
															className="border-border bg-card/60 flex items-center justify-between rounded-xl border p-4"
														>
															<div className="flex items-center gap-3">
																<Skeleton className="h-10 w-10 rounded-full" />
																<div className="flex flex-col gap-2">
																	<Skeleton className="h-3 w-28 rounded-full" />
																	<Skeleton className="h-3 w-36 rounded-full" />
																</div>
															</div>
															<Skeleton className="h-3 w-24 rounded-full" />
														</div>
													))}
												</div>
											) : colleaguesError ? (
												<div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
													{colleaguesError}
												</div>
											) : colleagues.length === 0 ? (
												<div className="border-muted text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
													Trenutno nema drugih članova u vašoj kompaniji.
												</div>
											) : (
												<div className="flex flex-col gap-3">
													{colleagues.map((member) => {
														const statusMeta =
															TEAM_MEMBER_STATUS_META[member.status];
														return (
															<div
																key={member.id}
																className="border-border bg-card/60 flex items-center justify-between rounded-xl border p-4"
															>
																<div className="flex items-center gap-3">
																	<Avatar className="h-10 w-10 rounded-full">
																		{member.avatarUrl ? (
																			<AvatarImage
																				src={member.avatarUrl}
																				alt={member.fullName}
																			/>
																		) : (
																			<AvatarFallback className="bg-primary/10 text-primary rounded-full text-sm font-medium">
																				{(
																					member.firstName?.[0] ?? ""
																				).toUpperCase()}
																				{(
																					member.lastName?.[0] ?? ""
																				).toUpperCase()}
																			</AvatarFallback>
																		)}
																	</Avatar>
																	<div className="flex flex-col gap-1">
																		<span className="text-foreground text-sm font-medium">
																			{member.fullName}
																		</span>
																		<span className="text-muted-foreground text-xs">
																			{member.email}
																		</span>
																	</div>
																</div>
																<div className="flex flex-col items-end gap-1 text-right">
																	<span className="text-muted-foreground text-xs font-medium">
																		{member.role}
																	</span>
																	<span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
																		<span
																			className={cn(
																				"h-2 w-2 rounded-full",
																				statusMeta?.dotClassName ??
																					"bg-muted-foreground",
																			)}
																			aria-hidden="true"
																		/>
																		{statusMeta?.label ?? "Nepoznato"}
																	</span>
																</div>
															</div>
														);
													})}
												</div>
											)}
										</section>

										<section className="flex flex-col gap-6">
											<header className="flex flex-col gap-1">
												<h3 className="text-foreground text-base font-semibold">
													Preferences
												</h3>
												<p className="text-muted-foreground text-sm">
													Manage your application preferences.
												</p>
											</header>

											<div className="grid gap-4 md:grid-cols-2">
												<FormField
													control={form.control}
													name="timezone"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Timezone</FormLabel>
															<Select
																disabled={disableActions}
																value={field.value}
																onValueChange={field.onChange}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select timezone" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{TIMEZONES.map((option) => (
																		<SelectItem
																			key={option.value}
																			value={option.value}
																		>
																			{option.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="language"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Language</FormLabel>
															<Select
																disabled={disableActions}
																value={field.value}
																onValueChange={field.onChange}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select language" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{LANGUAGES.map((option) => (
																		<SelectItem
																			key={option.value}
																			value={option.value}
																		>
																			{option.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="startOfWeek"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Start of the week</FormLabel>
															<Select
																disabled={disableActions}
																value={field.value}
																onValueChange={field.onChange}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select date" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{START_OF_WEEK.map((option) => (
																		<SelectItem
																			key={option.value}
																			value={option.value}
																		>
																			{option.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="dateFormat"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Date format</FormLabel>
															<Select
																disabled={disableActions}
																value={field.value}
																onValueChange={field.onChange}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select format" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{DATE_FORMATS.map((option) => (
																		<SelectItem
																			key={option.value}
																			value={option.value}
																		>
																			{option.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="flex flex-col gap-4">
												<FormField
													control={form.control}
													name="use24HourFormat"
													render={({ field }) => (
														<FormItem className="border-border bg-card/60 flex items-start justify-between gap-4 rounded-xl border p-4">
															<div className="flex flex-col gap-1">
																<FormLabel className="text-foreground text-base font-medium">
																	24 hour time format
																</FormLabel>
																<FormDescription className="text-muted-foreground text-sm">
																	Example: 20:00 PM, 12-hour format if switch
																	off
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	disabled={disableActions}
																	onCheckedChange={field.onChange}
																/>
															</FormControl>
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="showActiveDot"
													render={({ field }) => (
														<FormItem className="border-border bg-card/60 flex items-start justify-between gap-4 rounded-xl border p-4">
															<div className="flex flex-col gap-1">
																<FormLabel className="text-foreground text-base font-medium">
																	Show active dot
																</FormLabel>
																<FormDescription className="text-muted-foreground text-sm">
																	Display a green dot next to your picture if
																	you’re online
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	disabled={disableActions}
																	onCheckedChange={field.onChange}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
											</div>
										</section>

										<footer className="border-border flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
											<p className="text-muted-foreground text-sm">
												Your changes haven’t been saved
											</p>
											<div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
												<Button
													type="button"
													variant="outline"
													disabled={disableActions}
													onClick={handleCancel}
												>
													Cancel
												</Button>
												<Button type="submit" disabled={disableActions}>
													{form.formState.isSubmitting
														? "Saving..."
														: "Save changes"}
												</Button>
											</div>
										</footer>
									</form>
								</Form>
							)}
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="notifications" className="mt-0 space-y-6">
					<Card>
						<div className="flex flex-col gap-6 p-6 md:p-8">
							<div className="flex flex-col gap-1">
								<h2 className="text-foreground text-2xl font-semibold">
									Notifications
								</h2>
								<p className="text-muted-foreground text-sm">
									Select where you want to be notified by our app.{" "}
									<Button
										type="button"
										variant="link"
										className="text-primary h-auto p-0 text-sm"
									>
										Learn more
									</Button>
								</p>
							</div>

							<div className="space-y-6">
								{NOTIFICATION_CHANNELS.map((channel, index) => {
									const Icon = channel.icon;
									const isEnabled = channelPreferences[channel.key];

									return (
										<div
											key={channel.key}
											className={cn(
												"flex flex-col gap-4 pt-6 first:pt-0",
												index !== 0 && "border-border border-t",
											)}
										>
											<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
												<div className="flex flex-1 items-start gap-4">
													<div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
														<Icon className="text-muted-foreground h-5 w-5" />
													</div>
													<div className="flex flex-col gap-2">
														<div>
															<p className="text-foreground text-base font-semibold">
																{channel.label}
															</p>
															<p className="text-muted-foreground text-sm">
																{channel.description}
															</p>
														</div>
														{channel.hasAction && (
															<div className="flex flex-wrap items-center gap-3 text-sm">
																<div className="text-muted-foreground flex items-center gap-2">
																	<span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full text-xs font-medium">
																		S
																	</span>
																	<span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full text-xs font-medium">
																		D
																	</span>
																	<span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full text-xs font-medium">
																		C
																	</span>
																</div>
																<Button
																	type="button"
																	variant="outline"
																	size="sm"
																	className="h-8 rounded-full px-3"
																>
																	Manage
																</Button>
															</div>
														)}
													</div>
												</div>
												<Switch
													checked={isEnabled}
													onCheckedChange={(checked) =>
														setChannelPreferences((prev) => ({
															...prev,
															[channel.key]: Boolean(checked),
														}))
													}
													className="shrink-0"
												/>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</Card>

					<Card>
						<div className="flex flex-col gap-6 p-6 md:p-8">
							<div className="flex flex-col gap-2">
								<div className="flex flex-wrap items-center justify-between gap-4">
									<div className="flex flex-col gap-1">
										<h3 className="text-foreground text-lg font-semibold">
											Project notifications
										</h3>
										<p className="text-muted-foreground text-sm">
											Choose which project updates land in your inbox and
											devices.
										</p>
									</div>
									<div className="text-muted-foreground flex items-center gap-2">
										<Mail className="h-4 w-4" />
										<Monitor className="h-4 w-4" />
									</div>
								</div>
							</div>

							<Table>
								<TableHeader>
									<TableRow className="border-border">
										<TableHead className="w-full">Notification</TableHead>
										<TableHead className="text-center">Email</TableHead>
										<TableHead className="text-center">Push</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{PROJECT_NOTIFICATIONS.map((item) => {
										const preferences = projectPreferences[item.key];
										return (
											<TableRow key={item.key} className="border-border">
												<TableCell>
													<div className="flex flex-col">
														<span className="text-foreground text-sm font-medium">
															{item.label}
														</span>
														<span className="text-muted-foreground text-xs">
															{item.description}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-center">
													<Checkbox
														checked={preferences?.email ?? false}
														onCheckedChange={(checked) =>
															setProjectPreferences((prev) => ({
																...prev,
																[item.key]: {
																	...prev[item.key],
																	email: Boolean(checked),
																},
															}))
														}
													/>
												</TableCell>
												<TableCell className="text-center">
													<Checkbox
														checked={preferences?.push ?? false}
														onCheckedChange={(checked) =>
															setProjectPreferences((prev) => ({
																...prev,
																[item.key]: {
																	...prev[item.key],
																	push: Boolean(checked),
																},
															}))
														}
													/>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="company" className="mt-0">
					<CompanyTab />
				</TabsContent>

				<TabsContent value="teams" className="mt-0">
					<TeamsTab />
				</TabsContent>

				{tabs
					.filter(
						(tab) =>
							tab.value !== "profile" &&
							tab.value !== "notifications" &&
							tab.value !== "teams" &&
							tab.value !== "company",
					)
					.map((tab) => {
						const Icon = tab.icon;
						return (
							<TabsContent key={tab.value} value={tab.value}>
								<Card className="text-muted-foreground p-10 text-center">
									<div className="mx-auto flex max-w-md flex-col items-center gap-3">
										<Icon className="text-primary h-8 w-8" />
										<h3 className="text-foreground text-lg font-semibold">
											{tab.label}
										</h3>
										<p className="text-sm">
											This section is under construction. Please check back
											later.
										</p>
									</div>
								</Card>
							</TabsContent>
						);
					})}
			</Tabs>
		</div>
	);
}

function SkeletonLayout() {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<Skeleton className="h-16 w-16 rounded-2xl" />
				<div className="flex w-full flex-col gap-2 sm:max-w-sm">
					<Skeleton className="h-10 w-full rounded-xl" />
					<Skeleton className="h-3 w-3/4 rounded-xl" />
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<Skeleton className="h-12 rounded-xl" />
				<Skeleton className="h-12 rounded-xl" />
				<Skeleton className="h-12 rounded-xl" />
				<Skeleton className="h-12 rounded-xl" />
				<Skeleton className="h-12 rounded-xl md:col-span-2" />
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<Skeleton className="h-12 rounded-xl" />
				<Skeleton className="h-12 rounded-xl" />
				<Skeleton className="h-12 rounded-xl" />
				<Skeleton className="h-12 rounded-xl" />
			</div>
			<div className="flex flex-col gap-4">
				<Skeleton className="h-20 rounded-2xl" />
				<Skeleton className="h-20 rounded-2xl" />
			</div>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<Skeleton className="h-4 w-48 rounded-xl" />
				<div className="flex gap-2">
					<Skeleton className="h-10 w-24 rounded-xl" />
					<Skeleton className="h-10 w-32 rounded-xl" />
				</div>
			</div>
		</div>
	);
}
