"use client";

import type { Invoice } from "@crm/types";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type InvoiceEditorProps = {
	invoice: Invoice;
	onSave?: () => void;
};

/**
 * Invoice Editor Component
 * Placeholder component - will redirect to edit dialog or show edit form
 * For now, shows a message that editing is being implemented
 */
export function InvoiceEditor({ invoice, onSave }: InvoiceEditorProps) {
	const router = useRouter();

	const handleBack = React.useCallback(() => {
		if (onSave) {
			onSave();
		} else {
			router.push("/invoices");
		}
	}, [onSave, router]);

	return (
		<div className="container mx-auto py-8 max-w-4xl">
			<div className="mb-6 flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={handleBack}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="text-3xl font-bold">Edit Invoice</h1>
					<p className="text-muted-foreground mt-1">Invoice #{invoice.invoiceNumber}</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Invoice Editor</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<p className="text-muted-foreground">
							Invoice editor is being implemented. For now, you can use the create invoice
							dialog as a reference.
						</p>
						<div className="pt-4">
							<Button onClick={handleBack}>Back to Invoices</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

