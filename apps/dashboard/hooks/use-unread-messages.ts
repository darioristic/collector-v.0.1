"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { fetchConversations } from "@/app/(protected)/apps/chat/api";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * Hook za praćenje ukupnog broja nepročitanih poruka u chatu
 */
export function useUnreadMessages() {
	const { user } = useAuth();
	const pathname = usePathname();
	const isChatPage = pathname?.startsWith("/apps/chat");

	const { data: conversations = [], isLoading } = useQuery({
		queryKey: ["chat", "conversations", "unread"],
		queryFn: fetchConversations,
		refetchInterval: isChatPage ? false : 30000, // Refetch svakih 30 sekundi ako nije na chat stranici
		refetchOnWindowFocus: !isChatPage, // Refetch na focus samo ako nije na chat stranici
		enabled: !!user?.id,
		retry: 1,
		staleTime: isChatPage ? 0 : 10000, // Ne cache-uj ako je na chat stranici
	});

	const totalUnreadCount = conversations.reduce(
		(sum, conv) => sum + (conv.unreadCount || 0),
		0,
	);

	return {
		unreadCount: totalUnreadCount,
		isLoading,
		conversations,
	};
}
