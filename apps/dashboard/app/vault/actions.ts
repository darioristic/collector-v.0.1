"use server";

import { revalidatePath } from "next/cache";

import type {
  VaultBreadcrumb,
  VaultDirectoryOption,
  VaultFileItem,
  VaultFolderItem,
  VaultListingResponse
} from "./types";

const VAULT_PATH = "/vault";
const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json"
} as const;

type ErrorPayload = {
  error?: string;
  details?: unknown;
};

const revalidateVault = () => revalidatePath(VAULT_PATH);

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = "Došlo je do greške.";
    try {
      const payload = (await response.json()) as ErrorPayload;
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export async function getVaultContentsAction(params?: {
  folderId?: string | null;
  search?: string | null;
}): Promise<VaultListingResponse> {
  const searchParams = new URLSearchParams();

  if (params?.folderId) {
    searchParams.set("folderId", params.folderId);
  }

  if (params?.search) {
    searchParams.set("search", params.search);
  }

  const queryString = searchParams.toString();

  const response = await fetch(`/api/vault${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
    headers: JSON_HEADERS,
    cache: "no-store"
  });

  return handleResponse<VaultListingResponse>(response);
}

export async function createVaultFolderAction(input: {
  name: string;
  parentId?: string | null;
  createdBy?: string | null;
}): Promise<VaultFolderItem> {
  const payload = {
    name: input.name,
    parentId: input.parentId ?? null,
    createdBy: input.createdBy ?? null
  };

  const response = await fetch("/api/vault/folders", {
    method: "POST",
    headers: JSON_HEADERS,
    cache: "no-store",
    body: JSON.stringify(payload)
  });

  const result = await handleResponse<{ data: VaultFolderItem }>(response);
  revalidateVault();
  return result.data;
}

export async function uploadVaultFilesAction(formData: FormData): Promise<VaultFileItem[]> {
  const response = await fetch("/api/vault/upload", {
    method: "POST",
    cache: "no-store",
    body: formData
  });

  const result = await handleResponse<{ data: VaultFileItem[] }>(response);
  revalidateVault();
  return result.data;
}

export async function renameVaultItemAction(input: { id: string; name: string }): Promise<
  | (VaultFolderItem & { type: "folder" })
  | (VaultFileItem & { type: "file" })
> {
  const response = await fetch(`/api/vault/${input.id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    cache: "no-store",
    body: JSON.stringify({ name: input.name })
  });

  const result = await handleResponse<{ data: (VaultFolderItem & { type: "folder" }) | (VaultFileItem & { type: "file" }) }>(
    response
  );

  revalidateVault();
  return result.data;
}

export async function deleteVaultItemAction(id: string): Promise<{
  deletedFolders: string[];
  deletedFiles: string[];
}> {
  const response = await fetch(`/api/vault/${id}`, {
    method: "DELETE",
    headers: JSON_HEADERS,
    cache: "no-store"
  });

  const result = await handleResponse<{ data: { deletedFolders?: string[]; deletedFiles?: string[] } }>(response);
  revalidateVault();
  return {
    deletedFolders: result.data.deletedFolders ?? [],
    deletedFiles: result.data.deletedFiles ?? []
  };
}


