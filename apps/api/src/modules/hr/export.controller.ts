import type { FastifyReply, FastifyRequest } from "fastify";
import { listEmployees } from "./employees.controller";
import { exportService } from "../../lib/export.service";

export const exportEmployeesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
	const result = await listEmployees(request, reply);
	const employees = (result as { data: Array<{ id: string; name: string; email: string; position: string; department: string; hireDate: string; active: boolean }> }).data;

	const csvData = employees.map((employee) => ({
		"Employee ID": employee.id,
		Name: employee.name,
		Email: employee.email,
		Position: employee.position,
		Department: employee.department,
		"Hire Date": exportService.formatDate(employee.hireDate),
		Active: employee.active ? "Yes" : "No"
	}));

	const csv = exportService.toCSV(csvData);

	reply.header("Content-Type", "text/csv; charset=utf-8");
	reply.header("Content-Disposition", `attachment; filename="employees-${new Date().toISOString().split("T")[0]}.csv"`);
	return reply.send(csv);
};

