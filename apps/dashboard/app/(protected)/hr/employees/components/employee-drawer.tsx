"use client";

import {
	CalendarIcon,
	CheckCircle2,
	DollarSign,
	Mail,
	Phone,
	Trash2,
	Upload,
	UserCircle,
	X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/components/ui/tooltip";
import { generateAvatarFallback } from "@/lib/utils";
import type { Employee } from "../types";

interface EmployeeDrawerProps {
	open: boolean;
	employee: Employee | null;
	onClose: () => void;
	onEdit: (employee: Employee) => void;
	onDelete: (employee: Employee) => void;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const salaryFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0
});

const RECENT_ACTIVITY = [
	{
		title: "Salary update",
		description: "Adjusted annual salary to reflect new compensation band.",
		timestamp: "2 days ago",
		icon: DollarSign,
		color: "text-green-600"
	},
	{
		title: "Performance review",
		description: "Completed mid-year performance review with HR.",
		timestamp: "1 week ago",
		icon: CheckCircle2,
		color: "text-blue-600"
	},
	{
		title: "Document upload",
		description: "Uploaded signed NDA and compliance forms.",
		timestamp: "3 weeks ago",
		icon: Upload,
		color: "text-purple-600"
	}
];

const getAvatarUrl = (employee: Employee) =>
	`https://avatar.vercel.sh/${encodeURIComponent(employee.email)}.svg?size=128&text=${encodeURIComponent(employee.firstName.charAt(0))}`;

const calculateTenure = (startDate: string): string => {
	const start = new Date(startDate);
	const now = new Date();
	const years = now.getFullYear() - start.getFullYear();
	const months = now.getMonth() - start.getMonth();

	if (years === 0 && months === 0) {
		return "Less than a month";
	}

	if (years === 0) {
		return `${months} ${months === 1 ? "month" : "months"}`;
	}

	if (months === 0) {
		return `${years} ${years === 1 ? "year" : "years"}`;
	}

	return `${years} ${years === 1 ? "year" : "years"}, ${months} ${months === 1 ? "month" : "months"}`;
};

export default function EmployeeDrawer({
	open,
	employee,
	onClose,
	onEdit,
	onDelete
}: EmployeeDrawerProps) {
	React.useEffect(() => {
		if (!open) {
			return undefined;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose]);

	React.useEffect(() => {
		if (open) {
			const original = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = original;
			};
		}
		return undefined;
	}, [open]);

	if (!employee) return null;

	const tenure = calculateTenure(employee.startDate);
	const hasContactInfo = Boolean(employee.phone);

	return (
		<AnimatePresence>
			{open && (
				<>
					<motion.div
						className="fixed inset-0 z-40 bg-background/70 backdrop-blur"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
					/>
					<motion.aside
						className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-xl bg-background shadow-xl"
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", stiffness: 260, damping: 24 }}>
						<div className="flex h-full flex-col">
							{/* Profile Hero Header */}
							<div className="border-b bg-muted/30 px-6 py-6">
								<div className="flex items-start justify-between gap-4">
									<div className="flex items-center gap-4">
										<Avatar className="h-16 w-16 border-2 border-background shadow-sm">
											<AvatarImage src={getAvatarUrl(employee)} alt={employee.fullName} />
											<AvatarFallback className="text-lg font-semibold">
												{generateAvatarFallback(employee.fullName)}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1">
											<h2 className="text-2xl font-semibold leading-tight">
												{employee.fullName}
											</h2>
											<p className="text-muted-foreground mt-1 text-sm">
												{employee.role ?? "Role not set"} · {employee.department ?? "No department"}
											</p>
											<div className="mt-3 flex flex-wrap items-center gap-2">
												<Badge variant="outline">{employee.employmentType}</Badge>
												<Badge
													variant={
														employee.status === "Active"
															? "success"
															: employee.status === "On Leave"
																? "warning"
																: "destructive"
													}>
													{employee.status}
												</Badge>
												<Tooltip>
													<TooltipTrigger asChild>
														<Badge variant="secondary" className="cursor-help">
															Tenure: {tenure}
														</Badge>
													</TooltipTrigger>
													<TooltipContent>
														<p>Hired on {dateFormatter.format(new Date(employee.startDate))}</p>
													</TooltipContent>
												</Tooltip>
											</div>
											<div className="mt-3 flex items-center gap-2 text-sm">
												<Mail className="text-muted-foreground h-4 w-4" />
												<a
													href={`mailto:${employee.email}`}
													className="hover:text-primary text-muted-foreground transition-colors">
													{employee.email}
												</a>
											</div>
										</div>
									</div>
									<button
										type="button"
										onClick={onClose}
										className="text-muted-foreground hover:text-foreground rounded-full border border-transparent p-2 transition hover:border-border focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
										aria-label="Close drawer">
										<X className="size-5" aria-hidden="true" />
									</button>
								</div>
							</div>

							<ScrollArea className="flex-1 px-6 py-6">
								<div className="space-y-6">
									{/* Contact Section - Only show if there's additional contact info */}
									{hasContactInfo && (
										<Card>
											<CardHeader className="border-b pb-3">
												<CardTitle className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
													Contact
												</CardTitle>
											</CardHeader>
											<CardContent className="pt-4">
												{employee.phone && (
													<div className="flex items-center gap-3 text-sm">
														<Phone className="text-muted-foreground size-4 shrink-0" />
														<a
															href={`tel:${employee.phone}`}
															className="hover:text-primary transition-colors">
															{employee.phone}
														</a>
													</div>
												)}
											</CardContent>
										</Card>
									)}

									{/* Employment Details Card */}
									<Card>
										<CardHeader className="border-b pb-3">
											<CardTitle className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
												Employment Details
											</CardTitle>
										</CardHeader>
										<CardContent className="pt-4">
											<div className="grid grid-cols-2 gap-4 text-sm">
												<div>
													<p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
														Department
													</p>
													<p className="mt-1 font-medium">{employee.department ?? "—"}</p>
												</div>
												<div>
													<p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
														Position
													</p>
													<p className="mt-1 font-medium">{employee.role ?? "—"}</p>
												</div>
												<div>
													<p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
														Employment Type
													</p>
													<p className="mt-1 font-medium">{employee.employmentType}</p>
												</div>
												<div>
													<p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
														Salary
													</p>
													<p className="mt-1 font-medium">
														{employee.salary !== null && employee.salary !== undefined
															? salaryFormatter.format(employee.salary)
															: "—"}
													</p>
												</div>
												<div>
													<p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
														Start Date
													</p>
													<p className="mt-1 font-medium">
														{dateFormatter.format(new Date(employee.startDate))}
													</p>
												</div>
												<div>
													<p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
														End Date
													</p>
													<p className="mt-1 font-medium">
														{employee.endDate
															? dateFormatter.format(new Date(employee.endDate))
															: "—"}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Notes Card */}
									<Card>
										<CardHeader className="border-b pb-3">
											<CardTitle className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
												Notes
											</CardTitle>
										</CardHeader>
										<CardContent className="pt-4">
											<div className="bg-muted rounded-md p-4 text-sm leading-relaxed">
												{employee.fullName} is a valued team member contributing to{" "}
												{employee.department ?? "the team"}. Schedule regular check-ins to ensure
												alignment on goals, career development, and overall wellbeing.
											</div>
										</CardContent>
									</Card>

									{/* Recent Activity Timeline */}
									<Card>
										<CardHeader className="border-b pb-3">
											<CardTitle className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
												Recent Activity
											</CardTitle>
										</CardHeader>
										<CardContent className="pt-4">
											<div className="relative space-y-6">
												{/* Timeline line */}
												<div className="border-muted absolute left-4 top-0 h-full border-l-2" />
												{RECENT_ACTIVITY.map((item) => {
													const Icon = item.icon;
													return (
														<div key={item.title} className="relative flex gap-4">
															{/* Timeline dot */}
															<div className="bg-background border-muted relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2">
																<Icon className={`size-4 ${item.color}`} />
															</div>
															{/* Content */}
															<div className="flex-1 pb-6">
																<div className="flex items-start justify-between gap-2">
																	<div>
																		<p className="font-medium leading-tight">{item.title}</p>
																		<p className="text-muted-foreground mt-1 text-sm leading-relaxed">
																			{item.description}
																		</p>
																	</div>
																	<span className="text-muted-foreground shrink-0 text-xs">
																		{item.timestamp}
																	</span>
																</div>
															</div>
														</div>
													);
												})}
											</div>
										</CardContent>
									</Card>
								</div>
							</ScrollArea>

							{/* Sticky Footer Actions */}
							<div className="sticky bottom-0 border-t bg-background px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
								<div className="flex justify-end gap-2">
									<Button type="button" variant="outline" onClick={() => onDelete(employee)}>
										<Trash2 className="mr-2 size-4" aria-hidden="true" />
										Delete
									</Button>
									<Button type="button" onClick={() => onEdit(employee)}>
										<UserCircle className="mr-2 size-4" aria-hidden="true" />
										Edit Employee
									</Button>
								</div>
							</div>
						</div>
					</motion.aside>
				</>
			)}
		</AnimatePresence>
	);
}
