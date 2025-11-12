"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import type { Content } from "@tiptap/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { MinimalTiptapEditor } from "@/components/ui/custom/minimal-tiptap/minimal-tiptap";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	EMPLOYMENT_STATUS_OPTIONS,
	EMPLOYMENT_TYPE_OPTIONS,
} from "../constants";
import {
	type EmployeeFormInput,
	type EmployeeFormValues,
	employeeFormUiSchema,
	toEmployeeFormInput,
} from "../schemas";

interface EmployeeFormDialogProps {
	open: boolean;
	mode: "create" | "edit";
	initialValues?: EmployeeFormValues;
	isSubmitting: boolean;
	onClose: () => void;
	onSubmit: (values: EmployeeFormValues) => void;
}

const getDefaultValues = (values?: EmployeeFormValues): EmployeeFormInput =>
	toEmployeeFormInput(values);

const PROJECT_OPTIONS = [
	"SaaS Mining Product",
	"E-commerce Platform",
	"Mobile App Development",
	"Website Redesign",
	"API Integration",
];

const WORK_HOUR_OPTIONS = [
	"40/Week",
	"48/Week",
	"32/Week",
	"20/Week",
	"Full-time",
	"Part-time",
];

export default function EmployeeFormDialog({
	open,
	mode,
	initialValues,
	isSubmitting,
	onClose,
	onSubmit,
}: EmployeeFormDialogProps) {
	const form = useForm<EmployeeFormInput>({
		resolver: zodResolver(employeeFormUiSchema),
		defaultValues: getDefaultValues(initialValues),
	});

	const normalizeDateValue = (value: string | Date | null | undefined) => {
		if (value instanceof Date) {
			if (Number.isNaN(value.getTime())) {
				return "";
			}
			return value.toISOString().split("T")[0] ?? "";
		}
		if (typeof value === "string") {
			return value;
		}
		return "";
	};

	React.useEffect(() => {
		if (open) {
			form.reset(getDefaultValues(initialValues));
		}
	}, [initialValues, form, open]);

	const handleSubmit = form.handleSubmit((values) => {
		const parsed = employeeFormUiSchema.parse(values);
		onSubmit(parsed);
	});

	const handleReset = () => {
		form.reset(getDefaultValues(initialValues));
	};

	const fullName = mode === "edit" && initialValues
		? `${initialValues.firstName} ${initialValues.lastName}`.trim()
		: "";
	const initials = fullName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}
		>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader className="relative">
					<DialogTitle>
						{mode === "create" ? "Add Employee" : "Edit Member Team"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Capture key details to onboard a new employee into the system."
							: "Manage your team detail here."}
					</DialogDescription>
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-0 top-0"
						onClick={onClose}
					>
						<X className="h-4 w-4" />
					</Button>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={handleSubmit} className="space-y-6">
						{mode === "edit" && initialValues && (
							<div className="flex items-center gap-4 rounded-lg border p-4">
								<Avatar className="h-12 w-12">
									<AvatarImage src="" alt={fullName} />
									<AvatarFallback>{initials}</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<h3 className="font-semibold">{fullName}</h3>
										<Badge variant="secondary" className="h-5 px-1.5">
											<span className="text-xs">🧠</span>
										</Badge>
									</div>
									<div className="flex items-center gap-2 mt-1">
										<p className="text-sm text-muted-foreground">
											{initialValues.role || "No role"}
										</p>
										<div className="flex items-center gap-1">
											<div className="h-2 w-2 rounded-full bg-green-500" />
											<span className="text-xs text-muted-foreground">
												{initialValues.status || "Active"}
											</span>
										</div>
									</div>
								</div>
								<Badge variant="info" className="ml-auto">
									Available
								</Badge>
							</div>
						)}

						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First name</FormLabel>
										<FormControl>
											<Input placeholder="Ana" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Last name</FormLabel>
										<FormControl>
											<Input placeholder="Jovanovic" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="ana.jovanovic@company.com"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Phone</FormLabel>
										<FormControl>
											<Input
												type="tel"
												placeholder="+381 60 123 4567"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="department"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Department</FormLabel>
										<FormControl>
											<Input placeholder="Engineering" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Role</FormLabel>
										<FormControl>
											<Select
												value={field.value || ""}
												onValueChange={field.onChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select role" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="Product Designer">
														Product Designer
													</SelectItem>
													<SelectItem value="Frontend Developer">
														Frontend Developer
													</SelectItem>
													<SelectItem value="Backend Developer">
														Backend Developer
													</SelectItem>
													<SelectItem value="Full Stack Developer">
														Full Stack Developer
													</SelectItem>
													<SelectItem value="Project Manager">
														Project Manager
													</SelectItem>
													<SelectItem value="UI/UX Designer">
														UI/UX Designer
													</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="projectAssigned"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Project Assigned</FormLabel>
										<FormControl>
											<Select
												value={field.value || ""}
												onValueChange={field.onChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select project" />
												</SelectTrigger>
												<SelectContent>
													{PROJECT_OPTIONS.map((project) => (
														<SelectItem key={project} value={project}>
															{project}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="workHour"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Work Hour</FormLabel>
										<FormControl>
											<Select
												value={field.value || ""}
												onValueChange={field.onChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select work hours" />
												</SelectTrigger>
												<SelectContent>
													{WORK_HOUR_OPTIONS.map((hours) => (
														<SelectItem key={hours} value={hours}>
															{hours}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="employmentType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Employment type</FormLabel>
										<FormControl>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
												<SelectContent>
													{EMPLOYMENT_TYPE_OPTIONS.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Status</FormLabel>
										<FormControl>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
												<SelectContent>
													{EMPLOYMENT_STATUS_OPTIONS.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Start date</FormLabel>
										<FormControl>
											<Input
												type="date"
												{...field}
												value={normalizeDateValue(field.value)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="endDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>End date</FormLabel>
										<FormControl>
											<Input
												type="date"
												{...field}
												value={normalizeDateValue(field.value)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="salary"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Salary (optional)</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												step="100"
												placeholder="85000"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<div className="min-h-[200px]">
											<MinimalTiptapEditor
												value={field.value || ""}
												onChange={(content: Content) => {
													field.onChange(
														typeof content === "string" ? content : String(content),
													);
												}}
												output="html"
												placeholder="Enter description..."
												editorContentClassName="min-h-[150px] p-4"
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex items-center justify-between pt-4 border-t">
							<FormField
								control={form.control}
								name="sendChangeToEmail"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
										<div className="space-y-0.5">
											<FormLabel className="text-base">
												Send Change to Email
											</FormLabel>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={handleReset}
									disabled={isSubmitting}
								>
									Reset
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<Loader2
												className="mr-2 h-4 w-4 animate-spin"
												aria-hidden="true"
											/>
											Saving...
										</>
									) : (
										"Save Changes"
									)}
								</Button>
							</div>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
