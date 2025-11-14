import type { FastifyReply, FastifyRequest } from "fastify";
import { mockEmployees } from "./hr.schema";
import { exportService } from "../../lib/export.service";
import type { Employee } from "./hr.schema";

export const exportEmployeesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		// Use mockEmployees directly since listEmployees is a RouteHandler that uses in-memory data
		const employees: Employee[] = mockEmployees;

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
	} catch (error) {
		request.log.error({ err: error }, "Failed to export employees");
		return reply.status(500).send({ error: "Failed to export employees" });
	}
};

