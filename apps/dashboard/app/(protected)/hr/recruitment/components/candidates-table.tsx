"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { generateAvatarFallback } from "@/lib/utils";
import type { Candidate } from "../types";

const statusVariantMap: Record<
	Candidate["status"],
	"default" | "secondary" | "destructive" | "outline"
> = {
	applied: "default",
	screening: "secondary",
	interview: "secondary",
	offer: "outline",
	hired: "default",
	rejected: "destructive",
};

const statusLabelMap: Record<Candidate["status"], string> = {
	applied: "Applied",
	screening: "Screening",
	interview: "Interview",
	offer: "Offer",
	hired: "Hired",
	rejected: "Rejected",
};

interface CandidatesTableProps {
	candidates: Candidate[];
	isLoading: boolean;
	onEdit: (candidate: Candidate) => void;
	onDelete: (candidate: Candidate) => void;
}

export default function CandidatesTable({
	candidates,
	onEdit,
	onDelete,
}: CandidatesTableProps) {
	return (
		<div className="space-y-4">
			<div className="bg-card hidden overflow-hidden rounded-xl border shadow-sm lg:block">
				<Table>
					<TableHeader className="bg-card/95 sticky top-0 z-10 backdrop-blur">
						<TableRow>
							<TableHead className="w-[240px]">Candidate</TableHead>
							<TableHead>Position</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Source</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{candidates.map((candidate) => (
							<TableRow key={candidate.id}>
								<TableCell>
									<div className="flex items-center gap-3">
										<Avatar className="size-9">
											<AvatarFallback>
												{generateAvatarFallback(
													`${candidate.firstName} ${candidate.lastName}`,
												)}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<span className="font-medium">
												{candidate.firstName} {candidate.lastName}
											</span>
										</div>
									</div>
								</TableCell>
								<TableCell>{candidate.position}</TableCell>
								<TableCell>{candidate.email}</TableCell>
								<TableCell>{candidate.phone ?? "—"}</TableCell>
								<TableCell>
									<Badge variant={statusVariantMap[candidate.status]} size="xs">
										{statusLabelMap[candidate.status]}
									</Badge>
								</TableCell>
								<TableCell>{candidate.source ?? "—"}</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onEdit(candidate)}
											aria-label="Edit candidate"
										>
											<Pencil className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onDelete(candidate)}
											aria-label="Delete candidate"
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="space-y-3 lg:hidden">
				{candidates.map((candidate) => (
					<div
						key={candidate.id}
						className="border-muted-foreground/20 bg-card flex flex-col gap-3 rounded-lg border p-4 shadow-sm"
					>
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-3">
								<Avatar className="size-10">
									<AvatarFallback>
										{generateAvatarFallback(
											`${candidate.firstName} ${candidate.lastName}`,
										)}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col">
									<span className="font-medium">
										{candidate.firstName} {candidate.lastName}
									</span>
									<span className="text-muted-foreground text-sm">
										{candidate.email}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => onEdit(candidate)}
									aria-label="Edit candidate"
								>
									<Pencil className="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => onDelete(candidate)}
									aria-label="Delete candidate"
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Position</span>
								<span className="text-sm font-medium">
									{candidate.position}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Status</span>
								<Badge variant={statusVariantMap[candidate.status]} size="xs">
									{statusLabelMap[candidate.status]}
								</Badge>
							</div>
							{candidate.phone && (
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-sm">Phone</span>
									<span className="text-sm">{candidate.phone}</span>
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
