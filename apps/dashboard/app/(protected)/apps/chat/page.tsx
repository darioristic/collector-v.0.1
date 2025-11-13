import type { Metadata } from "next";
import { ChatContent } from "@/app/(protected)/apps/chat/components/chat-content";
import { ChatSidebar } from "@/app/(protected)/apps/chat/components/chat-sidebar";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
	return generateMeta({
		title: "Chat - Collector Dashboard",
		description:
			"Pregled privatnih razgovora sa kontaktnim osobama vaše kompanije. Organizujte chat i arhivirajte poruke.",
		canonical: "/apps/chat",
	});
}

export default function ChatPage() {
	return (
		<div className="flex h-[calc(100vh-var(--header-height)-3rem)] w-full flex-col gap-4 lg:flex-row">
			<ChatSidebar />
			<div className="flex-1">
				<ChatContent />
			</div>
		</div>
	);
}
