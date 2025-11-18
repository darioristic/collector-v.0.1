import type { Metadata } from "next";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
	return generateMeta({
		title: "Sales Orders - Collector Dashboard",
		description:
			"Manage and track your sales orders. View order details, status, and customer information.",
		canonical: "/sales/orders",
	});
}

export default function SalesOrdersLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
