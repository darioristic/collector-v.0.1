import type { Deal } from "@/lib/db/schema/deals";

import { generateMeta } from "@/lib/utils";
import { fetchDealMetadata, fetchDeals } from "./actions";
import DealsPageClient from "./deals-page-client";

export async function generateMetadata() {
	return generateMeta({
		title: "Deals - Collector Dashboard",
		description: "Manage your sales pipeline and track deal progress.",
		canonical: "/crm/deals",
	});
}

export default async function DealsPage() {
	let deals: Deal[] = [];
	let owners: string[] = [];
	let stageSummary: Awaited<ReturnType<typeof fetchDealMetadata>>["stages"] =
		[];
	let error: string | null = null;

	try {
		const [loadedDeals, metadata] = await Promise.all([
			fetchDeals(),
			fetchDealMetadata(),
		]);
		deals = loadedDeals;
		owners = metadata.owners;
		stageSummary = metadata.stages;
	} catch (err) {
		error = err instanceof Error ? err.message : "Failed to load deals.";
	}

	return (
		<DealsPageClient
			initialDeals={deals}
			owners={owners}
			stageSummary={stageSummary}
			error={error}
		/>
	);
}
