import type { Metadata } from "next";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
	return generateMeta({
		title: "Invoices - Collector Dashboard",
		description:
			"Manage and track your invoices. Create, view, and monitor invoice status and payments.",
		canonical: "/invoices",
	});
}

export default function InvoicesLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

