import type { FastifySchema } from "fastify";

const dataEnvelope = (itemsSchema: object) => ({
  type: "object",
  properties: {
    data: itemsSchema
  },
  required: ["data"],
  additionalProperties: false
}) as const;

const employeeProperties = {
  id: { type: "string", minLength: 1 },
  name: { type: "string", minLength: 1 },
  email: { type: "string", format: "email" },
  position: { type: "string", minLength: 1 },
  department: { type: "string", minLength: 1 },
  hireDate: { type: "string", format: "date" },
  active: { type: "boolean" }
} as const;

const roleProperties = {
  id: { type: "string", minLength: 1 },
  name: { type: "string", minLength: 1 },
  permissions: {
    type: "array",
    items: { type: "string", minLength: 1 }
  }
} as const;

const attendanceProperties = {
  id: { type: "string", minLength: 1 },
  employeeId: { type: "string", minLength: 1 },
  date: { type: "string", format: "date" },
  status: {
    type: "string",
    enum: ["present", "absent", "remote", "leave"]
  }
} as const;

const employeeCreateBody = {
  type: "object",
  properties: {
    name: employeeProperties.name,
    email: employeeProperties.email,
    position: employeeProperties.position,
    department: employeeProperties.department,
    hireDate: employeeProperties.hireDate,
    active: employeeProperties.active
  },
  required: ["name", "email", "position", "department", "hireDate"],
  additionalProperties: false
} as const;

export const employeeListSchema: FastifySchema = {
  tags: ["hr-employees"],
  summary: "List employees",
  description: "Vraća listu svih zaposlenih sa osnovnim informacijama uključujući poziciju, odeljenje i status aktivnosti.",
  response: {
    200: {
      ...dataEnvelope({
        type: "array",
        items: {
          type: "object",
          properties: employeeProperties,
          required: ["id", "name", "email", "position", "department", "hireDate", "active"],
          additionalProperties: false
        }
      }),
      description: "Lista zaposlenih"
    }
  }
};

export const employeeCreateSchema: FastifySchema = {
  tags: ["hr-employees"],
  summary: "Create a new employee",
  description: "Kreira novog zaposlenog u HR sistemu. Email mora biti validan i jedinstven.",
  body: employeeCreateBody,
  response: {
    201: {
      ...dataEnvelope({
        type: "object",
        properties: employeeProperties,
        required: ["id", "name", "email", "position", "department", "hireDate", "active"],
        additionalProperties: false
      }),
      description: "Kreiran zaposleni"
    },
    400: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Nevalidni podaci"
    }
  }
};

export const roleListSchema: FastifySchema = {
  tags: ["hr-roles"],
  summary: "List HR roles",
  description: "Vraća listu svih HR uloga sa definisanim dozvolama.",
  response: {
    200: {
      ...dataEnvelope({
        type: "array",
        items: {
          type: "object",
          properties: roleProperties,
          required: ["id", "name", "permissions"],
          additionalProperties: false
        }
      }),
      description: "Lista HR uloga"
    }
  }
};

export const attendanceListSchema: FastifySchema = {
  tags: ["hr-attendance"],
  summary: "List attendance records",
  description: "Vraća listu evidencije prisutnosti zaposlenih sa statusom za svaki dan.",
  response: {
    200: {
      ...dataEnvelope({
        type: "array",
        items: {
          type: "object",
          properties: attendanceProperties,
          required: ["id", "employeeId", "date", "status"],
          additionalProperties: false
        }
      }),
      description: "Lista evidencije prisutnosti"
    }
  }
};
export type Employee = {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  hireDate: string;
  active: boolean;
};

export type Role = {
  id: string;
  name: string;
  permissions: string[];
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  status: "present" | "absent" | "remote" | "leave";
};

export const mockEmployees: Employee[] = [
  {
    id: "emp_1",
    name: "Ana Marković",
    email: "ana.markovic@example.com",
    position: "HR Manager",
    department: "Human Resources",
    hireDate: "2020-03-15",
    active: true
  },
  {
    id: "emp_2",
    name: "Miloš Petrović",
    email: "milos.petrovic@example.com",
    position: "Software Engineer",
    department: "Engineering",
    hireDate: "2021-07-01",
    active: true
  },
  {
    id: "emp_3",
    name: "Jelena Ilić",
    email: "jelena.ilic@example.com",
    position: "Product Designer",
    department: "Design",
    hireDate: "2019-11-20",
    active: false
  }
];

export const mockRoles: Role[] = [
  {
    id: "role_hr_admin",
    name: "HR Administrator",
    permissions: ["hr:employees:read", "hr:employees:write", "hr:attendance:read"]
  },
  {
    id: "role_manager",
    name: "Team Manager",
    permissions: ["hr:employees:read", "hr:attendance:read"]
  },
  {
    id: "role_employee",
    name: "Employee",
    permissions: ["hr:attendance:read"]
  }
];

export const mockAttendance: AttendanceRecord[] = [
  {
    id: "att_1",
    employeeId: "emp_1",
    date: "2025-11-01",
    status: "present"
  },
  {
    id: "att_2",
    employeeId: "emp_2",
    date: "2025-11-01",
    status: "remote"
  },
  {
    id: "att_3",
    employeeId: "emp_3",
    date: "2025-11-01",
    status: "absent"
  }
];



