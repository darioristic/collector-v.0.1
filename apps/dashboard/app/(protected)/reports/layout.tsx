import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
	return generateMeta({
		title: "Reports & Analytics - Collector Dashboard",
		description:
			"Comprehensive reports and analytics for Sales, CRM, HR, Projects, and Finance modules.",
		canonical: "/reports",
	});
}

export default function ReportsLayout({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
