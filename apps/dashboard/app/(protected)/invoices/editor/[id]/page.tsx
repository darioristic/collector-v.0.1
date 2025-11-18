"use client";

import { use } from "react";
import { InvoiceEditorClient } from "@/components/invoices/invoice-editor-client";

export default function InvoiceEditorPage({
    params,
}: {
    params: { id: string };
}) {
    const { id } = params;

	return <InvoiceEditorClient invoiceId={id} />;
}
