"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { ChevronLeft } from "lucide-react";
import { FormContext } from "./form-context";
import { Form } from "./form";
import { createInvoiceAction } from "@/actions/invoice/create-invoice-action";
import { getDefaultSettings } from "@crm/invoice";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import type { InvoiceFormValues, InvoiceTemplate } from "@/actions/invoice/schema";
import { v4 as uuidv4 } from "uuid";

async function getCustomers(): Promise<Array<{
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
}>> {
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
		return companies.map((company: {
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
		}));
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

export function InvoiceCreatePage() {
	const router = useRouter();
	const [customers, setCustomers] = useState<Array<{
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
	}>>([]);
	const [invoiceNumber, setInvoiceNumber] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);
	const [invoiceId] = useState(() => uuidv4());
	const defaultSettings = getDefaultSettings();

	const createInvoice = useAction(createInvoiceAction, {
		onSuccess: () => {
			toast.success("Invoice created successfully");
			router.push("/sales/invoices");
		},
		onError: ({ error }: { error?: { serverError?: string } }) => {
			toast.error(error?.serverError || "Failed to create invoice");
		},
	});

	useEffect(() => {
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
	}, []);

	const handleSubmit = async (values: InvoiceFormValues) => {
		await createInvoice.execute({ id: invoiceId });
	};

	if (isLoading) {
		return (
			<div className="flex flex-col h-full min-h-[calc(100vh-200px)]">
				<div className="flex items-center gap-4 p-6 border-b">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.back()}
						className="h-9 w-9"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<h1 className="text-2xl font-semibold">Create Invoice</h1>
				</div>
				<div className="flex items-center justify-center flex-1">
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full min-h-[calc(100vh-200px)] bg-background">
			{/* Header */}
			<div className="flex items-center justify-between p-4 md:p-6 border-b bg-background sticky top-0 z-10">
				<div className="flex items-center gap-3 md:gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.back()}
						className="h-9 w-9"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="text-xl md:text-2xl font-semibold">Create Invoice</h1>
						<p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 hidden sm:block">
							Fill in the details to create a new invoice
						</p>
					</div>
				</div>
			</div>

			{/* Form Content */}
			<div className="flex-1 overflow-hidden">
				<FormContext
					id={invoiceId}
					template={{} as InvoiceTemplate}
					invoiceNumber={invoiceNumber}
					defaultSettings={defaultSettings}
					isOpen={true}
				>
					<Form
						teamId="1"
						customers={customers}
						onSubmit={handleSubmit}
						isSubmitting={createInvoice.isExecuting}
					/>
				</FormContext>
			</div>
		</div>
	);
}

