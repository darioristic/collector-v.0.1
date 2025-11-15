"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Account } from "@crm/types";
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

const ACCOUNT_TAG_OPTIONS = ["customer", "partner", "vendor"] as const;

const formSchema = z.object({
	name: z.string().trim().min(2, "Name is required."),
	email: z.string().trim().email("Provide a valid email address."),
	billingEmail: z.union([
		z.string().trim().email("Provide a valid email address."),
		z.literal(""),
	]).optional(),
	phone: z.string().trim().optional().or(z.literal("")),
	website: z.string().trim().optional().or(z.literal("")),
	type: z.enum(ACCOUNT_TAG_OPTIONS),
	taxId: z.string().trim().min(1, "Tax ID is required."),
	country: z
		.string()
		.trim()
		.min(2, "Use ISO country code.")
		.max(3, "Use ISO country code."),
	contactPerson: z.string().trim().optional().or(z.literal("")),
});

export type CompanyFormValues = z.infer<typeof formSchema>;

const DEFAULT_FORM_VALUES: CompanyFormValues = {
	name: "",
	email: "",
	billingEmail: "",
	phone: "",
	website: "",
	type: ACCOUNT_TAG_OPTIONS[0],
	taxId: "",
	country: "RS",
	contactPerson: "",
};

const formatTag = (value: (typeof ACCOUNT_TAG_OPTIONS)[number]): string => {
	return value.charAt(0).toUpperCase() + value.slice(1);
};

type NewCompanyFormProps = {
	onSubmit: (values: CompanyFormValues) => Promise<Account>;
	onCancel: () => void;
	defaultValues?: Partial<CompanyFormValues>;
	isSubmitting?: boolean;
	mode?: "create" | "edit";
};

export function NewCompanyForm({
	onSubmit,
	onCancel,
	defaultValues,
	isSubmitting = false,
	mode = "create",
}: NewCompanyFormProps) {
	const form = useForm<CompanyFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { ...DEFAULT_FORM_VALUES, ...defaultValues },
	});

	const handleSubmit = form.handleSubmit(async (values) => {
		await onSubmit(values);
	});

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit} className="space-y-6" aria-live="polite">
				<div className="grid gap-4 sm:grid-cols-2">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem className="sm:col-span-2">
								<FormLabel>Company name</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Acme Industries"
										autoFocus
									/>
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
										{...field}
										type="email"
										placeholder="acme@example.com"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="billingEmail"
						render={({ field }) => (
							<FormItem className="sm:col-span-2">
								<FormLabel>Billing Email</FormLabel>
								<FormControl>
									<Input
										{...field}
										type="email"
										placeholder="finance@example.com"
									/>
								</FormControl>
								<FormMessage />
								<p className="text-xs text-muted-foreground">
									This is an additional email that will be used to send invoices to.
								</p>
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
										{...field}
										placeholder="+1 (555) 123-4567"
										inputMode="tel"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="website"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Website</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="acme.com"
										type="url"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Tag</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{ACCOUNT_TAG_OPTIONS.map((option) => (
											<SelectItem key={option} value={option}>
												{formatTag(option)}
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
						name="taxId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Tax ID</FormLabel>
								<FormControl>
									<Input {...field} placeholder="RS123456789" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="country"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Country (ISO)</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="RS"
										maxLength={3}
										onChange={(event) =>
											field.onChange(event.target.value.toUpperCase())
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="contactPerson"
						render={({ field }) => (
							<FormItem className="sm:col-span-2">
								<FormLabel>Contact person</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="John Doe"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="outline"
						disabled={isSubmitting}
						onClick={onCancel}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{mode === "edit" ? "Updating…" : "Creating…"}
							</>
						) : (
							mode === "edit" ? "Update company" : "Create company"
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}

