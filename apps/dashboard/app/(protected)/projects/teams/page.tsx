import { generateMeta } from "@/lib/utils";
import { TeamsPageClient } from "./teams-page-client";

export async function generateMetadata() {
	return generateMeta({
		title: "Project Teams - Collector Dashboard",
		description: "Upravljajte timovima projekata i njihovim ciljevima.",
		canonical: "/projects/teams",
	});
}

export default function ProjectTeamsPage() {
	return <TeamsPageClient />;
}
