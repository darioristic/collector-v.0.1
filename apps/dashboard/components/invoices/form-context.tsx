"use client";

import type { Settings } from "@crm/invoice";
import { UTCDate } from "@date-fns/utc";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths } from "date-fns";
import { useCallback, useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import {
	type InvoiceFormValues,
	type InvoiceTemplate,
	invoiceFormSchema,
} from "@/actions/invoice/schema";
import { getDraftInvoice } from "@/src/queries/get-draft-invoice";

const defaultTemplate: InvoiceTemplate = {
	customer_label: "To",
	from_label: "From",
	invoice_no_label: "Invoice No",
	issue_date_label: "Issue Date",
	due_date_label: "Due Date",
	description_label: "Description",
	price_label: "Price",
	quantity_label: "Quantity",
	total_label: "Total",
	vat_label: "VAT",
	tax_label: "Sales Tax",
	payment_label: "Payment Details",
	payment_details: undefined,
	note_label: "Note",
	logo_url: undefined,
	currency: "USD",
	from_details: undefined,
	size: "a4",
	include_vat: true,
	date_format: "dd/MM/yyyy",
	include_tax: true,
	tax_rate: 10,
	delivery_type: "create",
};

type FormContextProps = {
	id?: string | null;
	children: React.ReactNode;
	template: InvoiceTemplate;
	invoiceNumber: string;
	defaultSettings: Settings;
	isOpen: boolean;
};

export function FormContext({
	id,
	children,
	template,
	invoiceNumber,
	defaultSettings,
	isOpen,
}: FormContextProps) {
	const defaultValues = useMemo(
		() => ({
			id: uuidv4(),
			template: {
				...defaultTemplate,
				include_tax: defaultSettings.include_tax ?? defaultTemplate.include_tax,
				include_vat: defaultSettings.include_vat ?? defaultTemplate.include_vat,
				// Apply template last to override defaults
				...template,
				// Ensure size is not overwritten if template doesn't have it
				size: template.size ?? defaultSettings.size ?? defaultTemplate.size,
			},
			customer_details: undefined,
			from_details: template.from_details ?? defaultTemplate.from_details,
			payment_details:
				template.payment_details ?? defaultTemplate.payment_details,
			note_details: undefined,
			customer_id: undefined,
			issue_date: new UTCDate(),
			due_date: addMonths(new UTCDate(), 1),
			invoice_number: invoiceNumber,
			line_items: [{ name: "", quantity: 0, price: 0 }],
			tax: undefined,
			token: undefined,
		}),
		[template, invoiceNumber, defaultSettings],
	);

	const form = useForm<InvoiceFormValues>({
		resolver: zodResolver(invoiceFormSchema),
		defaultValues,
	});

	const resetForm = useCallback(() => {
		form.reset({
			...defaultValues,
			template: {
				...defaultValues.template,
				locale: navigator.language,
			},
		});
	}, [form, defaultValues]);

	const { reset } = form;

	useEffect(() => {
		async function fetchInvoice() {
			if (!id) {
				// If no ID, reset form with default values when sheet is opened
				if (isOpen) {
					resetForm();
				}
				return;
			}

			// If we have an ID, try to load draft from database
			const data = await getDraftInvoice(id);

			if (data) {
				// Load draft data from database
				reset(data);
			} else {
				// If no draft exists, reset form with default values
				if (isOpen) {
					resetForm();
				}
			}
		}
		fetchInvoice();
	}, [id, isOpen, reset, resetForm]);

	return <FormProvider {...form}>{children}</FormProvider>;
}
