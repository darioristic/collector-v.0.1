"use client";

import { useState } from "react";

import { projectTemplates, type ProjectTemplate } from "@/lib/data/projectTemplates";

import { TemplateCard } from "./components/template-card";
import { TemplateModal } from "./components/template-modal";

export function TemplatesPageClient() {
	const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(
		null,
	);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleUseTemplate = (template: ProjectTemplate) => {
		setSelectedTemplate(template);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedTemplate(null);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight">Project Templates</h1>
					<p className="text-muted-foreground text-sm">
						Choose from predefined project templates to quickly create new
						projects with pre-configured phases and tasks.
					</p>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{projectTemplates.map((template) => (
					<TemplateCard
						key={template.id}
						template={template}
						onUseTemplate={handleUseTemplate}
					/>
				))}
			</div>

			{selectedTemplate && (
				<TemplateModal
					template={selectedTemplate}
					open={isModalOpen}
					onClose={handleCloseModal}
				/>
			)}
		</div>
	);
}

