"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useInvoice } from "@/src/hooks/useInvoices";
import { InvoiceEditor } from "./invoice-editor";

type InvoiceEditorClientProps = {
	invoiceId: string;
};

export function InvoiceEditorClient({ invoiceId }: InvoiceEditorClientProps) {
	const router = useRouter();
	const { data: invoice, isLoading, error } = useInvoice(invoiceId);

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex h-64 items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					<p className="ml-4 text-muted-foreground text-sm">
						Loading invoice...
					</p>
				</CardContent>
			</Card>
		);
	}

	if (error || !invoice) {
		return (
			<Card>
				<CardContent className="flex h-64 flex-col items-center justify-center">
					<p className="text-destructive text-sm">
						{error instanceof Error ? error.message : "Invoice not found"}
					</p>
					<button
						type="button"
						onClick={() => router.push("/invoices")}
						className="mt-4 text-sm text-primary hover:underline"
					>
						Back to Invoices
					</button>
				</CardContent>
			</Card>
		);
	}

	return (
		<InvoiceEditor
			invoice={invoice}
			onCancel={() => router.push("/invoices")}
			onSaved={() => {
				// Don't redirect automatically - user can continue editing or go back manually
			}}
		/>
	);
}
