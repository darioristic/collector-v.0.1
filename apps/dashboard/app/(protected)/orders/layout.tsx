import type { Metadata } from "next";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
	return generateMeta({
		title: "Orders - Collector Dashboard",
		description:
			"Manage and track your orders. View order details, status, and customer information.",
		canonical: "/orders",
	});
}

export default function OrdersLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

