import type { Metadata } from "next";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
	return generateMeta({
		title: "Login - Collector Dashboard",
		description:
			"Sign in to your Collector Dashboard account to access your dashboard, manage your business, and track your performance.",
		canonical: "/auth/login",
	});
}

export default function LoginLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
