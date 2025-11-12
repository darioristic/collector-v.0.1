import { Ellipsis } from "lucide-react";
import { ChatUserDropdown } from "@/app/(protected)/apps/chat/components/chat-list-item-dropdown";
import { MessageStatusIcon } from "@/app/(protected)/apps/chat/components/message-status-icon";
import { useAuth } from "@/components/providers/auth-provider";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	AvatarIndicator,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, generateAvatarFallback } from "@/lib/utils";
import type { ChatConversation } from "../api";
import type { ChatItem } from "../useChatStore";
import useChatStore from "../useChatStore";

type ChatListItemProps = {
	id: string;
	conversationId: string;
	user: {
		id: string;
		name: string;
		avatar?: string;
		online_status?: "success" | "warning" | "danger";
		last_seen?: string;
	};
	date: string;
	last_message: string;
	status: "sent" | "forwarded" | "read";
	otherUser: ChatConversation["user1"] | ChatConversation["user2"];
	conversation: ChatConversation;
};

export function ChatListItem({
	chat,
	active,
}: {
	chat: ChatListItemProps;
	active: boolean | null;
}) {
	const { setSelectedChat } = useChatStore();
	const { user } = useAuth();
	const currentUserId = user?.id;

	const handleClick = () => {
		if (!currentUserId) {
			return;
		}
		const otherUser =
			chat.conversation.userId1 === currentUserId
				? chat.conversation.user2
				: chat.conversation.user1;

		setSelectedChat({
			...chat.conversation,
			conversationId: chat.conversation.id,
			otherUser,
			messages: [],
		} as ChatItem);
	};

	return (
		<div
			className={cn(
				"group/item hover:bg-muted relative flex min-w-0 cursor-pointer items-center gap-4 px-6 py-4",
				{ "dark:bg-muted! bg-gray-200!": active },
			)}
			onClick={handleClick}
		>
			<Avatar className="overflow-visible md:size-10">
				<AvatarImage src={chat.user?.avatar} alt="avatar image" />
				<AvatarIndicator variant={chat.user?.online_status || "warning"} />
				<AvatarFallback>
					{generateAvatarFallback(chat.user?.name)}
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 grow">
				<div className="flex items-center justify-between">
					<span className="truncate text-sm font-medium">
						{chat.user?.name}
					</span>
					<span className="text-muted-foreground flex-none text-xs">
						{chat.date}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<MessageStatusIcon status={chat.status} />
					<span className="text-muted-foreground truncate text-start text-sm">
						{chat.last_message}
					</span>
				</div>
			</div>
			<div
				className={cn(
					"absolute end-0 top-0 bottom-0 flex items-center bg-linear-to-l from-50% px-4 opacity-0 group-hover/item:opacity-100",
					{ "from-muted": !active },
					{ "dark:from-muted from-gray-200": active },
				)}
			>
				<ChatUserDropdown>
					<Button size="icon" variant="outline" className="rounded-full">
						<Ellipsis />
					</Button>
				</ChatUserDropdown>
			</div>
		</div>
	);
}
