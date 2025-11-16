"use client";

import { use } from "react";
import { InvoiceEditorClient } from "@/components/invoices/invoice-editor-client";

export default function InvoiceEditorPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);

	return <InvoiceEditorClient invoiceId={id} />;
}

