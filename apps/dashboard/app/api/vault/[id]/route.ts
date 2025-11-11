import path from "node:path";
import { rm } from "node:fs/promises";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { and, eq, ilike, inArray, isNull, ne } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema/teamchat";
import { vaultFiles, vaultFolders } from "@/lib/db/schema/vault";

const renameSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "Naziv je obavezan.")
			.max(255, "Naziv ne sme biti duži od 255 karaktera."),
	})
	.transform((data) => ({
		name: data.name.trim(),
	}));

const withNoStore = (response: NextResponse) => {
	response.headers.set("Cache-Control", "no-store");
	return response;
};

const buildUploadsPath = (url: string) => {
	const relative = url.startsWith("/") ? url.slice(1) : url;
	return path.join(process.cwd(), "public", relative);
};

type VaultRouteContext = {
	params: Promise<{
		id: string;
	}>;
};

const extractParams = async ({ params }: VaultRouteContext) => {
	return await params;
};

export async function PUT(request: NextRequest, context: VaultRouteContext) {
	const db = await getDb();
	const json = await request.json().catch(() => null);

	if (!json || typeof json !== "object") {
		return withNoStore(
			NextResponse.json(
				{
					error: "Nevalidan payload.",
				},
				{ status: 400 },
			),
		);
	}

	const parsedRename = renameSchema.safeParse(json);

	if (!parsedRename.success) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Nevalidni podaci.",
					details: parsedRename.error.flatten(),
				},
				{ status: 400 },
			),
		);
	}

	const { id: resourceId } = await extractParams(context);

	const folder = await db
		.select({
			id: vaultFolders.id,
			name: vaultFolders.name,
			parentId: vaultFolders.parentId,
			createdBy: vaultFolders.createdBy,
			createdAt: vaultFolders.createdAt,
			updatedAt: vaultFolders.updatedAt,
		})
		.from(vaultFolders)
		.where(eq(vaultFolders.id, resourceId))
		.limit(1)
		.then((rows) => rows[0] ?? null);

	const file = !folder
		? await db
				.select({
					id: vaultFiles.id,
					name: vaultFiles.name,
					size: vaultFiles.size,
					type: vaultFiles.type,
					url: vaultFiles.url,
					folderId: vaultFiles.folderId,
					uploadedBy: vaultFiles.uploadedBy,
					createdAt: vaultFiles.createdAt,
					updatedAt: vaultFiles.updatedAt,
				})
				.from(vaultFiles)
				.where(eq(vaultFiles.id, resourceId))
				.limit(1)
				.then((rows) => rows[0] ?? null)
		: null;

	if (!folder && !file) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Resurs nije pronađen.",
				},
				{ status: 404 },
			),
		);
	}

	const normalizedName = parsedRename.data.name;
	const now = new Date();

	if (folder) {
		const nameConditions = [];
		if (folder.parentId) {
			nameConditions.push(eq(vaultFolders.parentId, folder.parentId));
		} else {
			nameConditions.push(isNull(vaultFolders.parentId));
		}
		nameConditions.push(ilike(vaultFolders.name, normalizedName));
		nameConditions.push(ne(vaultFolders.id, folder.id));

		const conflict = await db
			.select({ id: vaultFolders.id })
			.from(vaultFolders)
			.where(and(...nameConditions))
			.limit(1);

		if (conflict.length > 0) {
			return withNoStore(
				NextResponse.json(
					{
						error: "Folder sa istim nazivom već postoji.",
					},
					{ status: 409 },
				),
			);
		}

		const [updatedFolder] = await db
			.update(vaultFolders)
			.set({
				name: normalizedName,
				updatedAt: now,
			})
			.where(eq(vaultFolders.id, folder.id))
			.returning();

		let owner = null;

		if (updatedFolder.createdBy) {
			const [ownerRow] = await db
				.select({
					id: users.id,
					firstName: users.firstName,
					lastName: users.lastName,
					avatarUrl: users.avatarUrl,
				})
				.from(users)
				.where(eq(users.id, updatedFolder.createdBy))
				.limit(1);

			if (ownerRow) {
				owner = {
					id: ownerRow.id,
					name:
						[ownerRow.firstName, ownerRow.lastName].filter(Boolean).join(" ") ||
						null,
					avatarUrl: ownerRow.avatarUrl ?? null,
				};
			}
		}

		return withNoStore(
			NextResponse.json({
				data: {
					id: updatedFolder.id,
					type: "folder",
					name: updatedFolder.name,
					parentId: updatedFolder.parentId,
					createdAt: updatedFolder.createdAt.toISOString(),
					updatedAt: updatedFolder.updatedAt.toISOString(),
					owner,
				},
			}),
		);
	}

	if (file) {
		const [updatedFile] = await db
			.update(vaultFiles)
			.set({
				name: normalizedName,
				updatedAt: now,
			})
			.where(eq(vaultFiles.id, file.id))
			.returning();

		let owner = null;
		if (updatedFile.uploadedBy) {
			const [ownerRow] = await db
				.select({
					id: users.id,
					firstName: users.firstName,
					lastName: users.lastName,
					avatarUrl: users.avatarUrl,
				})
				.from(users)
				.where(eq(users.id, updatedFile.uploadedBy))
				.limit(1);

			if (ownerRow) {
				owner = {
					id: ownerRow.id,
					name:
						[ownerRow.firstName, ownerRow.lastName].filter(Boolean).join(" ") ||
						null,
					avatarUrl: ownerRow.avatarUrl ?? null,
				};
			}
		}

		return withNoStore(
			NextResponse.json({
				data: {
					id: updatedFile.id,
					type: "file",
					name: updatedFile.name,
					folderId: updatedFile.folderId,
					size: updatedFile.size,
					url: updatedFile.url,
					createdAt: updatedFile.createdAt.toISOString(),
					updatedAt: updatedFile.updatedAt.toISOString(),
					owner,
				},
			}),
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	context: VaultRouteContext,
) {
	const db = await getDb();
	const { id: resourceId } = await extractParams(context);

	const folder = await db
		.select({
			id: vaultFolders.id,
		})
		.from(vaultFolders)
		.where(eq(vaultFolders.id, resourceId))
		.limit(1)
		.then((rows) => rows[0] ?? null);

	if (folder) {
		const allFolders = await db
			.select({
				id: vaultFolders.id,
				parentId: vaultFolders.parentId,
			})
			.from(vaultFolders);

		const childrenMap = new Map<string | null, string[]>();
		for (const item of allFolders) {
			const siblings = childrenMap.get(item.parentId ?? null) ?? [];
			siblings.push(item.id);
			childrenMap.set(item.parentId ?? null, siblings);
		}

		const stack = [folder.id];
		const foldersToDelete = new Set<string>();

		while (stack.length > 0) {
			const current = stack.pop();
			if (!current || foldersToDelete.has(current)) {
				continue;
			}
			foldersToDelete.add(current);
			const children = childrenMap.get(current) ?? [];
			for (const child of children) {
				stack.push(child);
			}
		}

		const foldersToDeleteArray = Array.from(foldersToDelete);

		const fileRecords =
			foldersToDeleteArray.length > 0
				? await db
						.select({
							id: vaultFiles.id,
							url: vaultFiles.url,
						})
						.from(vaultFiles)
						.where(inArray(vaultFiles.folderId, foldersToDeleteArray))
				: [];

		await db.transaction(async (tx) => {
			await tx
				.delete(vaultFolders)
				.where(inArray(vaultFolders.id, foldersToDeleteArray));
		});

		await Promise.all(
			fileRecords.map(async (file) => {
				if (!file.url) {
					return;
				}
				const filePath = buildUploadsPath(file.url);
				try {
					await rm(filePath, { force: true });
				} catch {
					// Best effort
				}
			}),
		);

		return withNoStore(
			NextResponse.json({
				data: {
					deletedFolders: foldersToDeleteArray,
					deletedFiles: fileRecords.map((file) => file.id),
				},
			}),
		);
	}

	const [fileRecord] = await db
		.select({
			id: vaultFiles.id,
			url: vaultFiles.url,
		})
		.from(vaultFiles)
		.where(eq(vaultFiles.id, resourceId))
		.limit(1);

	if (!fileRecord) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Resurs nije pronađen.",
				},
				{ status: 404 },
			),
		);
	}

	await db.delete(vaultFiles).where(eq(vaultFiles.id, fileRecord.id));

	if (fileRecord.url) {
		const filePath = buildUploadsPath(fileRecord.url);
		try {
			await rm(filePath, { force: true });
		} catch {
			// ignore
		}
	}

	return withNoStore(
		NextResponse.json({
			data: {
				deletedFiles: [fileRecord.id],
			},
		}),
	);
}
