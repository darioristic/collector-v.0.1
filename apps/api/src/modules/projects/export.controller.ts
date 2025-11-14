import type { FastifyReply, FastifyRequest } from "fastify";
import { ProjectsService } from "./projects.service";
import { exportService } from "../../lib/export.service";

export const exportProjectsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
	const service = new ProjectsService(request.db, request.cache);
	const projects = await service.list();

	const csvData = projects.map((project) => ({
		"Project ID": project.id,
		Name: project.name,
		Description: project.description ?? "",
		Status: project.status,
		"Owner ID": project.owner?.id ?? "",
		"Owner Name": project.owner?.name ?? "",
		"Start Date": project.startDate ? exportService.formatDate(project.startDate) : "",
		"End Date": project.dueDate ? exportService.formatDate(project.dueDate) : "",
		"Total Tasks": project.totalTasks?.toString() ?? "0",
		"Completed Tasks": project.completedTasks?.toString() ?? "0"
	}));

	const csv = exportService.toCSV(csvData);

	reply.header("Content-Type", "text/csv; charset=utf-8");
	reply.header("Content-Disposition", `attachment; filename="projects-${new Date().toISOString().split("T")[0]}.csv"`);
	return reply.send(csv);
};

