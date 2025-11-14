import { promises as fs } from "fs";
import path from "path";
import ApiCallsCard from "@/app/(protected)/apps/api-keys/api-calls-card";
import { TablePageHeader } from "@/components/ui/page-header";
import { generateMeta } from "@/lib/utils";
import ApiKeysDataTable from "./datatable";
import FailedConversionsCard from "./failed-conversions-card";
import SuccessfulConversionsCard from "./successful-conversions-card";
import UpgradePlanCard from "./upgrade-plan-card";

export async function generateMetadata() {
	return generateMeta({
		title: "API Keys - Collector Dashboard",
		description:
			"A template for listing and managing your API keys. Easily create, organize and control the API keys you use in your projects. Built with shadcn/ui.",
		canonical: "/apps/api-keys",
	});
}

async function getApiKeys() {
	const data = await fs.readFile(
		path.join(process.cwd(), "app/(protected)/apps/api-keys/data.json"),
	);
	return JSON.parse(data.toString());
}

export default async function Page() {
	const apiKeys = await getApiKeys();

	return (
		<div className="space-y-8">
			<TablePageHeader
				title="Api Keys Management"
				description="Manage and secure your API keys for external integrations."
			/>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<UpgradePlanCard />
				<SuccessfulConversionsCard />
				<FailedConversionsCard />
				<ApiCallsCard />
			</div>
			<ApiKeysDataTable data={apiKeys} />
		</div>
	);
}
