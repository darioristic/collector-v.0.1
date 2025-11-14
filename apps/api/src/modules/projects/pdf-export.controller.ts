import type { FastifyReply, FastifyRequest } from "fastify";
import { ProjectsService } from "./projects.service";
import { pdfService, type ProjectReportPDFData } from "../../lib/pdf.service";

type ExportProjectReportPDFParams = FastifyRequest<{
	Params: { id: string };
}>;

export const exportProjectReportPDFHandler = async (
	request: ExportProjectReportPDFParams,
	reply: FastifyReply
) => {
	const service = new ProjectsService(request.db, request.cache);
	const project = await service.getProjectDetails(request.params.id);

	if (!project) {
		return reply.status(404).send({ error: "Project not found" });
	}

	// Transform project data to PDF format
	const pdfData: ProjectReportPDFData = {
		projectName: project.name,
		description: project.description ?? undefined,
		status: project.status,
		ownerName: project.owner?.name ?? undefined,
		startDate: project.startDate ?? undefined,
		endDate: project.dueDate ?? undefined,
		totalTasks: project.totalTasks ?? 0,
		completedTasks: project.completedTasks ?? 0,
		budget: project.budget
			? {
					total: Number(project.budget.total ?? 0),
					spent: Number(project.budget.spent ?? 0),
					remaining: Number(project.budget.remaining ?? 0),
					currency: project.budget.currency ?? "EUR"
				}
			: undefined,
		tasks: project.tasks?.map((task) => ({
			title: task.title,
			status: task.status,
			assignee: task.assignee?.name ?? undefined,
			dueDate: task.dueDate ?? undefined
		}))
	};

	try {
		const pdfStream = await pdfService.generateProjectReportPDF(pdfData, {
			title: `Project Report: ${project.name}`
		});

		reply.header("Content-Type", "application/pdf");
		reply.header(
			"Content-Disposition",
			`attachment; filename="project-report-${project.name.replace(/\s+/g, "-")}.pdf"`
		);

		return reply.send(pdfStream);
	} catch (error) {
		if ((error as Error).message.includes("PDFKit is not installed")) {
			return reply.status(503).send({
				error: "PDF export is not available",
				message: "Please install pdfkit: bun add pdfkit @types/pdfkit"
			});
		}
		throw error;
	}
};

