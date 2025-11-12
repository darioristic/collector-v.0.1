export type VaultOwner = {
	id: string;
	name: string | null;
	avatarUrl: string | null;
} | null;

export type VaultFolderItem = {
	id: string;
	name: string;
	parentId: string | null;
	createdAt: string;
	updatedAt: string;
	owner: VaultOwner;
};

export type VaultFileItem = {
	id: string;
	name: string;
	size: number;
	type: string;
	url: string;
	folderId: string;
	createdAt: string;
	updatedAt: string;
	owner: VaultOwner;
};

export type VaultBreadcrumb = {
	id: string | null;
	name: string;
};

export type VaultDirectoryOption = {
	id: string | null;
	name: string;
	parentId: string | null;
};

export type VaultListingResponse = {
	breadcrumbs: VaultBreadcrumb[];
	currentFolder: { id: string; name: string } | null;
	folders: VaultFolderItem[];
	files: VaultFileItem[];
	availableFolders: VaultDirectoryOption[];
	search: string | null;
};
