import { format, parseISO } from "date-fns";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProjectDetails } from "@/src/types/projects";

const statusVariants: Record<string, string> = {
	planned: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200",
	active:
		"bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
	on_hold:
		"bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
	completed:
		"bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-200",
};

const formatter = (value: string | null) => {
	if (!value) {
		return "N/A";
	}

	try {
		return format(parseISO(value), "dd MMM yyyy");
	} catch {
		return value;
	}
};

type ProjectOverviewProps = {
	project: ProjectDetails;
};

export function ProjectOverview({ project }: ProjectOverviewProps) {
	const stats = [
		{
			label: "Ukupno zadataka",
			value: project.quickStats.totalTasks,
			accent: "bg-muted text-foreground",
		},
		{
			label: "Završeno",
			value: project.quickStats.completedTasks,
			accent: "bg-emerald-500/10 text-emerald-500",
		},
		{
			label: "Preostalo",
			value: project.quickStats.remainingTasks,
			accent: "bg-amber-500/10 text-amber-500",
		},
		{
			label: "Dana do kraja",
			value: project.quickStats.remainingDays ?? "∞",
			accent: "bg-blue-500/10 text-blue-500",
		},
	];

	return (
		<Card className="border-none bg-gradient-to-br from-card/95 via-card/90 to-muted/40 shadow-xl shadow-primary/5">
			<CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-3">
					<div className="flex flex-wrap items-center gap-3">
						<Badge
							className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
								statusVariants[project.status] ?? "bg-muted text-foreground"
							}`}
						>
							{project.statusLabel}
						</Badge>
						{project.customer && (
							<Badge
								variant="outline"
								className="rounded-full border-dashed px-3 py-1 text-xs"
							>
								Klijent • {project.customer}
							</Badge>
						)}
					</div>
					<CardTitle className="font-display text-2xl tracking-tight lg:text-3xl">
						{project.name}
					</CardTitle>
					{project.description && (
						<p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
							{project.description}
						</p>
					)}
				</div>
				<div className="grid gap-2 text-sm text-muted-foreground">
					<div className="flex items-center gap-2">
						<span className="font-medium text-foreground">Vlasnik:</span>
						<span>{project.owner?.name ?? "Nije dodeljeno"}</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="font-medium text-foreground">Početak:</span>
						<span>{formatter(project.startDate)}</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="font-medium text-foreground">Rok:</span>
						<span>{formatter(project.dueDate)}</span>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-6 py-6">
				<div>
					<div className="flex items-center justify-between text-sm font-medium">
						<span>
							Napravljeno {project.completedTasks} od {project.totalTasks}{" "}
							zadataka
						</span>
						<span>{project.progress}%</span>
					</div>
					<Progress
						value={project.progress}
						className="mt-3 h-3 rounded-full bg-muted"
					/>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{stats.map((stat, index) => (
						<motion.div
							key={stat.label}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
						>
							<Card className="border-none bg-card/80 shadow-lg shadow-primary/5">
								<CardContent className="flex flex-col gap-2 py-5">
									<span className="text-muted-foreground text-xs uppercase tracking-wide">
										{stat.label}
									</span>
									<div
										className={`inline-flex items-center justify-between rounded-lg px-3 py-2 text-lg font-semibold ${stat.accent}`}
									>
										{stat.value}
									</div>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
