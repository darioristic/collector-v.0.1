import { randomUUID } from "node:crypto";

import type { RouteHandler } from "fastify";

import type { Employee } from "./hr.schema";
import { mockEmployees } from "./hr.schema";

const employees: Employee[] = [...mockEmployees];

export type ListEmployeesReply = { data: Employee[] };
export type CreateEmployeeBody = {
  name: string;
  email: string;
  position: string;
  department: string;
  hireDate: string;
  active?: boolean;
};
export type CreateEmployeeReply = { data: Employee };

export const listEmployees: RouteHandler<{ Reply: ListEmployeesReply }> = async () => {
  // TODO: Integrate employee list with Settings and Accounts once services are available.
  return { data: employees };
};

export const createEmployee: RouteHandler<{ Body: CreateEmployeeBody; Reply: CreateEmployeeReply }> =
  async (request, reply) => {
    // TODO: Replace in-memory storage with persistence from Settings/Accounts modules.
    const newEmployee: Employee = {
      id: `emp_${randomUUID()}`,
      name: request.body.name,
      email: request.body.email,
      position: request.body.position,
      department: request.body.department,
      hireDate: request.body.hireDate,
      active: request.body.active ?? true
    };

    employees.push(newEmployee);

    return reply.code(201).send({ data: newEmployee });
  };


