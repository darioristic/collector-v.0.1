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

type CompanyCreationModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCompanyCreated: (company: Account) => void;
	initialName?: string;
};

export function CompanyCreationModal({
	open,
	onOpenChange,
	onCompanyCreated,
	initialName,
}: CompanyCreationModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { toast } = useToast();

	const handleSubmit = async (values: CompanyFormValues): Promise<Account> => {
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
				fetch(getApiUrl("accounts"), {
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				}),
			);

			const result = (await response.json()) as Account;

			// Note: billingEmail and contactPerson are stored in form but not yet in database schema
			// They can be added to database schema in future updates

			toast({
				title: "Company created",
				description: `${result.name} has been added${values.contactPerson?.trim() ? ` with contact ${values.contactPerson.trim()}` : ""}.`,
			});

			onCompanyCreated(result);
			onOpenChange(false);

			return result;
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Failed to create company",
				description:
					error instanceof Error
						? error.message
						: "An error occurred while creating the company.",
			});
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Create Customer</DialogTitle>
					<DialogDescription>
						Enter the customer information to add it to your accounts.
					</DialogDescription>
				</DialogHeader>

				<NewCompanyForm
					onSubmit={handleSubmit}
					onCancel={handleCancel}
					isSubmitting={isSubmitting}
					defaultValues={{ 
						type: "customer",
						name: initialName || "",
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}

