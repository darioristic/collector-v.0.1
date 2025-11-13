"use client";

import { FileText } from "lucide-react";

import type { ProjectTemplate } from "@/lib/data/projectTemplates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type TemplateCardProps = {
	template: ProjectTemplate;
	onUseTemplate: (template: ProjectTemplate) => void;
};

export function TemplateCard({ template, onUseTemplate }: TemplateCardProps) {
	const totalTasks = template.phases.reduce(
		(sum, phase) => sum + phase.tasks.length,
		0,
	);

	return (
		<Card className="border-border/80 shadow-sm transition hover:-translate-y-[3px] hover:shadow-lg flex h-full flex-col justify-between">
			<CardHeader className="space-y-5">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="rounded-full bg-primary/10 p-2 text-primary">
							<FileText className="size-5" />
						</div>
						<div>
							<CardTitle className="text-lg font-semibold leading-tight">
								{template.title}
							</CardTitle>
							<CardDescription className="text-sm text-muted-foreground">
								{template.description}
							</CardDescription>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline" className="border-dashed">
						{template.durationEstimate}
					</Badge>
					<Badge variant="outline" className="border-dashed">
						{template.phases.length} phases
					</Badge>
					<Badge variant="outline" className="border-dashed">
						{totalTasks} tasks
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col gap-6">
				<div className="space-y-3">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Key Tools
					</p>
					<div className="flex flex-wrap gap-2">
						{template.keyTools.map((tool) => (
							<Badge
								key={tool}
								className="border border-primary/20 bg-primary/10 text-primary"
							>
								{tool}
							</Badge>
						))}
					</div>
				</div>

				<div className="flex items-center justify-between rounded-xl border border-dashed border-border/80 bg-muted/40 p-4">
					<div className="flex flex-col gap-1">
						<span className="text-xs uppercase text-muted-foreground">
							Template
						</span>
						<p className="text-sm font-medium text-foreground">
							Ready to use
						</p>
					</div>
					<Button
						onClick={() => onUseTemplate(template)}
						variant="default"
						className="gap-2"
					>
						Use Template
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

