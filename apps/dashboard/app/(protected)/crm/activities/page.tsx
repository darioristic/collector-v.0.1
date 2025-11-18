import { generateMeta } from "@/lib/utils";
import { ClientActivitiesPageClient } from "./client-activities-page-client";
import { fetchClientActivities, fetchClientActivityMetadata } from "./data";

export async function generateMetadata() {
	return generateMeta({
		title: "Activities - Collector Dashboard",
		description:
			"Manage and track client activities, meetings, and tasks in the CRM module.",
		canonical: "/crm/activities",
	});
}

export default async function ClientActivitiesPage() {
	const [activities, metadata] = await Promise.all([
		fetchClientActivities(),
		fetchClientActivityMetadata(),
	]);

	return (
		<ClientActivitiesPageClient
			initialActivities={activities}
			clients={metadata.clients}
			assignees={metadata.assignees}
		/>
	);
}
