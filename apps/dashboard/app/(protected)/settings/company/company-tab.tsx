"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	companyFormSchema,
	type CompanyFormValues,
} from "@/lib/validations/settings/company";
import { useCompanySettings } from "./use-company-settings";

export default function CompanyTab() {
	const { company, isLoading, updateCompany, isUpdating } = useCompanySettings();

	const form = useForm<CompanyFormValues>({
		resolver: zodResolver(companyFormSchema),
		defaultValues: {
			name: "",
			legalName: "",
			registrationNo: "",
			taxId: "",
			industry: "",
			employees: undefined,
			streetAddress: "",
			city: "",
			zipCode: "",
			country: "",
			email: "",
			phone: "",
			website: "",
			logoUrl: "",
			faviconUrl: "",
			brandColor: "",
			description: "",
		},
	});

	React.useEffect(() => {
		if (company) {
			form.reset({
				name: company.name ?? "",
				legalName: company.legalName ?? "",
				registrationNo: company.registrationNo ?? "",
				taxId: company.taxId ?? "",
				industry: company.industry ?? "",
				employees: company.employees ?? undefined,
				streetAddress: company.streetAddress ?? "",
				city: company.city ?? "",
				zipCode: company.zipCode ?? "",
				country: company.country ?? "",
				email: company.email ?? "",
				phone: company.phone ?? "",
				website: company.website ?? "",
				logoUrl: company.logoUrl ?? "",
				faviconUrl: company.faviconUrl ?? "",
				brandColor: company.brandColor ?? "",
				description: company.description ?? "",
			});
		}
	}, [company, form]);

	const onSubmit = async (values: CompanyFormValues) => {
		try {
			const updatedCompany = await updateCompany(values);
			// Reset form with updated data
			if (updatedCompany) {
				form.reset({
					name: updatedCompany.name ?? "",
					legalName: updatedCompany.legalName ?? "",
					registrationNo: updatedCompany.registrationNo ?? "",
					taxId: updatedCompany.taxId ?? "",
					industry: updatedCompany.industry ?? "",
					employees: updatedCompany.employees ?? undefined,
					streetAddress: updatedCompany.streetAddress ?? "",
					city: updatedCompany.city ?? "",
					zipCode: updatedCompany.zipCode ?? "",
					country: updatedCompany.country ?? "",
					email: updatedCompany.email ?? "",
					phone: updatedCompany.phone ?? "",
					website: updatedCompany.website ?? "",
					logoUrl: updatedCompany.logoUrl ?? "",
					faviconUrl: updatedCompany.faviconUrl ?? "",
					brandColor: updatedCompany.brandColor ?? "",
					description: updatedCompany.description ?? "",
				});
			}
		} catch (error) {
			// Error is handled by the mutation's onError callback
		}
	};

	if (isLoading) {
		return (
			<Card>
				<div className="flex flex-col gap-6 p-6 md:p-8">
					<div className="flex flex-col gap-1">
						<Skeleton className="h-7 w-40 rounded-md" />
						<Skeleton className="h-4 w-64 rounded-md" />
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<Skeleton className="h-12 rounded-xl" />
						<Skeleton className="h-12 rounded-xl" />
						<Skeleton className="h-12 rounded-xl" />
						<Skeleton className="h-12 rounded-xl" />
					</div>
				</div>
			</Card>
		);
	}

	return (
		<Card>
			<div className="flex flex-col gap-6 p-6 md:p-8">
				<div className="flex flex-col gap-1">
					<h2 className="text-foreground text-xl font-semibold">
						Company Settings
					</h2>
					<p className="text-muted-foreground text-sm">
						Manage your company's basic information.
					</p>
				</div>

				<Form {...form}>
					<form className="flex flex-col gap-8" onSubmit={form.handleSubmit(onSubmit)}>
						<section className="flex flex-col gap-6">
							<header className="flex flex-col gap-1">
								<h3 className="text-foreground text-base font-semibold">
									Basic Information
								</h3>
							</header>

							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Company Name *</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter company name"
													disabled={isUpdating}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="legalName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Legal Name</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter legal name"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="registrationNo"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Registration Number</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter registration number"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
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
												<Input
													placeholder="Enter tax ID"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="industry"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Industry</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter industry"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="employees"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Number of Employees</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="Enter number of employees"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
													onChange={(e) => {
														const value = e.target.value;
														field.onChange(value === "" ? undefined : Number(value));
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</section>

						<section className="flex flex-col gap-6">
							<header className="flex flex-col gap-1">
								<h3 className="text-foreground text-base font-semibold">
									Contact Information
								</h3>
							</header>

							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email *</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="Enter email address"
													disabled={isUpdating}
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
													placeholder="Enter phone number"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
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
										<FormItem className="md:col-span-2">
											<FormLabel>Website</FormLabel>
											<FormControl>
												<Input
													placeholder="https://example.com"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</section>

						<section className="flex flex-col gap-6">
							<header className="flex flex-col gap-1">
								<h3 className="text-foreground text-base font-semibold">Address</h3>
							</header>

							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="streetAddress"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Street Address</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter street address"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="city"
									render={({ field }) => (
										<FormItem>
											<FormLabel>City</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter city"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="zipCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Zip Code</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter zip code"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
												/>
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
											<FormLabel>Country</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter country"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</section>

						<section className="flex flex-col gap-6">
							<header className="flex flex-col gap-1">
								<h3 className="text-foreground text-base font-semibold">
									Branding & Identity
								</h3>
							</header>

							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="logoUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Logo URL</FormLabel>
											<FormControl>
												<Input
													placeholder="https://example.com/logo.png"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormDescription>
												URL address of your company logo
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="faviconUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Favicon URL</FormLabel>
											<FormControl>
												<Input
													placeholder="https://example.com/favicon.ico"
													disabled={isUpdating}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormDescription>
												URL address of your company favicon
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="brandColor"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Brand Color</FormLabel>
											<FormControl>
												<div className="flex gap-2">
													<Input
														placeholder="#FF5733"
														disabled={isUpdating}
														{...field}
														value={field.value ?? ""}
													/>
													{field.value && (
														<div
															className="h-10 w-10 rounded border"
															style={{ backgroundColor: field.value }}
														/>
													)}
												</div>
											</FormControl>
											<FormDescription>HEX color format (e.g. #FF5733)</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Enter a brief company description"
													disabled={isUpdating}
													rows={4}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormDescription>
												Brief description of your company (maximum 500 characters)
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</section>

						<footer className="border-border flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-muted-foreground text-sm">
								Your changes haven't been saved
							</p>
							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
								<Button
									type="button"
									variant="outline"
									disabled={isUpdating}
									onClick={() => form.reset()}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isUpdating}>
									{isUpdating ? "Saving..." : "Save changes"}
								</Button>
							</div>
						</footer>
					</form>
				</Form>
			</div>
		</Card>
	);
}

