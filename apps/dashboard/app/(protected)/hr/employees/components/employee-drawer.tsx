"use client";

import {
	CheckCircle2,
	DollarSign,
	Mail,
	Phone,
	Trash2,
	Upload,
	UserCircle
} from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle
} from "@/components/ui/sheet";
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
	if (!employee) return null;

	const tenure = calculateTenure(employee.startDate);
	const hasContactInfo = Boolean(employee.phone);

	return (
		<Sheet
			open={open && Boolean(employee)}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					onClose();
				}
			}}
		>
			<SheetContent
				side="right"
				className="flex h-full w-full flex-col overflow-hidden border-l p-0 sm:max-w-xl"
			>
				<div className="flex h-full flex-col">
					{/* Header */}
					<div className="border-b px-6 py-5">
						<div className="space-y-1">
							<SheetTitle className="text-2xl leading-tight font-semibold">
								Employee details
							</SheetTitle>
							<SheetDescription>
								Review the status, employment details, and key information for{" "}
								{employee.fullName}.
							</SheetDescription>
						</div>
					</div>

					<ScrollArea className="h-[calc(100vh-200px)] flex-1">
						<div className="space-y-6 px-6 py-5">
							{/* Profile Section */}
							<section className="space-y-4">
								<div className="flex items-start gap-4">
									<Avatar className="size-16">
										<AvatarImage src={getAvatarUrl(employee)} alt={employee.fullName} />
										<AvatarFallback className="text-lg font-semibold">
											{generateAvatarFallback(employee.fullName)}
										</AvatarFallback>
									</Avatar>
									<div className="flex flex-col gap-2">
										<div className="flex flex-wrap items-center gap-3">
											<h2 className="text-xl font-semibold">
												{employee.fullName}
											</h2>
											<Badge
												variant={
													employee.status === "Active"
														? "success"
														: employee.status === "On Leave"
															? "warning"
															: "destructive"
												}
											>
												{employee.status}
											</Badge>
										</div>
										<p className="text-muted-foreground text-sm leading-relaxed">
											{employee.role ?? "Role not set"} · {employee.department ?? "No department"}
										</p>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant="outline">{employee.employmentType}</Badge>
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
									</div>
								</div>

								<dl className="grid gap-4 sm:grid-cols-2">
									<div>
										<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
											Email
										</dt>
										<dd className="flex items-center gap-2">
											<Mail className="text-muted-foreground h-4 w-4" />
											<a
												href={`mailto:${employee.email}`}
												className="hover:text-primary text-sm transition-colors">
												{employee.email}
											</a>
										</dd>
									</div>
									{hasContactInfo && employee.phone && (
										<div>
											<dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
												Phone
											</dt>
											<dd className="flex items-center gap-2">
												<Phone className="text-muted-foreground h-4 w-4" />
												<a
													href={`tel:${employee.phone}`}
													className="hover:text-primary text-sm transition-colors">
													{employee.phone}
												</a>
											</dd>
										</div>
									)}
								</dl>
							</section>

							{/* Employment Details Card */}
							<section className="space-y-4">
								<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
									Employment Details
								</h3>
								<Card>
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
							</section>

							{/* Notes Card */}
							<section className="space-y-4">
								<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
									Notes
								</h3>
								<Card>
									<CardContent className="pt-4">
										<div className="bg-muted rounded-md p-4 text-sm leading-relaxed">
											{employee.fullName} is a valued team member contributing to{" "}
											{employee.department ?? "the team"}. Schedule regular check-ins to ensure
											alignment on goals, career development, and overall wellbeing.
										</div>
									</CardContent>
								</Card>
							</section>

							{/* Recent Activity Timeline */}
							<section className="space-y-4">
								<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
									Recent Activity
								</h3>
								<Card>
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
							</section>
						</div>
					</ScrollArea>

					{/* Footer Actions */}
					<div className="border-t bg-background px-6 py-4">
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
			</SheetContent>
		</Sheet>
	);
}
