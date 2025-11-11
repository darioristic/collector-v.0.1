import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

import { getCurrentAuth } from "@/lib/auth";

const withNoStore = (response: NextResponse) => {
	response.headers.set("Cache-Control", "no-store");
	return response;
};

const uploadDir = path.join(process.cwd(), "public", "uploads", "teamchat");

export async function POST(request: Request) {
	const auth = await getCurrentAuth();
	if (!auth || !auth.user) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Niste autorizovani.",
				},
				{ status: 401 },
			),
		);
	}

	const formData = await request.formData();
	const file = formData.get("file");

	if (!file || !(file instanceof File)) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Fajl nije prosleđen.",
				},
				{ status: 400 },
			),
		);
	}

	if (file.size > 15 * 1024 * 1024) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Fajl je prevelik. Maksimalna veličina je 15 MB.",
				},
				{ status: 413 },
			),
		);
	}

	await mkdir(uploadDir, { recursive: true });

	const extension = path.extname(file.name);
	const safeName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
	const filePath = path.join(uploadDir, safeName);

	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(filePath, buffer);

	return withNoStore(
		NextResponse.json({
			url: `/uploads/teamchat/${safeName}`,
			name: file.name,
			size: file.size,
		}),
	);
}
