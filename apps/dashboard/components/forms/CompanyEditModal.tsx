"use client";

import { useState } from "react";
import type { Account } from "@crm/types";
import { ensureResponse, getApiUrl } from "@/src/lib/fetch-utils";
import { useToast } from "@/hooks/use-toast";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { NewCompanyForm, type CompanyFormValues } from "./NewCompanyForm";

type CompanyEditModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCompanyUpdated: (company: Account) => void;
	company: Account | null;
};

export function CompanyEditModal({
	open,
	onOpenChange,
	onCompanyUpdated,
	company,
}: CompanyEditModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { toast } = useToast();

	const handleSubmit = async (values: CompanyFormValues): Promise<Account> => {
		if (!company) {
			throw new Error("Company is required");
		}

		setIsSubmitting(true);
		try {
			const payload = {
				name: values.name.trim(),
				email: values.email.trim(),
				phone: values.phone?.trim() ? values.phone.trim() : undefined,
				website: values.website?.trim() ? values.website.trim() : undefined,
				type: values.type,
				taxId: values.taxId.trim(),
				country: values.country.trim().toUpperCase(),
			};

			const response = await ensureResponse(
				fetch(getApiUrl(`accounts/${company.id}`), {
					method: "PUT",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				}),
			);

			const result = (await response.json()) as Account;

			toast({
				title: "Company updated",
				description: `${result.name} has been updated successfully.`,
			});

			onCompanyUpdated(result);
			onOpenChange(false);

			return result;
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Failed to update company",
				description:
					error instanceof Error
						? error.message
						: "An error occurred while updating the company.",
			});
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	if (!company) {
		return null;
	}

	return (
		<Dialog open={open && !!company} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Edit Company</DialogTitle>
					<DialogDescription>
						Update the company information below.
					</DialogDescription>
				</DialogHeader>

				<NewCompanyForm
					onSubmit={handleSubmit}
					onCancel={handleCancel}
					isSubmitting={isSubmitting}
					mode="edit"
					defaultValues={{
						name: company.name || "",
						email: company.email || "",
						phone: company.phone || "",
						website: company.website || "",
						type: company.type || "customer",
						taxId: company.taxId || "",
						country: company.country || "RS",
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}

