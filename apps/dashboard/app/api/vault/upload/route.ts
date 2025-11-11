import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema/teamchat";
import { vaultFiles, vaultFolders } from "@/lib/db/schema/vault";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const uploadsDirectory = path.join(process.cwd(), "public", "uploads");

const formSchema = z.object({
	folderId: z.string().uuid(),
	uploadedBy: z.string().uuid().optional(),
});

const withNoStore = (response: NextResponse) => {
	response.headers.set("Cache-Control", "no-store");
	return response;
};

const sanitizeBaseName = (name: string) =>
	name
		.normalize("NFKD")
		.replace(/[^\w\s.-]+/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.toLowerCase()
		.slice(0, 64) || "file";

type StoredFile = {
	originalName: string;
	storedName: string;
	size: number;
	type: string;
	url: string;
};

export async function POST(request: NextRequest) {
	const formData = await request.formData();
	const folderIdValue = formData.get("folderId");
	const uploadedByValue = formData.get("uploadedBy");
	const fileEntries = formData.getAll("files");

	const parsed = formSchema.safeParse({
		folderId: typeof folderIdValue === "string" ? folderIdValue : null,
		uploadedBy:
			typeof uploadedByValue === "string" && uploadedByValue.length > 0
				? uploadedByValue
				: undefined,
	});

	if (!parsed.success) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Nevalidni parametri forme.",
					details: parsed.error.flatten(),
				},
				{ status: 400 },
			),
		);
	}

	if (fileEntries.length === 0) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Nijedan fajl nije prosleđen.",
				},
				{ status: 400 },
			),
		);
	}

	const files = fileEntries.filter(
		(entry): entry is File => entry instanceof File,
	);

	if (files.length === 0) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Forma mora sadržati makar jedan fajl.",
				},
				{ status: 400 },
			),
		);
	}

	const db = await getDb();

	const [folder] = await db
		.select({ id: vaultFolders.id })
		.from(vaultFolders)
		.where(eq(vaultFolders.id, parsed.data.folderId))
		.limit(1);

	if (!folder) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Ciljni folder ne postoji.",
				},
				{ status: 404 },
			),
		);
	}

	let uploader = null as null | {
		id: string;
		name: string | null;
		avatarUrl: string | null;
	};

	if (parsed.data.uploadedBy) {
		const [member] = await db
			.select({
				id: users.id,
				firstName: users.firstName,
				lastName: users.lastName,
				avatarUrl: users.avatarUrl,
			})
			.from(users)
			.where(eq(users.id, parsed.data.uploadedBy))
			.limit(1);

		if (!member) {
			return withNoStore(
				NextResponse.json(
					{
						error: "Prosleđeni korisnik ne postoji.",
					},
					{ status: 404 },
				),
			);
		}

		uploader = {
			id: member.id,
			name:
				[member.firstName, member.lastName].filter(Boolean).join(" ") || null,
			avatarUrl: member.avatarUrl ?? null,
		};
	}

	await mkdir(uploadsDirectory, { recursive: true });

	const writtenFiles: string[] = [];

	try {
		const storedFiles: StoredFile[] = [];

		for (const file of files) {
			if (file.size === 0) {
				throw new Error(`Fajl ${file.name} je prazan.`);
			}

			if (file.size > MAX_FILE_SIZE_BYTES) {
				throw new Error(
					`Fajl ${file.name} prelazi maksimalnu dozvoljenu veličinu od 50MB.`,
				);
			}

			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			const parsedName = path.parse(file.name);
			const baseName = sanitizeBaseName(parsedName.name);
			const extension = parsedName.ext?.toLowerCase() ?? "";
			const uniqueName = `${baseName}-${randomUUID()}${extension}`;
			const absolutePath = path.join(uploadsDirectory, uniqueName);

			await writeFile(absolutePath, buffer);
			writtenFiles.push(absolutePath);

			storedFiles.push({
				originalName: file.name,
				storedName: uniqueName,
				size: buffer.length,
				type: file.type || "application/octet-stream",
				url: `/uploads/${uniqueName}`,
			});
		}

		const insertedFiles = await db.transaction(async (tx) => {
			const results: (typeof vaultFiles.$inferSelect)[] = [];
			const now = new Date();

			for (const stored of storedFiles) {
				const [record] = await tx
					.insert(vaultFiles)
					.values({
						name: stored.originalName,
						size: stored.size,
						type: stored.type,
						url: stored.url,
						folderId: parsed.data.folderId,
						uploadedBy: parsed.data.uploadedBy ?? null,
						createdAt: now,
						updatedAt: now,
					})
					.returning();

				results.push(record);
			}

			return results;
		});

		const responsePayload = insertedFiles.map((item) => ({
			id: item.id,
			name: item.name,
			size: item.size,
			type: item.type,
			url: item.url,
			folderId: item.folderId,
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
			owner: uploader,
		}));

		return withNoStore(
			NextResponse.json(
				{
					data: responsePayload,
				},
				{ status: 201 },
			),
		);
	} catch (error) {
		await Promise.all(
			writtenFiles.map(async (filePath) => {
				try {
					await rm(filePath, { force: true });
				} catch {
					// ignore
				}
			}),
		);

		console.error("[vault][upload] Upload failed", error);

		const message =
			error instanceof Error ? error.message : "Otpremanje fajla nije uspelo.";

		return withNoStore(
			NextResponse.json(
				{
					error: message,
				},
				{ status: 400 },
			),
		);
	}
}
