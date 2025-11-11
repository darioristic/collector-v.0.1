import { ClientActivitiesPageClient } from "./client-activities-page-client";
import { fetchClientActivities, fetchClientActivityMetadata } from "./data";

export default async function ClientActivitiesPage() {
  const [activities, metadata] = await Promise.all([
    fetchClientActivities(),
    fetchClientActivityMetadata()
  ]);

  return (
    <ClientActivitiesPageClient
      initialActivities={activities}
      clients={metadata.clients}
      assignees={metadata.assignees}
    />
  );
}

