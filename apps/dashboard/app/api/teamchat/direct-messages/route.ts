import { NextResponse } from "next/server";

import { getCurrentAuth } from "@/lib/auth";
import { listDirectMessageTargets } from "@/lib/teamchat/repository";

const withNoStore = (response: NextResponse) => {
	response.headers.set("Cache-Control", "no-store");
	return response;
};

export async function GET() {
	const auth = await getCurrentAuth();
	if (!auth || !auth.user || !auth.user.company) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Niste autorizovani.",
				},
				{ status: 401 },
			),
		);
	}

	const members = await listDirectMessageTargets({
		companyId: auth.user.company.id,
		userId: auth.user.id,
	});

	return withNoStore(
		NextResponse.json({
			members,
		}),
	);
}
