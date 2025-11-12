"use client";

import type {
	Activity,
	ActivityCreateInput,
	ActivityPriority,
	ActivityStatus,
	ActivityType,
} from "@crm/types";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DateTimePicker } from "@/components/date-time-picker";
import { Button } from "@/components/ui/button";
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
	ACTIVITY_PRIORITY_LABEL,
	ACTIVITY_PRIORITY_OPTIONS,
	ACTIVITY_STATUS_LABEL,
	ACTIVITY_STATUS_OPTIONS,
	ACTIVITY_TYPE_LABEL,
	ACTIVITY_TYPE_OPTIONS,
} from "../constants";

type Option = {
	id: string;
	name: string;
	email?: string | null;
};

const activityTypeEnum = z.enum([
	...ACTIVITY_TYPE_OPTIONS.map((option) => option.value),
] as [ActivityType, ...ActivityType[]]);

const activityStatusEnum = z.enum([
	...ACTIVITY_STATUS_OPTIONS.map((option) => option.value),
] as [ActivityStatus, ...ActivityStatus[]]);

const activityPriorityEnum = z.enum([
	...ACTIVITY_PRIORITY_OPTIONS.map((option) => option.value),
] as [ActivityPriority, ...ActivityPriority[]]);

const activityFormSchema = z.object({
	title: z.string().trim().min(2, "Activity name is required."),
	clientId: z.string().min(1, "Select a client."),
	assignedTo: z.string().min(1, "Choose a team member."),
	type: activityTypeEnum,
	dueDate: z.date({ required_error: "Select a due date and time." }),
	status: activityStatusEnum,
	priority: activityPriorityEnum,
	notes: z
		.string()
		.max(1000, "Notes should not exceed 1000 characters.")
		.optional()
		.or(z.literal("")),
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

export interface ActivityFormProps {
	initialActivity?: Activity;
	clients: Option[];
	assignees: Option[];
	defaultDueDate?: string;
	isSubmitting?: boolean;
	onSubmit: (values: ActivityCreateInput) => Promise<void>;
	onCancel?: () => void;
}

export function ActivityForm({
	initialActivity,
	clients,
	assignees,
	defaultDueDate,
	isSubmitting,
	onSubmit,
	onCancel,
}: ActivityFormProps) {
	const fallbackDueDate = React.useMemo(() => {
		if (initialActivity) {
			return new Date(initialActivity.dueDate);
		}

		if (defaultDueDate) {
			return new Date(defaultDueDate);
		}

		const now = new Date();
		now.setMinutes(0, 0, 0);
		return now;
	}, [initialActivity, defaultDueDate]);

	const form = useForm<ActivityFormValues>({
		resolver: zodResolver(activityFormSchema),
		defaultValues: {
			title: initialActivity?.title ?? "",
			clientId: initialActivity?.clientId ?? clients[0]?.id ?? "",
			assignedTo: initialActivity?.assignedTo ?? assignees[0]?.id ?? "",
			type: initialActivity?.type ?? ACTIVITY_TYPE_OPTIONS[0]?.value ?? "call",
			dueDate: fallbackDueDate,
			status:
				initialActivity?.status ??
				ACTIVITY_STATUS_OPTIONS[0]?.value ??
				"scheduled",
			priority:
				initialActivity?.priority ??
				ACTIVITY_PRIORITY_OPTIONS[1]?.value ??
				"medium",
			notes: initialActivity?.notes ?? "",
		},
	});

	React.useEffect(() => {
		if (
			!initialActivity &&
			!form.getValues("assignedTo") &&
			assignees.length > 0
		) {
			form.setValue("assignedTo", assignees[0]?.id ?? "");
		}
	}, [assignees, form, initialActivity]);

	const handleSubmit = form.handleSubmit(async (values) => {
		const payload: ActivityCreateInput = {
			title: values.title.trim(),
			clientId: values.clientId,
			assignedTo: values.assignedTo,
			type: values.type,
			dueDate: values.dueDate.toISOString(),
			status: values.status,
			priority: values.priority,
			notes: values.notes?.trim() ? values.notes.trim() : undefined,
		};

		await onSubmit(payload);
	});

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem className="md:col-span-2">
								<FormLabel>Activity Name</FormLabel>
								<FormControl>
									<Input placeholder="Follow up with client" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="clientId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Client</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={clients.length === 0}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select client" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{clients.map((client) => (
											<SelectItem key={client.id} value={client.id}>
												{client.name}
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
						name="assignedTo"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Assigned To</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={assignees.length === 0}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select owner" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{assignees.map((user) => (
											<SelectItem key={user.id} value={user.id}>
												{user.name}
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
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Activity Type</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{ACTIVITY_TYPE_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{ACTIVITY_TYPE_LABEL[option.value]}
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
						name="dueDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Due Date &amp; Time</FormLabel>
								<FormControl>
									<DateTimePicker date={field.value} setDate={field.onChange} />
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
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{ACTIVITY_STATUS_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{ACTIVITY_STATUS_LABEL[option.value]}
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
						name="priority"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Priority</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select priority" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{ACTIVITY_PRIORITY_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{ACTIVITY_PRIORITY_LABEL[option.value]}
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
						name="notes"
						render={({ field }) => (
							<FormItem className="md:col-span-2">
								<FormLabel>Notes</FormLabel>
								<FormControl>
									<Textarea
										rows={4}
										placeholder="Key talking points, context, or follow-up steps"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					{onCancel ? (
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
					) : null}
					<Button type="submit" disabled={isSubmitting}>
						{initialActivity ? "Save Changes" : "Create Activity"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
