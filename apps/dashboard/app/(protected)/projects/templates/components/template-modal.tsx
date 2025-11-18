"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectTemplate } from "@/lib/data/projectTemplates";
import { useCreateProjectFromTemplate } from "@/src/hooks/useProjects";
import type { ProjectUpdatePayload } from "@/src/types/projects";

type TemplateModalProps = {
	template: ProjectTemplate;
	open: boolean;
	onClose: () => void;
};

type CreateProjectFormValues = {
	name: string;
	customer: string;
	startDate: string;
	dueDate: string;
};

export function TemplateModal({ template, open, onClose }: TemplateModalProps) {
	const router = useRouter();
	const createProjectMutation = useCreateProjectFromTemplate();

	const form = useForm<CreateProjectFormValues>({
		defaultValues: {
			name: "",
			customer: "",
			startDate: "",
			dueDate: "",
		},
	});

	const totalTasks = template.phases.reduce(
		(sum, phase) => sum + phase.tasks.length,
		0,
	);

	const handleCreateProject = async (values: CreateProjectFormValues) => {
		const projectData: ProjectUpdatePayload = {
			name: values.name || template.title,
			description: template.description,
			customer: values.customer || null,
			status: "planned",
			startDate: values.startDate || null,
			dueDate: values.dueDate || null,
		};

		try {
			const project = await createProjectMutation.mutateAsync({
				template,
				projectData,
			});

			onClose();
			form.reset();
			router.push(`/projects/${project.id}`);
		} catch {
			void 0;
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{template.title}</DialogTitle>
					<DialogDescription>{template.description}</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Template Overview */}
					<div className="space-y-3">
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
						<div className="space-y-2">
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
					</div>

					{/* Phases and Tasks */}
					<div className="space-y-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Phases & Tasks
						</p>
						<Accordion type="single" collapsible className="w-full">
							{template.phases.map((phase, phaseIndex) => (
								<AccordionItem key={phaseIndex} value={`phase-${phaseIndex}`}>
									<AccordionTrigger>
										<div className="flex flex-col items-start gap-1">
											<span className="font-medium">{phase.title}</span>
											{phase.description && (
												<span className="text-xs text-muted-foreground">
													{phase.description}
												</span>
											)}
										</div>
									</AccordionTrigger>
									<AccordionContent>
										<ul className="space-y-2 pl-4">
											{phase.tasks.map((task, taskIndex) => (
												<li
													key={taskIndex}
													className="flex items-start gap-2 text-sm"
												>
													<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
													<div className="flex-1">
														<p className="font-medium">{task.title}</p>
														{task.description && (
															<p className="text-xs text-muted-foreground">
																{task.description}
															</p>
														)}
													</div>
												</li>
											))}
										</ul>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>

					{/* Project Creation Form */}
					<form
						className="space-y-4 border-t pt-4"
						onSubmit={form.handleSubmit(handleCreateProject)}
					>
						<div className="space-y-3">
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								Project Details
							</p>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="name">Project name *</Label>
									<Input
										id="name"
										placeholder={template.title}
										{...form.register("name", { required: true })}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="customer">Client</Label>
									<Input
										id="customer"
										placeholder="Client name"
										{...form.register("customer")}
									/>
								</div>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="startDate">Start date</Label>
									<Input
										id="startDate"
										type="date"
										{...form.register("startDate")}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="dueDate">Due date</Label>
									<Input
										id="dueDate"
										type="date"
										{...form.register("dueDate")}
									/>
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								disabled={createProjectMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={createProjectMutation.isPending}>
								{createProjectMutation.isPending ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Creating...
									</>
								) : (
									"Create Project"
								)}
							</Button>
						</DialogFooter>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
