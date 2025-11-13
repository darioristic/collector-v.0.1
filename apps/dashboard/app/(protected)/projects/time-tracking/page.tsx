import { generateMeta } from "@/lib/utils";
import { TimeTrackingPageClient } from "./time-tracking-page-client";

export async function generateMetadata() {
	return generateMeta({
		title: "Time Tracking - Collector Dashboard",
		description: "Pratite utrošak sati na projektima.",
		canonical: "/projects/time-tracking",
	});
}

export default function TimeTrackingPage() {
	return <TimeTrackingPageClient />;
}

