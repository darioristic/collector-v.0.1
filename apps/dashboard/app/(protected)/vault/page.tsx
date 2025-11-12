"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
	createVaultFolderAction,
	deleteVaultItemAction,
	renameVaultItemAction,
	uploadVaultFilesAction,
} from "@/app/vault/actions";
import type { VaultFolderItem, VaultListingResponse } from "@/app/vault/types";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
	UploadModal,
	VaultBreadcrumb,
	VaultHeader,
	VaultTable,
} from "@/components/vault";
import { useToast } from "@/hooks/use-toast";

type TableItem = {
	id: string;
	kind: "folder" | "file";
	name: string;
	owner: VaultFolderItem["owner"];
	size?: number | null;
	mimeType?: string | null;
	url?: string | null;
	createdAt: string;
	updatedAt: string;
};

const normalizeErrorMessage = (error: unknown, fallback: string): string => {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return fallback;
};

export default function VaultPage() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { toast } = useToast();

	const searchParamsString = searchParams?.toString() ?? "";
	const currentFolderId = searchParams?.get("folderId") ?? null;
	const queryParam = searchParams?.get("q") ?? "";

	const [search, setSearch] = useState(queryParam);
	const [debouncedSearch, setDebouncedSearch] = useState(queryParam);
	const [isUploadModalOpen, setUploadModalOpen] = useState(false);
	const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
	const [newFolderName, setNewFolderName] = useState("");
	const [renameTarget, setRenameTarget] = useState<TableItem | null>(null);
	const [renameValue, setRenameValue] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<TableItem | null>(null);

	const [isCreating, startCreating] = useTransition();
	const [isRenaming, startRenaming] = useTransition();
	const [isDeleting, startDeleting] = useTransition();

	const [vaultData, setVaultData] = useState<VaultListingResponse | null>(null);
	const [isFetching, setIsFetching] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		setSearch(queryParam);
		setDebouncedSearch(queryParam);
	}, [queryParam]);

	useEffect(() => {
		const handle = window.setTimeout(() => {
			setDebouncedSearch(search.trim());
		}, 300);

		return () => {
			window.clearTimeout(handle);
		};
	}, [search]);

	useEffect(() => {
		const existing = searchParams?.get("q") ?? "";
		if (existing === debouncedSearch.trim()) {
			return;
		}

		const params = new URLSearchParams(searchParamsString);
		const normalized = debouncedSearch.trim();

		if (normalized) {
			params.set("q", normalized);
		} else {
			params.delete("q");
		}

		if (currentFolderId) {
			params.set("folderId", currentFolderId);
		}

		router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, {
			scroll: false,
		});
	}, [
		debouncedSearch,
		currentFolderId,
		pathname,
		router,
		searchParams,
		searchParamsString,
	]);

	useEffect(() => {
		let isMounted = true;
		const controller = new AbortController();
		const run = async () => {
			setIsFetching(true);
			setIsSearching(Boolean(debouncedSearch));

			try {
				const params = new URLSearchParams();
				if (currentFolderId) {
					params.set("folderId", currentFolderId);
				}
				if (debouncedSearch) {
					params.set("search", debouncedSearch);
				}

				const response = await fetch(
					`/api/vault${params.toString() ? `?${params}` : ""}`,
					{
						method: "GET",
						headers: {
							Accept: "application/json",
						},
						cache: "no-store",
						signal: controller.signal,
					},
				);

				const body = (await response.json()) as VaultListingResponse & {
					error?: string;
				};

				if (!response.ok) {
					throw new Error(
						body?.error ?? "Neuspešno učitavanje Vault sadržaja.",
					);
				}

				if (!isMounted) {
					return;
				}

				setVaultData(body);
			} catch (error) {
				if (
					!isMounted ||
					(error instanceof DOMException && error.name === "AbortError")
				) {
					return;
				}

				toast({
					title: "Greška",
					description: normalizeErrorMessage(
						error,
						"Neuspešno učitavanje podataka.",
					),
					role: "alert",
				});
			} finally {
				if (isMounted) {
					setIsFetching(false);
					setIsSearching(false);
				}
			}
		};

		run();

		return () => {
			isMounted = false;
			controller.abort();
		};
	}, [currentFolderId, debouncedSearch, reloadKey, toast]);

	useEffect(() => {
		if (renameTarget) {
			setRenameValue(renameTarget.name);
		} else {
			setRenameValue("");
		}
	}, [renameTarget]);

	const triggerReload = () => setReloadKey((value) => value + 1);

	const tableItems: TableItem[] = useMemo(() => {
		if (!vaultData) {
			return [];
		}

		const folderItems: TableItem[] = vaultData.folders.map((folder) => ({
			id: folder.id,
			kind: "folder",
			name: folder.name,
			owner: folder.owner,
			createdAt: folder.createdAt,
			updatedAt: folder.updatedAt,
		}));

		const fileItems: TableItem[] = vaultData.files.map((file) => ({
			id: file.id,
			kind: "file",
			name: file.name,
			owner: file.owner,
			size: file.size,
			mimeType: file.type,
			url: file.url,
			createdAt: file.createdAt,
			updatedAt: file.updatedAt,
		}));

		return [...folderItems, ...fileItems];
	}, [vaultData]);

	const navigateToFolder = (folderId: string | null) => {
		const nextParams = new URLSearchParams(searchParamsString);

		if (folderId) {
			nextParams.set("folderId", folderId);
		} else {
			nextParams.delete("folderId");
		}

		const normalizedSearch = debouncedSearch.trim();
		if (normalizedSearch) {
			nextParams.set("q", normalizedSearch);
		}

		router.push(`${pathname}${nextParams.toString() ? `?${nextParams}` : ""}`, {
			scroll: false,
		});
	};

	const handleCreateFolderSubmit = () => {
		const name = newFolderName.trim();
		if (!name) {
			toast({
				title: "Naziv je obavezan",
				description: "Unesite naziv foldera pre kreiranja.",
			});
			return;
		}

		startCreating(async () => {
			try {
				await createVaultFolderAction({
					name,
					parentId: currentFolderId ?? null,
				});

				toast({
					title: "Folder kreiran",
					description: `Folder "${name}" je uspešno dodat.`,
				});

				setCreateDialogOpen(false);
				setNewFolderName("");
				triggerReload();
			} catch (error) {
				toast({
					title: "Greška",
					description: normalizeErrorMessage(
						error,
						"Kreiranje foldera nije uspelo.",
					),
				});
			}
		});
	};

	const handleRenameSubmit = () => {
		if (!renameTarget) {
			return;
		}

		const nextName = renameValue.trim();
		if (!nextName) {
			toast({
				title: "Naziv je obavezan",
				description: "Unesite novi naziv pre čuvanja promena.",
			});
			return;
		}

		if (nextName === renameTarget.name) {
			setRenameTarget(null);
			return;
		}

		startRenaming(async () => {
			try {
				await renameVaultItemAction({
					id: renameTarget.id,
					name: nextName,
				});

				toast({
					title: "Naziv ažuriran",
					description: `Resurs "${nextName}" je uspešno preimenovan.`,
				});

				setRenameTarget(null);
				triggerReload();
			} catch (error) {
				toast({
					title: "Greška",
					description: normalizeErrorMessage(
						error,
						"Preimenovanje nije uspelo.",
					),
				});
			}
		});
	};

	const handleDeleteConfirm = () => {
		if (!deleteTarget) {
			return;
		}

		startDeleting(async () => {
			try {
				await deleteVaultItemAction(deleteTarget.id);

				toast({
					title: "Resurs obrisan",
					description:
						deleteTarget.kind === "folder"
							? `Folder "${deleteTarget.name}" i sadržaj su obrisani.`
							: `Fajl "${deleteTarget.name}" je obrisan.`,
				});

				setDeleteTarget(null);
				triggerReload();
			} catch (error) {
				toast({
					title: "Greška",
					description: normalizeErrorMessage(error, "Brisanje nije uspelo."),
				});
			}
		});
	};

	const handleUpload = async (formData: FormData) => {
		await uploadVaultFilesAction(formData);
		triggerReload();
	};

	const isInitialLoading = isFetching && !vaultData;
	const currentFolder = vaultData?.currentFolder ?? null;

	return (
		<>
			<div className="space-y-6 py-6">
				<VaultHeader
					searchValue={search}
					onSearchChange={setSearch}
					onResetSearch={() => setSearch("")}
					onOpenUpload={() => setUploadModalOpen(true)}
					onCreateFolder={() => setCreateDialogOpen(true)}
					isUploadDisabled={isFetching}
					isCreateDisabled={isCreating}
					isSearching={isSearching}
				/>

				<VaultBreadcrumb
					items={vaultData?.breadcrumbs ?? [{ id: null, name: "Vault" }]}
					onNavigate={(breadcrumb) => navigateToFolder(breadcrumb.id)}
				/>

				<VaultTable
					items={tableItems}
					isLoading={isInitialLoading}
					onOpenFolder={(item) => navigateToFolder(item.id)}
					onRename={(item) => setRenameTarget(item)}
					onDelete={(item) => setDeleteTarget(item)}
				/>
			</div>

			<UploadModal
				isOpen={isUploadModalOpen}
				onClose={() => setUploadModalOpen(false)}
				folders={vaultData?.availableFolders ?? []}
				defaultFolderId={currentFolder?.id ?? currentFolderId ?? undefined}
				onUpload={handleUpload}
			/>

			<Dialog
				open={isCreateDialogOpen}
				onOpenChange={(open) =>
					!open ? setCreateDialogOpen(false) : setCreateDialogOpen(true)
				}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Novi folder</DialogTitle>
						<DialogDescription>
							Unesite naziv novog foldera koji želite da kreirate.
						</DialogDescription>
					</DialogHeader>
					<Input
						value={newFolderName}
						onChange={(event) => setNewFolderName(event.target.value)}
						placeholder="npr. Reports"
						autoFocus
						disabled={isCreating}
					/>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setCreateDialogOpen(false)}
							disabled={isCreating}
						>
							Otkaži
						</Button>
						<Button
							type="button"
							onClick={handleCreateFolderSubmit}
							disabled={isCreating}
						>
							{isCreating ? <Spinner className="mr-2 size-4" /> : null}
							Kreiraj
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={Boolean(renameTarget)}
				onOpenChange={(open) => (!open ? setRenameTarget(null) : null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Preimenuj {renameTarget?.kind === "folder" ? "folder" : "fajl"}
						</DialogTitle>
						<DialogDescription>
							Unesite novi naziv i sačuvajte promene.
						</DialogDescription>
					</DialogHeader>
					<Input
						value={renameValue}
						onChange={(event) => setRenameValue(event.target.value)}
						autoFocus
						disabled={isRenaming}
					/>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setRenameTarget(null)}
							disabled={isRenaming}
						>
							Otkaži
						</Button>
						<Button
							type="button"
							onClick={handleRenameSubmit}
							disabled={isRenaming}
						>
							{isRenaming ? <Spinner className="mr-2 size-4" /> : null}
							Sačuvaj
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={Boolean(deleteTarget)}
				onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Obriši {deleteTarget?.kind === "folder" ? "folder" : "fajl"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{deleteTarget?.kind === "folder"
								? "Ceo sadržaj foldera biće trajno obrisan. Ovu akciju nije moguće opozvati."
								: "Fajl će biti trajno obrisan iz Vault-a."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Otkaži</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							disabled={isDeleting}
						>
							{isDeleting ? <Spinner className="mr-2 size-4" /> : null}
							Obriši
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
