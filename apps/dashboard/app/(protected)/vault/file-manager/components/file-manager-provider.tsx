"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import {
	fetchTeamMembers,
	type TeamMember,
} from "@/app/(protected)/settings/teams/api";

type FileSystemOwner = {
	id: string | null;
	name: string;
	email: string | null;
	avatarUrl: string | null;
};

type FileSystemNodeBase = {
	id: string;
	name: string;
	ownerIndex: number | null;
	owner: FileSystemOwner;
	ownerFallback: FileSystemOwner;
	year: string;
	uploaded: string;
};

export type FileNode = FileSystemNodeBase & {
	type: "file";
	size: string;
};

export type FolderNode = FileSystemNodeBase & {
	type: "folder";
	children: FileSystemNode[];
};

export type FileSystemNode = FileNode | FolderNode;

type ResolvedPath = {
	folder: FolderNode;
	validPath: string[];
};

type Breadcrumb = {
	label: string;
	path: string[];
};

type FileManagerContextValue = {
	fileSystem: FolderNode;
	currentPath: string[];
	currentFolder: FolderNode;
	breadcrumbs: Breadcrumb[];
	rootFolders: FolderNode[];
	navigateToPath: (path: string[]) => void;
	createFolder: (name: string) => { success: boolean; error?: string };
	getItemSubtitle: (item: FileSystemNode) => string;
	teamMembers: TeamMember[];
	isLoadingTeamMembers: boolean;
};

const FileManagerContext = createContext<FileManagerContextValue | null>(null);

const createPlaceholderOwner = (name: string): FileSystemOwner => ({
	id: null,
	name,
	email: null,
	avatarUrl: null,
});

const initialFileSystem: FolderNode = {
	id: "root",
	name: "All Files",
	ownerIndex: null,
	owner: createPlaceholderOwner("Unassigned"),
	ownerFallback: createPlaceholderOwner("Unassigned"),
	year: "2023",
	uploaded: "Jan 01, 2023",
	type: "folder",
	children: [
		{
			id: "folder-inbox",
			name: "Inbox",
			ownerIndex: 0,
			owner: createPlaceholderOwner("Unassigned"),
			ownerFallback: createPlaceholderOwner("Unassigned"),
			year: "2023",
			uploaded: "Jan 11, 2023",
			type: "folder",
			children: [
				{
					id: "file-contract-1",
					name: "Contract 1.jpeg",
					type: "file",
					size: "89.17 kb",
					ownerIndex: 1,
					owner: createPlaceholderOwner("Unassigned"),
					ownerFallback: createPlaceholderOwner("Unassigned"),
					uploaded: "Jan 11, 2023",
					year: "2023",
				},
				{
					id: "file-client-list",
					name: "Client list.txt",
					type: "file",
					size: "89.17 kb",
					ownerIndex: 2,
					owner: createPlaceholderOwner("Unassigned"),
					ownerFallback: createPlaceholderOwner("Unassigned"),
					uploaded: "Jan 11, 2023",
					year: "2023",
				},
			],
		},
		{
			id: "folder-exports",
			name: "Exports",
			ownerIndex: 3,
			owner: createPlaceholderOwner("Unassigned"),
			ownerFallback: createPlaceholderOwner("Unassigned"),
			year: "2022",
			uploaded: "Dec 11, 2022",
			type: "folder",
			children: [
				{
					id: "file-agreement",
					name: "Agreement.pdf",
					type: "file",
					size: "2.16 mb",
					ownerIndex: 3,
					owner: createPlaceholderOwner("Unassigned"),
					ownerFallback: createPlaceholderOwner("Unassigned"),
					uploaded: "Jan 11, 2023",
					year: "2023",
				},
				{
					id: "file-portfolio",
					name: "Portfolio.zip",
					type: "file",
					size: "89.17 kb",
					ownerIndex: 4,
					owner: createPlaceholderOwner("Unassigned"),
					ownerFallback: createPlaceholderOwner("Unassigned"),
					uploaded: "Jan 11, 2023",
					year: "2023",
				},
			],
		},
		{
			id: "folder-clients",
			name: "Clients",
			ownerIndex: 1,
			owner: createPlaceholderOwner("Unassigned"),
			ownerFallback: createPlaceholderOwner("Unassigned"),
			year: "2023",
			uploaded: "Feb 05, 2023",
			type: "folder",
			children: [
				{
					id: "folder-important",
					name: "Important",
					ownerIndex: 2,
					owner: createPlaceholderOwner("Unassigned"),
					ownerFallback: createPlaceholderOwner("Unassigned"),
					year: "2023",
					uploaded: "Feb 08, 2023",
					type: "folder",
					children: [
						{
							id: "file-options",
							name: "Options.pdf",
							type: "file",
							size: "89.17 kb",
							ownerIndex: 3,
							owner: createPlaceholderOwner("Unassigned"),
							ownerFallback: createPlaceholderOwner("Unassigned"),
							uploaded: "Feb 08, 2023",
							year: "2023",
						},
					],
				},
				{
					id: "file-priority",
					name: "Priority.docx",
					type: "file",
					size: "120.11 kb",
					ownerIndex: 4,
					owner: createPlaceholderOwner("Unassigned"),
					ownerFallback: createPlaceholderOwner("Unassigned"),
					uploaded: "Feb 10, 2023",
					year: "2023",
				},
			],
		},
		{
			id: "file-root-list",
			name: "List.txt",
			type: "file",
			size: "89.17 kb",
			ownerIndex: 0,
			owner: createPlaceholderOwner("Unassigned"),
			ownerFallback: createPlaceholderOwner("Unassigned"),
			uploaded: "Jan 11, 2023",
			year: "2023",
		},
	],
};

const isSameOwner = (a: FileSystemOwner, b: FileSystemOwner) =>
	a.id === b.id &&
	a.name === b.name &&
	a.email === b.email &&
	a.avatarUrl === b.avatarUrl;

const resolveOwnerFromTeamMembers = (
	ownerIndex: number | null,
	teamMembers: TeamMember[],
	fallback: FileSystemOwner,
): FileSystemOwner => {
	if (teamMembers.length === 0) {
		return fallback;
	}

	const normalizedIndex = ownerIndex ?? 0;
	const member =
		teamMembers[
			((normalizedIndex % teamMembers.length) + teamMembers.length) %
				teamMembers.length
		];

	return {
		id: member.id,
		name: member.fullName || member.email || "Team member",
		email: member.email ?? null,
		avatarUrl: member.avatarUrl ?? null,
	};
};

const mapNodeOwners = (
	node: FileSystemNode,
	teamMembers: TeamMember[],
): FileSystemNode => {
	const nextOwner = resolveOwnerFromTeamMembers(
		node.ownerIndex,
		teamMembers,
		node.ownerFallback,
	);
	const ownerChanged = !isSameOwner(node.owner, nextOwner);

	if (node.type === "folder") {
		const nextChildren = node.children.map((child) =>
			mapNodeOwners(child, teamMembers),
		);
		const childrenChanged = nextChildren.some(
			(child, index) => child !== node.children[index],
		);

		if (!ownerChanged && !childrenChanged) {
			return node;
		}

		return {
			...node,
			owner: nextOwner,
			children: nextChildren,
		};
	}

	if (!ownerChanged) {
		return node;
	}

	return {
		...node,
		owner: nextOwner,
	};
};

const updateOwnersWithTeamMembers = (
	root: FolderNode,
	teamMembers: TeamMember[],
): FolderNode => {
	const nextOwner = resolveOwnerFromTeamMembers(
		root.ownerIndex,
		teamMembers,
		root.ownerFallback,
	);
	const ownerChanged = !isSameOwner(root.owner, nextOwner);
	const nextChildren = root.children.map((child) =>
		mapNodeOwners(child, teamMembers),
	);
	const childrenChanged = nextChildren.some(
		(child, index) => child !== root.children[index],
	);

	if (!ownerChanged && !childrenChanged) {
		return root;
	}

	return {
		...root,
		owner: nextOwner,
		children: nextChildren,
	};
};

const sortNodes = (nodes: FileSystemNode[]) =>
	nodes.slice().sort((a, b) => {
		if (a.type !== b.type) {
			return a.type === "folder" ? -1 : 1;
		}
		return a.name.localeCompare(b.name, "en");
	});

const resolvePath = (root: FolderNode, path: string[]): ResolvedPath => {
	const validPath: string[] = [];
	let folder: FolderNode = root;

	for (const segment of path) {
		const candidate = folder.children.find(
			(child): child is FolderNode =>
				child.type === "folder" && child.name === segment,
		);

		if (!candidate) {
			break;
		}

		validPath.push(segment);
		folder = candidate;
	}

	return { folder, validPath };
};

const formatDate = (date: Date) =>
	new Intl.DateTimeFormat("en-US", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);

const createFolderNode = (
	name: string,
	teamMembers: TeamMember[],
): FolderNode => {
	const now = new Date();
	const fallbackOwner = createPlaceholderOwner("Unassigned");
	const owner = resolveOwnerFromTeamMembers(0, teamMembers, fallbackOwner);

	return {
		id:
			typeof crypto !== "undefined" && "randomUUID" in crypto
				? crypto.randomUUID()
				: `folder-${Date.now()}`,
		name,
		ownerIndex: 0,
		owner,
		ownerFallback: fallbackOwner,
		year: String(now.getFullYear()),
		uploaded: formatDate(now),
		type: "folder",
		children: [],
	};
};

const addFolderToPath = (
	folder: FolderNode,
	path: string[],
	newFolder: FolderNode,
): FolderNode => {
	if (path.length === 0) {
		return {
			...folder,
			children: sortNodes([...folder.children, newFolder]),
		};
	}

	const [current, ...rest] = path;

	return {
		...folder,
		children: sortNodes(
			folder.children.map((child) => {
				if (child.type === "folder" && child.name === current) {
					return addFolderToPath(child, rest, newFolder);
				}
				return child;
			}),
		),
	};
};

const getItemSubtitle = (item: FileSystemNode) => {
	if (item.type === "file") {
		const extension = item.name.includes(".")
			? (item.name.split(".").pop() ?? "")
			: "";
		return extension ? `${extension.toUpperCase()} file` : "File";
	}

	const count = item.children.length;
	return `${count} ${count === 1 ? "item" : "items"}`;
};

export function FileManagerProvider({ children }: { children: ReactNode }) {
	const [fileSystem, setFileSystem] = useState<FolderNode>(() => ({
		...initialFileSystem,
		children: sortNodes(initialFileSystem.children),
	}));
	const [currentPath, setCurrentPath] = useState<string[]>([]);
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);

	const resolved = useMemo(
		() => resolvePath(fileSystem, currentPath),
		[fileSystem, currentPath],
	);
	const sanitizedPath = resolved.validPath;
	const currentFolder = resolved.folder;

	useEffect(() => {
		let isMounted = true;

		const loadTeamMembers = async () => {
			try {
				setIsLoadingTeamMembers(true);
				const members = await fetchTeamMembers({});
				if (isMounted) {
					setTeamMembers(members);
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Nepoznata greška";
				const status =
					error instanceof Error && "status" in error
						? (error as Error & { status?: number }).status
						: undefined;
				console.error(
					"Failed to load team members for file manager",
					errorMessage,
					status ? `Status: ${status}` : "",
					error,
				);
				if (isMounted) {
					setTeamMembers([]);
				}
			} finally {
				if (isMounted) {
					setIsLoadingTeamMembers(false);
				}
			}
		};

		void loadTeamMembers();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		setFileSystem((prev) => updateOwnersWithTeamMembers(prev, teamMembers));
	}, [teamMembers]);

	useEffect(() => {
		if (
			sanitizedPath.length !== currentPath.length ||
			sanitizedPath.some((segment, index) => segment !== currentPath[index])
		) {
			setCurrentPath(sanitizedPath);
		}
	}, [currentPath, sanitizedPath]);

	const breadcrumbs = useMemo<Breadcrumb[]>(() => {
		const items: Breadcrumb[] = [{ label: fileSystem.name, path: [] }];

		sanitizedPath.forEach((segment, index) => {
			items.push({ label: segment, path: sanitizedPath.slice(0, index + 1) });
		});

		return items;
	}, [fileSystem.name, sanitizedPath]);

	const rootFolders = useMemo(
		() =>
			fileSystem.children.filter(
				(child): child is FolderNode => child.type === "folder",
			),
		[fileSystem.children],
	);

	const navigateToPath = useCallback(
		(path: string[]) => {
			const target = resolvePath(fileSystem, path);
			setCurrentPath(target.validPath);
		},
		[fileSystem],
	);

	const createFolder = useCallback(
		(name: string) => {
			const trimmedName = name.trim();
			if (!trimmedName) {
				return { success: false, error: "Folder name is required." };
			}

			const target = resolvePath(fileSystem, currentPath);
			const destination = target.folder;
			const exists = destination.children.some(
				(child) =>
					child.type === "folder" &&
					child.name.toLowerCase() === trimmedName.toLowerCase(),
			);

			if (exists) {
				return {
					success: false,
					error: "A folder with that name already exists in this directory.",
				};
			}

			const newFolder = createFolderNode(trimmedName, teamMembers);
			setFileSystem((prev) =>
				updateOwnersWithTeamMembers(
					addFolderToPath(prev, target.validPath, newFolder),
					teamMembers,
				),
			);

			return { success: true };
		},
		[fileSystem, currentPath, teamMembers],
	);

	const value = useMemo<FileManagerContextValue>(
		() => ({
			fileSystem,
			currentPath: sanitizedPath,
			currentFolder,
			breadcrumbs,
			rootFolders,
			navigateToPath,
			createFolder,
			getItemSubtitle,
			teamMembers,
			isLoadingTeamMembers,
		}),
		[
			fileSystem,
			sanitizedPath,
			currentFolder,
			breadcrumbs,
			rootFolders,
			navigateToPath,
			createFolder,
			teamMembers,
			isLoadingTeamMembers,
		],
	);

	return (
		<FileManagerContext.Provider value={value}>
			{children}
		</FileManagerContext.Provider>
	);
}

export function useFileManager() {
	const context = useContext(FileManagerContext);

	if (!context) {
		throw new Error(
			"useFileManager must be used within a FileManagerProvider component.",
		);
	}

	return context;
}
