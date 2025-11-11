import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { employees, type NewEmployee } from "@/lib/db/schema/employees";
import {
  employeeIdSchema,
  employeeUpdateSchema
} from "@/lib/validations/employees";
import { eq } from "drizzle-orm";

import { serializeEmployee } from "../shared";

const withNoStore = (response: NextResponse) => {
  response.headers.set("Cache-Control", "no-store");
  return response;
};

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const parsedId = employeeIdSchema.safeParse({ id: params.id });

  if (!parsedId.success) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Invalid employee id.",
          details: parsedId.error.flatten()
        },
        { status: 400 }
      )
    );
  }

  const { id } = parsedId.data;
  const db = await getDb();

  const [employee] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);

  if (!employee) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Employee not found."
        },
        { status: 404 }
      )
    );
  }

  return withNoStore(NextResponse.json({ data: serializeEmployee(employee) }));
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const parsedId = employeeIdSchema.safeParse({ id: params.id });

  if (!parsedId.success) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Invalid employee id.",
          details: parsedId.error.flatten()
        },
        { status: 400 }
      )
    );
  }

  const payloadJson = await request.json().catch(() => null);
  const parsedPayload = employeeUpdateSchema.safeParse(payloadJson);

  if (!parsedPayload.success) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Invalid payload.",
          details: parsedPayload.error.flatten()
        },
        { status: 400 }
      )
    );
  }

  const updateInput = parsedPayload.data;

  if (Object.keys(updateInput).length === 0) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Update payload cannot be empty."
        },
        { status: 400 }
      )
    );
  }

  const { id } = parsedId.data;
  const db = await getDb();

  const updatePayload: Partial<NewEmployee> = {
    updatedAt: new Date()
  };

  if (updateInput.firstName !== undefined) {
    updatePayload.firstName = updateInput.firstName;
  }
  if (updateInput.lastName !== undefined) {
    updatePayload.lastName = updateInput.lastName;
  }
  if (updateInput.email !== undefined) {
    updatePayload.email = updateInput.email;
  }
  if (updateInput.phone !== undefined) {
    updatePayload.phone = updateInput.phone ?? null;
  }
  if (updateInput.department !== undefined) {
    updatePayload.department = updateInput.department ?? null;
  }
  if (updateInput.role !== undefined) {
    updatePayload.role = updateInput.role ?? null;
  }
  if (updateInput.employmentType !== undefined) {
    updatePayload.employmentType = updateInput.employmentType;
  }
  if (updateInput.status !== undefined) {
    updatePayload.status = updateInput.status;
  }
  if (updateInput.startDate !== undefined) {
    updatePayload.startDate = updateInput.startDate;
  }
  if (updateInput.endDate !== undefined) {
    updatePayload.endDate = updateInput.endDate ?? null;
  }
  if (updateInput.salary !== undefined) {
    updatePayload.salary = updateInput.salary ?? null;
  }

  try {
    const [updatedEmployee] = await db
      .update(employees)
      .set(updatePayload)
      .where(eq(employees.id, id))
      .returning();

    if (!updatedEmployee) {
      return withNoStore(
        NextResponse.json(
          {
            error: "Employee not found."
          },
          { status: 404 }
        )
      );
    }

    return withNoStore(NextResponse.json({ data: serializeEmployee(updatedEmployee) }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return withNoStore(
      NextResponse.json(
        {
          error: "Unable to update employee.",
          details: message
        },
        { status: 500 }
      )
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const parsedId = employeeIdSchema.safeParse({ id: params.id });

  if (!parsedId.success) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Invalid employee id.",
          details: parsedId.error.flatten()
        },
        { status: 400 }
      )
    );
  }

  const { id } = parsedId.data;
  const db = await getDb();

  const result = await db.delete(employees).where(eq(employees.id, id)).returning({ id: employees.id });

  if (result.length === 0) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Employee not found."
        },
        { status: 404 }
      )
    );
  }

  return withNoStore(new NextResponse(null, { status: 204 }));
}

