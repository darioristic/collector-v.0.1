"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/src/hooks/useProjects";
import { fetchProjectTimeEntries } from "@/src/queries/projects";
import type { ProjectTimeEntry } from "@/src/types/projects";

export function TimeTrackingPageClient() {
	const { data: projects } = useProjects();
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
		null,
	);

	const { data: timeEntries, isLoading } = useQuery({
		queryKey: ["project-time-entries", selectedProjectId],
		queryFn: () => {
			if (!selectedProjectId) return Promise.resolve([]);
			return fetchProjectTimeEntries(selectedProjectId);
		},
		enabled: !!selectedProjectId,
	});

	const totalHours =
		timeEntries?.reduce((sum, entry) => sum + entry.hours, 0) ?? 0;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Praćenje vremena
					</h1>
					<p className="text-muted-foreground">
						Pratite utrošak sati na projektima i analizirajte produktivnost
						tima.
					</p>
				</div>
				<Button>
					<Plus className="mr-2 size-4" />
					Novi unos
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
				<>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="size-5" />
								Ukupno sati: {totalHours.toFixed(1)}h
							</CardTitle>
						</CardHeader>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Unosi vremena</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="size-6 animate-spin text-muted-foreground" />
								</div>
							) : timeEntries && timeEntries.length > 0 ? (
								<div className="space-y-4">
									{timeEntries.map((entry: ProjectTimeEntry) => (
										<Card key={entry.id} className="border">
											<CardContent className="pt-6">
												<div className="flex items-start justify-between">
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<span className="font-semibold">
																{entry.userName ??
																	entry.userEmail ??
																	"Nepoznat korisnik"}
															</span>
															<Badge variant="outline">{entry.hours}h</Badge>
														</div>
														{entry.taskTitle && (
															<p className="text-muted-foreground text-sm">
																Zadatak: {entry.taskTitle}
															</p>
														)}
														{entry.description && (
															<p className="text-muted-foreground text-sm">
																{entry.description}
															</p>
														)}
														<p className="text-muted-foreground text-xs">
															{format(new Date(entry.date), "dd.MM.yyyy")}
														</p>
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							) : (
								<p className="text-muted-foreground text-center py-8">
									Ovaj projekat nema unosa vremena. Dodajte novi unos da
									počnete.
								</p>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
