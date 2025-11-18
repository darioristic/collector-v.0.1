"use client";

import { getDefaultSettings } from "@crm/invoice";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { createInvoiceAction } from "@/actions/invoice/create-invoice-action";
import type {
	InvoiceFormValues,
	InvoiceTemplate,
} from "@/actions/invoice/schema";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Form } from "./form";
import { FormContext } from "./form-context";

type InvoiceCreateSheetProps = {
	open: boolean;
	onClose?: () => void;
	context?: "offer" | "invoice";
};

async function getCustomers(): Promise<
	Array<{
		id: string;
		name: string;
		email: string;
		token: string;
		phone?: string;
		address_line_1?: string;
		address_line_2?: string;
		city?: string;
		state?: string;
		zip?: string;
		country?: string;
		vat?: string;
	}>
> {
	try {
		const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
		const response = await fetch(`${API_URL}/api/accounts/companies`, {
			cache: "no-store",
		});

		if (!response.ok) {
			return [];
		}

		const data = await response.json();
		const companies = data.data || [];

		// Transform to Customer format
		return companies.map(
			(company: {
				id?: string;
				name?: string;
				email?: string;
				phone?: string;
				address_line_1?: string;
				address_line_2?: string;
				city?: string;
				state?: string;
				zip?: string;
				country?: string;
				vat?: string;
			}) => ({
				id: company.id || "",
				name: company.name || "",
				email: company.email || "",
				token: company.id || "",
				phone: company.phone,
				address_line_1: company.address_line_1,
				address_line_2: company.address_line_2,
				city: company.city,
				state: company.state,
				zip: company.zip,
				country: company.country,
				vat: company.vat,
			}),
		);
	} catch (error) {
		console.error("Failed to fetch customers:", error);
		return [];
	}
}

async function getNextInvoiceNumber(): Promise<string> {
	try {
		const response = await fetch("/api/invoices/next-number", {
			cache: "no-store",
		});

		if (!response.ok) {
			// Fallback to timestamp-based number
			return `INV-${Date.now()}`;
		}

		const data = await response.json();
		return data.number || `INV-${Date.now()}`;
	} catch (error) {
		console.error("Failed to fetch invoice number:", error);
		return `INV-${Date.now()}`;
	}
}

export function InvoiceCreateSheet({
	open,
	onClose,
	context = "invoice",
}: InvoiceCreateSheetProps) {
	const router = useRouter();
	const [customers, setCustomers] = useState<
		Array<{
			id: string;
			name: string;
			email: string;
			token: string;
			phone?: string;
			address_line_1?: string;
			address_line_2?: string;
			city?: string;
			state?: string;
			zip?: string;
			country?: string;
			vat?: string;
		}>
	>([]);
	const [invoiceNumber, setInvoiceNumber] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);
	const { invoiceId: paramsInvoiceId } = useInvoiceParams();
	// Use invoiceId from params if editing, otherwise generate new one
	const [invoiceId] = useState(() => paramsInvoiceId || uuidv4());
	const defaultSettings = getDefaultSettings();

	const createInvoice = useAction(createInvoiceAction, {
		onSuccess: () => {
			toast.success(
				context === "offer"
					? "Quote created successfully"
					: "Invoice created successfully",
			);
			handleClose();
			router.refresh();
		},
		onError: ({ error }: { error?: { serverError?: string } }) => {
			toast.error(error?.serverError || "Failed to create invoice");
		},
	});

	useEffect(() => {
		if (open) {
			async function loadData() {
				setIsLoading(true);
				const [customersData, number] = await Promise.all([
					getCustomers(),
					getNextInvoiceNumber(),
				]);
				setCustomers(customersData);
				setInvoiceNumber(number);
				setIsLoading(false);
			}
			loadData();
		}
	}, [open]);

	const handleClose = () => {
		if (onClose) {
			onClose();
		} else {
			router.back();
		}
	};

	const handleSubmit = async (_values: InvoiceFormValues) => {
		await createInvoice.execute({ id: invoiceId });
	};

	if (isLoading) {
		return (
			<Sheet open={open} onOpenChange={handleClose}>
				<SheetContent side="right" className="w-full sm:max-w-4xl">
					<SheetHeader>
						<SheetTitle>
							{context === "offer" ? "Create Quote" : "Create Invoice"}
						</SheetTitle>
					</SheetHeader>
					<div className="flex items-center justify-center h-96">
						<p className="text-muted-foreground">Loading...</p>
					</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Sheet open={open} onOpenChange={handleClose}>
			<SheetContent side="right" className="w-full sm:max-w-4xl p-0">
				<FormContext
					id={invoiceId}
					template={{} as InvoiceTemplate}
					invoiceNumber={invoiceNumber}
					defaultSettings={defaultSettings}
					isOpen={open}
				>
					<div className="h-full flex flex-col">
						<SheetHeader className="px-6 pt-6 pb-4 border-b">
							<SheetTitle>
								{context === "offer" ? "Create Quote" : "Create Invoice"}
							</SheetTitle>
						</SheetHeader>
						<div className="flex-1 overflow-hidden">
							<Form
								teamId="1"
								customers={customers}
								onSubmit={handleSubmit}
								isSubmitting={createInvoice.isExecuting}
							/>
						</div>
					</div>
				</FormContext>
			</SheetContent>
		</Sheet>
	);
}
