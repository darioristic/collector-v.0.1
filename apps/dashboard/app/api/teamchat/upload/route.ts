import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCurrentAuth } from "@/lib/auth";
import { ensureTeamChatSchemaReady } from "@/lib/teamchat/repository";
import { uploadAttachmentResponseSchema } from "@/lib/validations/teamchat";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const uploadsDirectory = path.join(
	process.cwd(),
	"public",
	"uploads",
	"teamchat",
);

const withNoStore = (response: NextResponse) => {
	response.headers.set("Cache-Control", "no-store");
	return response;
};

const unauthorized = () =>
	withNoStore(
		NextResponse.json(
			{
				error: "Niste autorizovani.",
			},
			{ status: 401 },
		),
	);

const sanitizeBaseName = (name: string) =>
	name
		.normalize("NFKD")
		.replace(/[^\w\s.-]+/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.toLowerCase()
		.slice(0, 64) || "file";

export async function POST(request: NextRequest) {
	try {
		const auth = await getCurrentAuth();
		if (!auth || !auth.user || !auth.user.company) {
			return unauthorized();
		}

		await ensureTeamChatSchemaReady();

		const formData = await request.formData();
		const file = formData.get("file");

		if (!file || !(file instanceof File)) {
			return withNoStore(
				NextResponse.json(
					{
						error: "Fajl je obavezan.",
					},
					{ status: 400 },
				),
			);
		}

		if (file.size === 0) {
			return withNoStore(
				NextResponse.json(
					{
						error: "Fajl je prazan.",
					},
					{ status: 400 },
				),
			);
		}

		if (file.size > MAX_FILE_SIZE_BYTES) {
			return withNoStore(
				NextResponse.json(
					{
						error: `Fajl prelazi maksimalnu dozvoljenu veličinu od ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
					},
					{ status: 400 },
				),
			);
		}

		await mkdir(uploadsDirectory, { recursive: true });

		let writtenFile: string | null = null;

		try {
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			const parsedName = path.parse(file.name);
			const baseName = sanitizeBaseName(parsedName.name);
			const extension = parsedName.ext?.toLowerCase() ?? "";
			const uniqueName = `${baseName}-${randomUUID()}${extension}`;
			const absolutePath = path.join(uploadsDirectory, uniqueName);

			await writeFile(absolutePath, buffer);
			writtenFile = absolutePath;

			const url = `/uploads/teamchat/${uniqueName}`;
			const validated = uploadAttachmentResponseSchema.parse({
				url,
				name: file.name,
				size: buffer.length,
			});

			return withNoStore(NextResponse.json(validated));
		} catch (error) {
			if (writtenFile) {
				try {
					await rm(writtenFile, { force: true });
				} catch {
					// ignore
				}
			}

			console.error("[teamchat][upload] Upload failed", error);

			const message =
				error instanceof Error
					? error.message
					: "Otpremanje fajla nije uspelo.";

			return withNoStore(
				NextResponse.json(
					{
						error: message,
					},
					{ status: 400 },
				),
			);
		}
	} catch (error) {
		console.error("[teamchat] POST upload route error:", error);
		const message =
			error instanceof Error ? error.message : "Otpremanje fajla nije uspelo.";
		return withNoStore(
			NextResponse.json(
				{
					error: message,
				},
				{ status: 500 },
			),
		);
	}
}
