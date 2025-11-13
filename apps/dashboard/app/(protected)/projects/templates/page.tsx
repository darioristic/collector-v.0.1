import type { Metadata } from "next";

import { generateMeta } from "@/lib/utils";

import { TemplatesPageClient } from "./templates-page-client";

export async function generateMetadata(): Promise<Metadata> {
	return generateMeta({
		title: "Project Templates - Collector Dashboard",
		description:
			"Browse and use predefined project templates to quickly create new projects with pre-configured phases and tasks. Built with Next.js 14, shadcn/ui, Tailwind CSS.",
		canonical: "/projects/templates",
	});
}

export default function TemplatesPage() {
	return <TemplatesPageClient />;
}

