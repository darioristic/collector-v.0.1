"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/src/hooks/useProjects";
import { fetchProjectTeams } from "@/src/queries/projects";
import type { ProjectTeam } from "@/src/types/projects";

export function TeamsPageClient() {
	const { data: projects } = useProjects();
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
		null,
	);

	const { data: teams, isLoading } = useQuery({
		queryKey: ["project-teams", selectedProjectId],
		queryFn: () => {
			if (!selectedProjectId) return Promise.resolve([]);
			return fetchProjectTeams(selectedProjectId);
		},
		enabled: !!selectedProjectId,
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Timovi projekata
					</h1>
					<p className="text-muted-foreground">
						Upravljajte multifunkcionalnim timovima i njihovim ciljevima na
						projektima.
					</p>
				</div>
				<Button>
					<Plus className="mr-2 size-4" />
					Novi tim
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Izaberi projekat</CardTitle>
				</CardHeader>
				<CardContent>
					{projects && projects.length > 0 ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{projects.map((project) => (
								<Button
									key={project.id}
									variant={
										selectedProjectId === project.id ? "default" : "outline"
									}
									className="h-auto flex-col items-start p-4"
									onClick={() => setSelectedProjectId(project.id)}
								>
									<div className="text-left">
										<div className="font-semibold">{project.name}</div>
										<div className="text-muted-foreground text-sm">
											{project.statusLabel}
										</div>
									</div>
								</Button>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-center py-8">
							Nema dostupnih projekata.
						</p>
					)}
				</CardContent>
			</Card>

			{selectedProjectId && (
				<Card>
					<CardHeader>
						<CardTitle>Timovi projekta</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="size-6 animate-spin text-muted-foreground" />
							</div>
						) : teams && teams.length > 0 ? (
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{teams.map((team: ProjectTeam) => (
									<Card key={team.id} className="border">
										<CardHeader>
											<CardTitle className="text-lg">{team.name}</CardTitle>
										</CardHeader>
										<CardContent>
											{team.goal && (
												<p className="text-muted-foreground text-sm">
													{team.goal}
												</p>
											)}
											<div className="mt-4 flex items-center gap-2">
												<Badge variant="outline">
													Kreiran:{" "}
													{new Date(team.createdAt).toLocaleDateString()}
												</Badge>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-center py-8">
								Ovaj projekat nema timova. Kreirajte novi tim da počnete.
							</p>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
