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
		"Owner ID": project.ownerId ?? "",
		"Owner Name": project.ownerName ?? "",
		"Start Date": exportService.formatDate(project.startDate),
		"End Date": exportService.formatDate(project.endDate),
		"Total Tasks": project.totalTasks?.toString() ?? "0",
		"Completed Tasks": project.completedTasks?.toString() ?? "0",
		"Created At": exportService.formatDate(project.createdAt),
		"Updated At": exportService.formatDate(project.updatedAt)
	}));

	const csv = exportService.toCSV(csvData);

	reply.header("Content-Type", "text/csv; charset=utf-8");
	reply.header("Content-Disposition", `attachment; filename="projects-${new Date().toISOString().split("T")[0]}.csv"`);
	return reply.send(csv);
};

