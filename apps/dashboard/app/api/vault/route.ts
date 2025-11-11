import { NextRequest, NextResponse } from "next/server";

import { eq, ilike, isNull, and, asc } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { vaultFiles, vaultFolders } from "@/lib/db/schema/vault";
import { teamMembers } from "@/lib/db/schema/team-members";

const querySchema = z.object({
  folderId: z.string().uuid().optional(),
  search: z
    .string()
    .max(255)
    .optional()
});

const withNoStore = (response: NextResponse) => {
  response.headers.set("Cache-Control", "no-store");
  return response;
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
          details: parsed.error.flatten()
        },
        { status: 400 }
      )
    );
  }

  const folderId = parsed.data.folderId ?? null;
  const trimmedSearch = parsed.data.search?.trim();
  const searchTerm = trimmedSearch ? `%${trimmedSearch}%` : null;

  const allFolders = await db
    .select({
      id: vaultFolders.id,
      name: vaultFolders.name,
      parentId: vaultFolders.parentId
    })
    .from(vaultFolders);

  const folderMap = new Map(allFolders.map((folder) => [folder.id, folder]));

  if (folderId && !folderMap.has(folderId)) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Folder nije pronađen."
        },
        { status: 404 }
      )
    );
  }

  const breadcrumbTrail = [];
  if (folderId) {
    let current = folderMap.get(folderId) ?? null;

    while (current) {
      breadcrumbTrail.push({ id: current.id, name: current.name });
      current = current.parentId ? folderMap.get(current.parentId) ?? null : null;
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
      ownerFirstName: teamMembers.firstName,
      ownerLastName: teamMembers.lastName,
      ownerAvatar: teamMembers.avatarUrl
    })
    .from(vaultFolders)
    .leftJoin(teamMembers, eq(vaultFolders.createdBy, teamMembers.id))
    .where(folderConditions.length === 1 ? folderConditions[0] : and(...folderConditions))
    .orderBy(asc(vaultFolders.name));

  const folders = folderRows.map((folder) => ({
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
    owner:
      folder.createdBy && (folder.ownerFirstName || folder.ownerLastName)
        ? {
            id: folder.createdBy,
            name: [folder.ownerFirstName, folder.ownerLastName].filter(Boolean).join(" ") || null,
            avatarUrl: folder.ownerAvatar ?? null
          }
        : null
  }));

  let files = [];
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
        uploaderFirstName: teamMembers.firstName,
        uploaderLastName: teamMembers.lastName,
        uploaderAvatar: teamMembers.avatarUrl
      })
      .from(vaultFiles)
      .leftJoin(teamMembers, eq(vaultFiles.uploadedBy, teamMembers.id))
      .where(fileConditions.length === 1 ? fileConditions[0] : and(...fileConditions))
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
              name: [file.uploaderFirstName, file.uploaderLastName].filter(Boolean).join(" ") || null,
              avatarUrl: file.uploaderAvatar ?? null
            }
          : null
    }));
  }

  const availableFolders = [
    { id: null, name: "Vault", parentId: null },
    ...allFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId
    }))
  ];

  return withNoStore(
    NextResponse.json({
      breadcrumbs: breadcrumbTrail,
      currentFolder:
        folderId && folderMap.has(folderId)
          ? {
              id: folderId,
              name: folderMap.get(folderId)!.name
            }
          : null,
      folders,
      files,
      availableFolders,
      search: trimmedSearch ?? null
    })
  );
}


