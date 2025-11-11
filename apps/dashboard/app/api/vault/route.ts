import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { eq, ilike, isNull, and, asc } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { vaultFiles, vaultFolders } from "@/lib/db/schema/vault";
import { users } from "@/lib/db/schema/teamchat";

const querySchema = z.object({
	folderId: z.string().uuid().optional(),
	search: z.string().max(255).optional(),
});

const withNoStore = (response: NextResponse) => {
	response.headers.set("Cache-Control", "no-store");
	return response;
};

type FolderResponse = {
	id: string;
	name: string;
	parentId: string | null;
	createdAt: string;
	updatedAt: string;
	owner: { id: string; name: string | null; avatarUrl: string | null } | null;
};

type FileResponse = {
	id: string;
	name: string;
	size: number;
	type: string;
	url: string;
	folderId: string;
	createdAt: string;
	updatedAt: string;
	owner: { id: string; name: string | null; avatarUrl: string | null } | null;
};

export async function GET(request: NextRequest) {
	const db = await getDb();
	const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
	const parsed = querySchema.safeParse(rawParams);

	if (!parsed.success) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Neispravni query parametri.",
					details: parsed.error.flatten(),
				},
				{ status: 400 },
			),
		);
	}

	const folderId = parsed.data.folderId ?? null;
	const trimmedSearch = parsed.data.search?.trim();
	const searchTerm = trimmedSearch ? `%${trimmedSearch}%` : null;

	const allFolders = await db
		.select({
			id: vaultFolders.id,
			name: vaultFolders.name,
			parentId: vaultFolders.parentId,
		})
		.from(vaultFolders);

	const folderMap = new Map(allFolders.map((folder) => [folder.id, folder]));

	if (folderId && !folderMap.has(folderId)) {
		return withNoStore(
			NextResponse.json(
				{
					error: "Folder nije pronađen.",
				},
				{ status: 404 },
			),
		);
	}

	const breadcrumbTrail = [];
	if (folderId) {
		let current = folderMap.get(folderId) ?? null;

		while (current) {
			breadcrumbTrail.push({ id: current.id, name: current.name });
			current = current.parentId
				? (folderMap.get(current.parentId) ?? null)
				: null;
		}
	}

	breadcrumbTrail.push({ id: null, name: "Vault" });
	breadcrumbTrail.reverse();

	const folderConditions = [];

	if (folderId) {
		folderConditions.push(eq(vaultFolders.parentId, folderId));
	} else {
		folderConditions.push(isNull(vaultFolders.parentId));
	}

	if (searchTerm) {
		folderConditions.push(ilike(vaultFolders.name, searchTerm));
	}

	const folderRows = await db
		.select({
			id: vaultFolders.id,
			name: vaultFolders.name,
			parentId: vaultFolders.parentId,
			createdAt: vaultFolders.createdAt,
			updatedAt: vaultFolders.updatedAt,
			createdBy: vaultFolders.createdBy,
			ownerFirstName: users.firstName,
			ownerLastName: users.lastName,
			ownerAvatar: users.avatarUrl,
		})
		.from(vaultFolders)
		.leftJoin(users, eq(vaultFolders.createdBy, users.id))
		.where(
			folderConditions.length === 1
				? folderConditions[0]
				: and(...folderConditions),
		)
		.orderBy(asc(vaultFolders.name));

	const folders: FolderResponse[] = folderRows.map((folder) => ({
		id: folder.id,
		name: folder.name,
		parentId: folder.parentId,
		createdAt: folder.createdAt.toISOString(),
		updatedAt: folder.updatedAt.toISOString(),
		owner:
			folder.createdBy && (folder.ownerFirstName || folder.ownerLastName)
				? {
						id: folder.createdBy,
						name:
							[folder.ownerFirstName, folder.ownerLastName]
								.filter(Boolean)
								.join(" ") || null,
						avatarUrl: folder.ownerAvatar ?? null,
					}
				: null,
	}));

	let files: FileResponse[] = [];
	if (folderId) {
		const fileConditions = [eq(vaultFiles.folderId, folderId)];

		if (searchTerm) {
			fileConditions.push(ilike(vaultFiles.name, searchTerm));
		}

		const fileRows = await db
			.select({
				id: vaultFiles.id,
				name: vaultFiles.name,
				size: vaultFiles.size,
				type: vaultFiles.type,
				url: vaultFiles.url,
				folderId: vaultFiles.folderId,
				createdAt: vaultFiles.createdAt,
				updatedAt: vaultFiles.updatedAt,
				uploadedBy: vaultFiles.uploadedBy,
				uploaderFirstName: users.firstName,
				uploaderLastName: users.lastName,
				uploaderAvatar: users.avatarUrl,
			})
			.from(vaultFiles)
			.leftJoin(users, eq(vaultFiles.uploadedBy, users.id))
			.where(
				fileConditions.length === 1
					? fileConditions[0]
					: and(...fileConditions),
			)
			.orderBy(asc(vaultFiles.name));

		files = fileRows.map((file) => ({
			id: file.id,
			name: file.name,
			size: file.size,
			type: file.type,
			url: file.url,
			folderId: file.folderId,
			createdAt: file.createdAt.toISOString(),
			updatedAt: file.updatedAt.toISOString(),
			owner:
				file.uploadedBy && (file.uploaderFirstName || file.uploaderLastName)
					? {
							id: file.uploadedBy,
							name:
								[file.uploaderFirstName, file.uploaderLastName]
									.filter(Boolean)
									.join(" ") || null,
							avatarUrl: file.uploaderAvatar ?? null,
						}
					: null,
		}));
	}

	const currentFolderData = folderId ? (folderMap.get(folderId) ?? null) : null;

	const availableFolders = [
		{ id: null, name: "Vault", parentId: null },
		...allFolders.map((folder) => ({
			id: folder.id,
			name: folder.name,
			parentId: folder.parentId,
		})),
	];

	return withNoStore(
		NextResponse.json({
			breadcrumbs: breadcrumbTrail,
			currentFolder: currentFolderData
				? {
						id: folderId,
						name: currentFolderData.name,
					}
				: null,
			folders,
			files,
			availableFolders,
			search: trimmedSearch ?? null,
		}),
	);
}
