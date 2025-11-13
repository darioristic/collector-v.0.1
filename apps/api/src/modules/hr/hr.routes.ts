import type { FastifyPluginAsync } from "fastify";

import {
  attendanceListSchema,
  employeeCreateSchema,
  employeeListSchema,
  roleListSchema
} from "./hr.schema";
import { listAttendance } from "./attendance.controller";
import { createEmployee, listEmployees } from "./employees.controller";
import { listRoles } from "./roles.controller";
import { exportEmployeesHandler } from "./export.controller";

const hrRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/employees", { schema: employeeListSchema }, listEmployees);
  fastify.get("/employees/export", exportEmployeesHandler);
  fastify.post("/employees", { schema: employeeCreateSchema }, createEmployee);
  fastify.get("/roles", { schema: roleListSchema }, listRoles);
  fastify.get("/attendance", { schema: attendanceListSchema }, listAttendance);
};

export default hrRoutes;


