"use client";

import {
	ChevronRight,
	FileText,
	Filter,
	Folder,
	LayoutGrid,
	MoreHorizontal,
	PlusCircle,
	Search,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { FileSystemNode } from "./file-manager-provider";
import { useFileManager } from "./file-manager-provider";

const getOwnerInitials = (name?: string | null, fallback?: string | null) => {
	if (name) {
		const parts = name.split(" ").filter(Boolean);
		const initials = parts
			.slice(0, 2)
			.map((part) => part.charAt(0).toUpperCase());
		const result = initials.join("");
		if (result) {
			return result;
		}
	}

	if (fallback) {
		return fallback.slice(0, 2).toUpperCase();
	}

	return "??";
};

export function VaultTable() {
	const {
		currentFolder,
		currentPath,
		breadcrumbs,
		navigateToPath,
		createFolder,
		getItemSubtitle,
	} = useFileManager();
	const tableItems = currentFolder.children;

	const [rowsPerPage, setRowsPerPage] = useState<number>(5);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
	const [newFolderName, setNewFolderName] = useState("");
	const [createError, setCreateError] = useState("");
	const rowsPerPageId = useId();
	const folderNameFieldId = useId();

	const totalItems = tableItems.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
	const pageStartIndex = (currentPage - 1) * rowsPerPage;
	const pageEndIndex = pageStartIndex + rowsPerPage;

	const displayedItems = useMemo(
		() => tableItems.slice(pageStartIndex, pageEndIndex),
		[tableItems, pageStartIndex, pageEndIndex],
	);

	const pageRangeStart = totalItems === 0 ? 0 : pageStartIndex + 1;
	const pageRangeEnd =
		totalItems === 0 ? 0 : Math.min(pageEndIndex, totalItems);

	useEffect(() => {
		setCurrentPage((prev) => Math.min(prev, totalPages));
	}, [totalPages]);

	const previousPathRef = useRef<string[]>(currentPath);

	useEffect(() => {
		const previousPath = previousPathRef.current;
		const hasChanged =
			previousPath.length !== currentPath.length ||
			previousPath.some((segment, index) => segment !== currentPath[index]);

		if (hasChanged) {
			previousPathRef.current = currentPath;
			setCurrentPage(1);
		}
	}, [currentPath]);

	const handleNavigateToFolder = (item: FileSystemNode) => {
		if (item.type !== "folder") {
			return;
		}

		navigateToPath([...currentPath, item.name]);
	};

	const handleBreadcrumbClick = (path: string[]) => {
		navigateToPath(path);
	};

	const handleCreateFolder = () => {
		const result = createFolder(newFolderName);

		if (!result.success) {
			setCreateError(
				result.error ??
					"An unexpected error occurred while creating the folder.",
			);
			return;
		}

		setIsCreateFolderOpen(false);
		setNewFolderName("");
		setCreateError("");
	};

	return (
		<section className="space-y-6">
			<header className="border-border/60 bg-card/60 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 shadow-sm backdrop-blur">
				<div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
					{breadcrumbs.map((crumb, index) => {
						const isLast = index === breadcrumbs.length - 1;
						return (
							<div key={crumb.label} className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => handleBreadcrumbClick(crumb.path)}
									className={`transition-colors ${isLast ? "text-foreground font-semibold" : "hover:text-foreground"}`}
									disabled={isLast}
								>
									{crumb.label}
								</button>
								{index < breadcrumbs.length - 1 && (
									<ChevronRight className="text-muted-foreground/60 size-3.5" />
								)}
							</div>
						);
					})}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Dialog
						open={isCreateFolderOpen}
						onOpenChange={(open) => {
							setIsCreateFolderOpen(open);
							if (!open) {
								setNewFolderName("");
								setCreateError("");
							}
						}}
					>
						<Button
							type="button"
							variant="outline"
							className="gap-2"
							onClick={() => setIsCreateFolderOpen(true)}
						>
							<PlusCircle className="size-4" />
							<span className="hidden sm:inline">New Folder</span>
						</Button>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Create New Folder</DialogTitle>
								<DialogDescription>
									Enter the folder name to create it in the current directory.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-2">
								<Label htmlFor={folderNameFieldId}>Folder Name</Label>
								<Input
									id={folderNameFieldId}
									value={newFolderName}
									onChange={(event) => {
										setNewFolderName(event.target.value);
										setCreateError("");
									}}
									placeholder="Enter folder name"
									autoFocus
								/>
								{createError ? (
									<p className="text-destructive text-sm">{createError}</p>
								) : null}
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsCreateFolderOpen(false)}
								>
									Cancel
								</Button>
								<Button type="button" onClick={handleCreateFolder}>
									Create
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<Button variant="ghost" size="icon" className="size-9">
						<Search className="size-4" />
					</Button>
					<Button variant="ghost" size="icon" className="size-9">
						<Filter className="size-4" />
					</Button>
					<Button variant="ghost" size="icon" className="size-9">
						<LayoutGrid className="size-4" />
					</Button>
				</div>
			</header>

			<Card className="border-border/60 overflow-hidden border shadow-sm">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/40">
								<TableHead className="text-muted-foreground w-[40%] px-6 py-4 text-xs font-semibold tracking-wide uppercase">
									Name
								</TableHead>
								<TableHead className="text-muted-foreground px-6 py-4 text-xs font-semibold tracking-wide uppercase">
									Details
								</TableHead>
								<TableHead className="text-muted-foreground px-6 py-4 text-xs font-semibold tracking-wide uppercase">
									Owner
								</TableHead>
								<TableHead className="text-muted-foreground px-6 py-4 text-xs font-semibold tracking-wide uppercase">
									Size
								</TableHead>
								<TableHead className="text-muted-foreground px-6 py-4 text-xs font-semibold tracking-wide uppercase">
									Year
								</TableHead>
								<TableHead className="text-muted-foreground px-6 py-4 text-xs font-semibold tracking-wide uppercase">
									Uploaded
								</TableHead>
								<TableHead className="text-muted-foreground px-6 py-4 text-right text-xs font-semibold tracking-wide uppercase">
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{displayedItems.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="text-muted-foreground px-6 py-8 text-center text-sm"
									>
										This folder is currently empty.
									</TableCell>
								</TableRow>
							) : (
								displayedItems.map((item) => (
									<TableRow
										key={item.id}
										onClick={() => handleNavigateToFolder(item)}
										className={`border-border/60 bg-background/80 transition-colors ${
											item.type === "folder"
												? "hover:bg-muted/30 cursor-pointer"
												: "hover:bg-muted/20"
										}`}
									>
										<TableCell className="px-6 py-4">
											<div className="flex items-center gap-4">
												<div className="border-border/60 bg-muted/20 flex size-10 items-center justify-center rounded-xl border">
													{item.type === "folder" ? (
														<Folder className="size-5" />
													) : (
														<FileText className="size-5" />
													)}
												</div>
												<span className="text-foreground text-sm leading-none font-semibold">
													{item.name}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground px-6 py-4 text-sm">
											{getItemSubtitle(item)}
										</TableCell>
										<TableCell className="px-6 py-4">
											<div className="flex items-center gap-3">
												<Avatar className="size-8">
													{item.owner.avatarUrl ? (
														<AvatarImage
															src={item.owner.avatarUrl}
															alt={item.owner.name}
														/>
													) : (
														<AvatarFallback>
															{getOwnerInitials(
																item.owner.name,
																item.owner.email,
															)}
														</AvatarFallback>
													)}
												</Avatar>
												<div className="flex flex-col leading-tight">
													<span className="text-foreground text-sm font-medium">
														{item.owner.name}
													</span>
													{item.owner.email ? (
														<span className="text-muted-foreground text-xs">
															{item.owner.email}
														</span>
													) : null}
												</div>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground px-6 py-4 text-sm">
											{item.type === "file" ? item.size : "—"}
										</TableCell>
										<TableCell className="text-muted-foreground px-6 py-4 text-sm">
											{item.year}
										</TableCell>
										<TableCell className="text-muted-foreground px-6 py-4 text-sm">
											{item.uploaded}
										</TableCell>
										<TableCell className="px-6 py-4 text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="size-8"
														onClick={(event) => event.stopPropagation()}
													>
														<MoreHorizontal className="size-4" />
														<span className="sr-only">Open actions</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-44">
													<DropdownMenuItem
														onClick={(event) => {
															event.preventDefault();
															event.stopPropagation();
															handleNavigateToFolder(item);
														}}
													>
														Open
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={(event) => {
															event.preventDefault();
															event.stopPropagation();
														}}
													>
														Share
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={(event) => {
															event.preventDefault();
															event.stopPropagation();
														}}
													>
														Download
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				<footer className="border-border/60 bg-background/70 border-t px-6 py-4">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex items-center gap-3 text-sm">
							<Label htmlFor={rowsPerPageId} className="text-muted-foreground">
								Rows per page
							</Label>
							<Select
								value={String(rowsPerPage)}
								onValueChange={(value) => {
									const parsedValue = Number(value);
									setRowsPerPage(parsedValue);
									setCurrentPage(1);
								}}
							>
								<SelectTrigger id={rowsPerPageId} className="w-[120px]">
									<SelectValue placeholder="Rows per page" />
								</SelectTrigger>
								<SelectContent>
									{[5, 10, 25].map((option) => (
										<SelectItem key={option} value={String(option)}>
											{option}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
							<p className="text-muted-foreground text-sm">
								Showing {pageRangeStart}-{pageRangeEnd} of {totalItems}
							</p>
							<Pagination className="justify-start md:justify-end">
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											href="#"
											className={
												currentPage === 1
													? "cursor-not-allowed opacity-50"
													: "cursor-pointer"
											}
											aria-disabled={currentPage === 1}
											onClick={(event) => {
												event.preventDefault();
												if (currentPage > 1) {
													setCurrentPage((prev) => prev - 1);
												}
											}}
										/>
									</PaginationItem>
									{Array.from(
										{ length: totalPages },
										(_, index) => index + 1,
									).map((page) => (
										<PaginationItem key={page}>
											<PaginationLink
												href="#"
												isActive={page === currentPage}
												onClick={(event) => {
													event.preventDefault();
													setCurrentPage(page);
												}}
											>
												{page}
											</PaginationLink>
										</PaginationItem>
									))}
									<PaginationItem>
										<PaginationNext
											href="#"
											className={
												currentPage === totalPages
													? "cursor-not-allowed opacity-50"
													: "cursor-pointer"
											}
											aria-disabled={currentPage === totalPages}
											onClick={(event) => {
												event.preventDefault();
												if (currentPage < totalPages) {
													setCurrentPage((prev) => prev + 1);
												}
											}}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					</div>
				</footer>
			</Card>
		</section>
	);
}
