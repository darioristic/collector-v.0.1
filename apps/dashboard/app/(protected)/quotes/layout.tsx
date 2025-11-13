import type { Metadata } from "next";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
	return generateMeta({
		title: "Quotes - Collector Dashboard",
		description:
			"Manage and track your sales quotes across accounts and stakeholders. Create, edit, and monitor quote status.",
		canonical: "/quotes",
	});
}

export default function QuotesLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

