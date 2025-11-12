"use client";

import {
	BriefcaseBusiness,
	Building2,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	MoreHorizontal,
	User,
} from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Deal } from "@/lib/db/schema/deals";
import { cn } from "@/lib/utils";
import { DEAL_STAGE_BADGE_CLASSNAME, type DealStage } from "../constants";
import { formatCurrency, formatDate, getInitials } from "../utils";

interface DealsCompactViewProps {
	deals: Deal[];
	onEdit: (deal: Deal) => void;
	onDelete: (deal: Deal) => void;
}

const PAGE_SIZE = 12;

const stageAccent: Record<DealStage, string> = {
	Lead: "bg-sky-50 text-sky-700 border border-sky-200",
	Qualified: "bg-blue-50 text-blue-700 border border-blue-200",
	Proposal: "bg-amber-50 text-amber-700 border border-amber-200",
	Negotiation: "bg-purple-50 text-purple-700 border border-purple-200",
	"Closed Won": "bg-emerald-50 text-emerald-700 border border-emerald-200",
	"Closed Lost": "bg-rose-50 text-rose-700 border border-rose-200",
};

export default function DealsCompactView({
	deals,
	onEdit,
	onDelete,
}: DealsCompactViewProps) {
	const [pageIndex, setPageIndex] = React.useState(0);
	const pageCount = Math.max(Math.ceil(deals.length / PAGE_SIZE), 1);

	React.useEffect(() => {
		if (pageIndex > pageCount - 1) {
			setPageIndex(pageCount - 1);
		}
	}, [pageIndex, pageCount]);

	if (deals.length === 0) {
		return (
			<div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
				No deals match your criteria. Try adjusting filters or add a new deal to
				get started.
			</div>
		);
	}

	const start = pageIndex * PAGE_SIZE;
	const end = Math.min(start + PAGE_SIZE, deals.length);
	const paginatedDeals = deals.slice(start, end);

	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
				{paginatedDeals.map((deal) => {
					const stage = deal.stage as DealStage;
					const fallbackAvatar = getInitials(deal.owner ?? "?");
					return (
						<Card
							key={deal.id}
							className="flex h-full flex-col gap-4 overflow-hidden border border-border/70 bg-card/95 shadow-sm"
						>
							<div className="flex items-start justify-between gap-3 p-4 pb-0">
								<div className="flex items-center gap-3">
									<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
										<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
									</div>
									<div className="space-y-1">
										<h3 className="text-base font-semibold leading-tight text-foreground">
											{deal.title}
										</h3>
										<p className="text-muted-foreground flex items-center gap-1 text-sm">
											<Building2 className="h-3.5 w-3.5" aria-hidden="true" />
											{deal.company}
										</p>
									</div>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon" className="h-8 w-8">
											<MoreHorizontal className="h-4 w-4" aria-hidden="true" />
											<span className="sr-only">Open deal actions</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onSelect={() => onEdit(deal)}>
											View / Edit
										</DropdownMenuItem>
										<DropdownMenuItem
											className="text-destructive"
											onSelect={() => onDelete(deal)}
										>
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							<div className="flex flex-wrap items-center gap-2 border-y border-border/60 px-4 py-3">
								<Badge
									className={cn(
										"rounded-full px-3 py-1 text-xs font-semibold uppercase",
										DEAL_STAGE_BADGE_CLASSNAME[stage],
									)}
								>
									{stage}
								</Badge>
								<span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
									{formatCurrency(deal.value)}
								</span>
								<span className="text-muted-foreground text-xs">
									Updated {formatDate(deal.updatedAt)}
								</span>
							</div>

							<div className="px-4 text-sm text-muted-foreground">
								<p className="line-clamp-3 leading-relaxed">
									{deal.notes ??
										"Keep stakeholders aligned and monitor key milestones to move this deal forward."}
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4 px-4 text-sm">
								<div className="space-y-1">
									<span className="text-muted-foreground text-xs uppercase tracking-wide">
										Owner
									</span>
									<div className="flex items-center gap-2 font-medium text-foreground">
										<Avatar className="h-7 w-7">
											<AvatarFallback>{fallbackAvatar}</AvatarFallback>
										</Avatar>
										<span>{deal.owner ?? "Unassigned"}</span>
									</div>
								</div>
								<div className="space-y-1">
									<span className="text-muted-foreground text-xs uppercase tracking-wide">
										Close Date
									</span>
									<div className="flex items-center gap-1 text-foreground">
										<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
										<span>{formatDate(deal.closeDate)}</span>
									</div>
								</div>
								<div className="space-y-1">
									<span className="text-muted-foreground text-xs uppercase tracking-wide">
										Created
									</span>
									<div className="flex items-center gap-1 text-foreground">
										<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
										<span>{formatDate(deal.createdAt)}</span>
									</div>
								</div>
								<div className="space-y-1">
									<span className="block text-muted-foreground text-xs uppercase tracking-wide">
										Stage Accent
									</span>
									<span
										className={cn(
											"inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
											stageAccent[stage],
										)}
									>
										{stage}
									</span>
								</div>
							</div>
						</Card>
					);
				})}
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
				<span>
					Showing {start + 1}&ndash;{end} of {deals.length}
				</span>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="icon"
						disabled={pageIndex === 0}
						onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
					>
						<ChevronLeft className="h-4 w-4" aria-hidden="true" />
						<span className="sr-only">Previous page</span>
					</Button>
					<span className="tabular-nums">
						Page {pageIndex + 1} of {pageCount}
					</span>
					<Button
						type="button"
						variant="outline"
						size="icon"
						disabled={pageIndex >= pageCount - 1}
						onClick={() =>
							setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))
						}
					>
						<ChevronRight className="h-4 w-4" aria-hidden="true" />
						<span className="sr-only">Next page</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
