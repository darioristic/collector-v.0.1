"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import * as React from "react";
import { MailDisplayMobile } from "@/app/(protected)/apps/mail/components/mail-display-mobile";
import { NavDesktop } from "@/app/(protected)/apps/mail/components/nav-desktop";
import { NavMobile } from "@/app/(protected)/apps/mail/components/nav-mobile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Mail } from "../data";
import { useMailStore } from "../use-mail";
import { MailDisplay } from "./mail-display";
import { MailList } from "./mail-list";

interface MailProps {
	accounts: {
		label: string;
		email: string;
		icon: React.ReactNode;
	}[];
	mails: Mail[];
	defaultLayout: number[] | undefined;
	defaultCollapsed?: boolean;
	navCollapsedSize: number;
}

export function Mail({
	mails,
	defaultLayout = [20, 32, 48],
	defaultCollapsed = false,
	navCollapsedSize,
}: MailProps) {
	const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
	const isMobile = useIsMobile();
	const { selectedMail } = useMailStore();
	const [tab, setTab] = React.useState("all");
	const { toast } = useToast();
	const [isComposeOpen, setIsComposeOpen] = React.useState(false);
	const [composeTo, setComposeTo] = React.useState("");
	const [composeSubject, setComposeSubject] = React.useState("");
	const [composeBody, setComposeBody] = React.useState("");

	const {
		data: inboxData,
		isFetching: inboxLoading,
		error: inboxError,
		refetch,
	} = useQuery({
		queryKey: ["imap-messages", tab],
		queryFn: async () => {
			const qs = new URLSearchParams({
				limit: "50",
				unreadOnly: String(tab === "unread"),
			});
			const res = await fetch(
				`/api/integrations/imap/messages?${qs.toString()}`,
				{ cache: "no-store" },
			);
			if (!res.ok) throw new Error(await res.text());
			return res.json() as Promise<{ items: Mail[] }>;
		},
	});

	const sendMutation = useMutation({
		mutationFn: async (payload: {
			to: string;
			subject: string;
			html: string;
		}) => {
			const res = await fetch(`/api/integrations/smtp/send`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) throw new Error(await res.text());
			return res.json();
		},
		onSuccess: () => {
			toast({ title: "Poruka poslata" });
			setIsComposeOpen(false);
			setComposeTo("");
			setComposeSubject("");
			setComposeBody("");
		},
		onError: () => {
			toast({ title: "Slanje nije uspelo" });
		},
	});

	return (
		<TooltipProvider delayDuration={0}>
			<ResizablePanelGroup
				direction="horizontal"
				onLayout={(sizes: number[]) => {
					document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(sizes)}`;
				}}
				className="items-stretch"
			>
				<ResizablePanel
					hidden={isMobile}
					defaultSize={defaultLayout[0]}
					collapsedSize={navCollapsedSize}
					collapsible={true}
					minSize={15}
					maxSize={20}
					onCollapse={() => {
						setIsCollapsed(true);
						document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
					}}
					onResize={() => {
						setIsCollapsed(false);
						document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`;
					}}
					className={cn(
						isCollapsed &&
							"min-w-[50px] transition-all duration-300 ease-in-out",
					)}
				>
					<NavDesktop isCollapsed={isCollapsed} />
				</ResizablePanel>
				<ResizableHandle hidden={isMobile} withHandle />
				<ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
					<Tabs
						defaultValue="all"
						className="flex h-full flex-col gap-0"
						onValueChange={(value) => setTab(value)}
					>
						<div className="flex items-center px-4 py-2">
							<div className="flex items-center gap-2">
								{isMobile && <NavMobile />}
								<h1 className="text-xl font-bold">Inbox</h1>
							</div>
							<TabsList className="ml-auto">
								<TabsTrigger value="all">All</TabsTrigger>
								<TabsTrigger value="unread">Unread</TabsTrigger>
							</TabsList>
							<button
								className="ms-2 rounded-full border px-3 py-1 text-sm"
								onClick={() => setIsComposeOpen((v) => !v)}
							>
								Compose
							</button>
						</div>
						<Separator />
						<div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
							<form>
								<div className="relative">
									<Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
									<Input placeholder="Search" className="pl-8" />
								</div>
							</form>
						</div>
						{isComposeOpen && (
							<div className="p-4">
								<div className="grid gap-4 md:grid-cols-2">
									<div className="flex flex-col gap-2">
										<Label>To</Label>
										<Input
											value={composeTo}
											onChange={(e) => setComposeTo(e.target.value)}
											placeholder="recipient@example.com"
										/>
									</div>
									<div className="flex flex-col gap-2 md:col-span-2">
										<Label>Subject</Label>
										<Input
											value={composeSubject}
											onChange={(e) => setComposeSubject(e.target.value)}
											placeholder="Subject"
										/>
									</div>
									<div className="flex flex-col gap-2 md:col-span-2">
										<Label>Message</Label>
										<Textarea
											value={composeBody}
											onChange={(e) => setComposeBody(e.target.value)}
											rows={6}
										/>
									</div>
									<div className="md:col-span-2">
										<button
											className="rounded-full bg-primary px-4 py-2 text-white"
											disabled={
												sendMutation.isPending ||
												!composeTo ||
												!composeSubject ||
												!composeBody
											}
											onClick={() =>
												sendMutation.mutate({
													to: composeTo,
													subject: composeSubject,
													html: composeBody.replace(/\n/g, "<br/>"),
												})
											}
										>
											Send
										</button>
									</div>
								</div>
							</div>
						)}
						<div className="min-h-0">
							{inboxLoading ? (
								<div className="p-4 text-sm text-muted-foreground">
									Loading...
								</div>
							) : inboxError ? (
								<div className="p-4 text-sm text-red-600">
									Failed to load messages
								</div>
							) : (
								<MailList items={inboxData?.items || []} />
							)}
						</div>
					</Tabs>
				</ResizablePanel>
				<ResizableHandle hidden={isMobile} withHandle />
				<ResizablePanel
					defaultSize={defaultLayout[2]}
					hidden={isMobile}
					minSize={30}
				>
					{isMobile ? (
						<MailDisplayMobile
							mail={
								(inboxData?.items || []).find(
									(item) => item.id === selectedMail?.id,
								) || null
							}
						/>
					) : (
						<MailDisplay
							mail={
								(inboxData?.items || []).find(
									(item) => item.id === selectedMail?.id,
								) || null
							}
						/>
					)}
				</ResizablePanel>
			</ResizablePanelGroup>
		</TooltipProvider>
	);
}
