import type { Metadata } from "next";

import { generateMeta } from "@/lib/utils";

import { ProjectsPageClient } from "./projects-page-client";

export async function generateMetadata(): Promise<Metadata> {
	return generateMeta({
		title: "Project List",
		description:
			"Pregled aktivnih projekata sa ključnim metrikama i statusima. Izgrađeno korišćenjem Next.js 14, shadcn/ui, Tailwind CSS i React Query.",
		canonical: "/project-list",
	});
}

export default function ProjectListPage() {
	return <ProjectsPageClient />;
}
