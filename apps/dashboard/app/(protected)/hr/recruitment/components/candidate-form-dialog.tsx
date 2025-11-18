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
import { type CandidateFormValues, candidateFormSchema } from "../schemas";

const STATUS_OPTIONS = [
	{ label: "Applied", value: "applied" },
	{ label: "Screening", value: "screening" },
	{ label: "Interview", value: "interview" },
	{ label: "Offer", value: "offer" },
	{ label: "Hired", value: "hired" },
	{ label: "Rejected", value: "rejected" },
] as const;

interface CandidateFormDialogProps {
	open: boolean;
	mode: "create" | "edit";
	initialValues?: CandidateFormValues;
	isSubmitting?: boolean;
	onClose: () => void;
	onSubmit: (values: CandidateFormValues) => void;
}

export default function CandidateFormDialog({
	open,
	mode,
	initialValues,
	isSubmitting = false,
	onClose,
	onSubmit,
}: CandidateFormDialogProps) {
	const form = useForm<CandidateFormValues>({
		resolver: zodResolver(candidateFormSchema),
		defaultValues: initialValues ?? {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			position: "",
			status: "applied",
			source: "",
			resumeUrl: "",
		},
	});

	React.useEffect(() => {
		if (open && initialValues) {
			form.reset(initialValues);
		} else if (open && !initialValues) {
			form.reset({
				firstName: "",
				lastName: "",
				email: "",
				phone: "",
				position: "",
				status: "applied",
				source: "",
				resumeUrl: "",
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
						{mode === "create" ? "Add Candidate" : "Edit Candidate"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Add a new candidate to the recruitment pipeline."
							: "Update candidate information."}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name</FormLabel>
										<FormControl>
											<Input {...field} />
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
										<FormLabel>Last Name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input type="email" {...field} />
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
										<Input {...field} value={field.value ?? ""} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="position"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Position</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Status</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{STATUS_OPTIONS.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="source"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Source</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="resumeUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Resume URL</FormLabel>
									<FormControl>
										<Input type="url" {...field} value={field.value ?? ""} />
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
										? "Add Candidate"
										: "Save Changes"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
