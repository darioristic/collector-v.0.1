"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	type PerformanceReviewFormValues,
	performanceReviewFormSchema,
} from "../schemas";

interface PerformanceReviewFormDialogProps {
	open: boolean;
	mode: "create" | "edit";
	initialValues?: PerformanceReviewFormValues;
	isSubmitting?: boolean;
	onClose: () => void;
	onSubmit: (values: PerformanceReviewFormValues) => void;
}

export default function PerformanceReviewFormDialog({
	open,
	mode,
	initialValues,
	isSubmitting = false,
	onClose,
	onSubmit,
}: PerformanceReviewFormDialogProps) {
	const form = useForm<PerformanceReviewFormValues>({
		resolver: zodResolver(performanceReviewFormSchema),
		defaultValues: initialValues ?? {
			employeeId: "",
			reviewDate: new Date(),
			periodStart: new Date(),
			periodEnd: new Date(),
			reviewerId: null,
			rating: null,
			comments: "",
			goals: "",
		},
	});

	React.useEffect(() => {
		if (open && initialValues) {
			form.reset(initialValues);
		} else if (open && !initialValues) {
			form.reset({
				employeeId: "",
				reviewDate: new Date(),
				periodStart: new Date(),
				periodEnd: new Date(),
				reviewerId: null,
				rating: null,
				comments: "",
				goals: "",
			});
		}
	}, [open, initialValues, form]);

	const handleSubmit = form.handleSubmit((values) => {
		onSubmit(values);
	});

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{mode === "create"
							? "Add Performance Review"
							: "Edit Performance Review"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Create a new performance review for an employee."
							: "Update performance review information."}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={handleSubmit} className="space-y-4">
						<FormField
							control={form.control}
							name="employeeId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Employee ID</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Enter employee UUID" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-3 gap-4">
							<FormField
								control={form.control}
								name="reviewDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Review Date</FormLabel>
										<FormControl>
											<Input
												type="date"
												{...field}
												value={
													field.value
														? field.value.toISOString().split("T")[0]
														: ""
												}
												onChange={(e) =>
													field.onChange(new Date(e.target.value))
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="periodStart"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Period Start</FormLabel>
										<FormControl>
											<Input
												type="date"
												{...field}
												value={
													field.value
														? field.value.toISOString().split("T")[0]
														: ""
												}
												onChange={(e) =>
													field.onChange(new Date(e.target.value))
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="periodEnd"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Period End</FormLabel>
										<FormControl>
											<Input
												type="date"
												{...field}
												value={
													field.value
														? field.value.toISOString().split("T")[0]
														: ""
												}
												onChange={(e) =>
													field.onChange(new Date(e.target.value))
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="reviewerId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Reviewer ID (Optional)</FormLabel>
									<FormControl>
										<Input
											{...field}
											value={field.value ?? ""}
											placeholder="Enter reviewer UUID"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="rating"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Rating (1-5)</FormLabel>
									<Select
										onValueChange={(value) =>
											field.onChange(value ? parseInt(value, 10) : null)
										}
										value={field.value?.toString() ?? ""}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select rating" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="">No rating</SelectItem>
											<SelectItem value="1">1 - Poor</SelectItem>
											<SelectItem value="2">2 - Below Average</SelectItem>
											<SelectItem value="3">3 - Average</SelectItem>
											<SelectItem value="4">4 - Good</SelectItem>
											<SelectItem value="5">5 - Excellent</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="comments"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Comments</FormLabel>
									<FormControl>
										<Textarea {...field} value={field.value ?? ""} rows={4} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="goals"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Goals</FormLabel>
									<FormControl>
										<Textarea {...field} value={field.value ?? ""} rows={4} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting
									? "Saving..."
									: mode === "create"
										? "Add Review"
										: "Save Changes"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
