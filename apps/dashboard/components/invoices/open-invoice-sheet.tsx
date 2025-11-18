"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OpenInvoiceSheet() {
	const router = useRouter();

	const handleCreateInvoice = () => {
		router.push("/sales/invoices/new");
	};

	return (
		<Button onClick={handleCreateInvoice} size="sm">
			<Plus className="mr-2 h-4 w-4" />
			New Invoice
		</Button>
	);
}
