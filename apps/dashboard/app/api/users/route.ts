import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema/core";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
	try {
		const db = await getDb();

		const allUsers = await db.select().from(users);

		return NextResponse.json(
			{
				data: allUsers.map((user) => ({
					id: user.id,
					email: user.email,
					name: user.name,
					defaultCompanyId: user.defaultCompanyId,
					createdAt: user.createdAt.toISOString(),
					updatedAt: user.updatedAt.toISOString(),
				})),
			},
			{
				headers: {
					"Cache-Control": "no-store",
				},
			},
		);
	} catch (error) {
		console.error("[api/users] Error fetching users:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch users",
				details:
					error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

