"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ensureResponse, getApiUrl } from "@/src/lib/fetch-utils";
import type {
	AddTeamMemberPayload,
	ProjectTeamMember,
} from "@/src/types/projects";

type DirectoryUser = {
	id: string;
	name: string;
	email: string;
};

type ProjectTeamProps = {
	team: ProjectTeamMember[];
	onAddMember: (payload: AddTeamMemberPayload) => Promise<unknown>;
	onRemoveMember: (userId: string) => Promise<unknown>;
	isMutating?: boolean;
};

const fetchUsers = async (): Promise<DirectoryUser[]> => {
	const response = await ensureResponse(
		fetch(getApiUrl("settings/users"), {
			method: "GET",
			headers: {
				Accept: "application/json",
			},
			cache: "no-store",
		}),
	);

	const payload = await response.json();
	if (Array.isArray(payload)) {
		return payload;
	}
	return payload?.data ?? [];
};

export function ProjectTeam({
	team,
	onAddMember,
	onRemoveMember,
	isMutating,
}: ProjectTeamProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<string>("");
	const [role, setRole] = useState<string>("contributor");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { data: directory, isLoading } = useQuery({
		queryKey: ["directory-users"],
		queryFn: fetchUsers,
	});

	const availableUsers = useMemo(() => {
		if (!directory) return [];
		const alreadyAssigned = new Set(team.map((member) => member.userId));
		return directory.filter((user) => !alreadyAssigned.has(user.id));
	}, [directory, team]);

	const handleAddMember = async () => {
		if (!selectedUserId) return;

		setIsSubmitting(true);
		try {
			await onAddMember({ userId: selectedUserId, role });
			setIsDialogOpen(false);
			setSelectedUserId("");
			setRole("contributor");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRemoveMember = async (userId: string) => {
		await onRemoveMember(userId);
	};

	return (
		<Card className="border-none bg-card/80 shadow-lg shadow-primary/5">
			<CardHeader className="flex flex-row items-center justify-between gap-4">
				<div>
					<CardTitle className="text-xl font-semibold">Tim</CardTitle>
					<p className="text-muted-foreground text-sm">
						Osobe uključene u projekat sa njihovim ulogama i kontaktima.
					</p>
				</div>
				<Button size="sm" onClick={() => setIsDialogOpen(true)}>
					<Plus className="mr-2 size-4" />
					Dodaj člana
				</Button>
			</CardHeader>
			<CardContent>
				{team.length === 0 ? (
					<div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
						Još uvek nema dodeljenih članova. Dodajte kolege kako biste podelili
						odgovornosti.
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{team.map((member) => (
							<div
								key={member.userId}
								className="group relative flex flex-col rounded-2xl border bg-card/80 p-4 shadow-sm transition hover:shadow-md"
							>
								<div className="flex items-start gap-3">
									<Avatar className="size-11 border border-border">
										<AvatarFallback className="bg-primary/10 font-semibold">
											{member.name
												?.split(" ")
												.map((part) => part[0])
												.join("")
												.toUpperCase() ?? "NA"}
										</AvatarFallback>
									</Avatar>
									<div className="flex flex-1 flex-col gap-1">
										<div className="flex items-center justify-between gap-2">
											<div>
												<div className="font-medium text-sm text-foreground">
													{member.name ?? member.email ?? "Nepoznat član"}
												</div>
												<div className="text-muted-foreground text-xs">
													{member.email ?? "—"}
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="size-8 rounded-full opacity-0 transition group-hover:opacity-100"
												onClick={() => handleRemoveMember(member.userId)}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
										<Badge
											variant="outline"
											className="mt-2 w-max rounded-full px-3 py-1 text-xs"
										>
											{member.role}
										</Badge>
										<div className="text-muted-foreground text-[11px] uppercase tracking-wide">
											Dodato: {new Date(member.addedAt).toLocaleDateString()}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-[460px]">
					<DialogHeader>
						<DialogTitle>Dodaj člana tima</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Izaberi korisnika</Label>
							{isLoading ? (
								<div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground">
									<Loader2 className="size-4 animate-spin" />
									Učitavanje korisnika...
								</div>
							) : (
								<Select
									value={selectedUserId}
									onValueChange={setSelectedUserId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Odaberite osobu iz adresara" />
									</SelectTrigger>
									<SelectContent>
										{availableUsers.length === 0 ? (
											<div className="p-2 text-xs text-muted-foreground">
												Svi korisnici su već deo ovog projekta.
											</div>
										) : (
											availableUsers.map((user) => (
												<SelectItem key={user.id} value={user.id}>
													<div className="flex flex-col gap-1 text-left">
														<span className="font-medium text-sm">
															{user.name}
														</span>
														<span className="text-muted-foreground text-xs">
															{user.email}
														</span>
													</div>
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="role">Uloga u projektu</Label>
							<Input
								id="role"
								placeholder="npr. Frontend Developer"
								value={role}
								onChange={(event) => setRole(event.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsDialogOpen(false)}
						>
							Otkaži
						</Button>
						<Button
							type="button"
							disabled={!selectedUserId || isMutating || isSubmitting}
							onClick={handleAddMember}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Dodavanje...
								</>
							) : (
								"Dodaj člana"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
