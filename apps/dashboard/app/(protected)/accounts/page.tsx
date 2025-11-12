import { redirect } from "next/navigation";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
	return generateMeta({
		title: "Accounts",
		description: "Browse contacts and companies within your CRM accounts.",
		canonical: "/accounts/companies",
	});
}

export default function AccountsPage() {
	redirect("/accounts/companies");
}
