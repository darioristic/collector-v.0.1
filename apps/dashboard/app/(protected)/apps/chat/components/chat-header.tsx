"use client";

import { ArrowLeft, Ellipsis } from "lucide-react";
import React from "react";
import type { ChatConversation } from "@/app/(protected)/apps/chat/api";
import { CallDialog } from "@/app/(protected)/apps/chat/components/call-dialog";
import { ChatUserDropdown } from "@/app/(protected)/apps/chat/components/chat-list-item-dropdown";
import { VideoCallDialog } from "@/app/(protected)/apps/chat/components/video-call-dialog";
import useChatStore from "@/app/(protected)/apps/chat/useChatStore";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	AvatarIndicator,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { generateAvatarFallback } from "@/lib/utils";
import { useChatSocket } from "@/hooks/use-chat-socket";

type ChatUser = ChatConversation["user1"] | ChatConversation["user2"];

export function ChatHeader({ user }: { user: ChatUser }) {
	const { setSelectedChat } = useChatStore();
	const { getUserStatus } = useChatSocket();
	
	// Get real-time status from socket, fallback to user.status from API
	const realTimeStatus = getUserStatus(user.id);
	// If real-time status is available, use it; otherwise check API status
	// Default to "online" if status is "online" in API, otherwise "offline"
	const userStatus = realTimeStatus || (user.status === "online" ? "online" : "offline");
	
	// Debug logging
	if (process.env.NODE_ENV === "development") {
		console.log("[ChatHeader] Status check:", {
			userId: user.id,
			realTimeStatus,
			apiStatus: user.status,
			finalStatus: userStatus,
		});
	}
	
	const displayName =
		user.displayName?.trim() ||
		[user.firstName, user.lastName].filter(Boolean).join(" ") ||
		user.email;
	const onlineStatus = userStatus === "online" ? "success" : "warning";

	return (
		<div className="flex justify-between gap-4 lg:px-4">
			<div className="flex gap-4">
				<Button
					size="sm"
					variant="outline"
					className="flex size-10 p-0 lg:hidden"
					onClick={() => setSelectedChat(null)}
				>
					<ArrowLeft />
				</Button>
				<Avatar className="overflow-visible lg:size-10">
					<AvatarImage src={user.avatarUrl || undefined} alt="avatar image" />
					<AvatarIndicator variant={onlineStatus} />
					<AvatarFallback>{generateAvatarFallback(displayName)}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col gap-1">
					<span className="text-sm font-semibold">{displayName}</span>
					{userStatus === "online" ? (
						<span className="text-xs text-green-500">Online</span>
					) : (
						<span className="text-muted-foreground text-xs">Offline</span>
					)}
				</div>
			</div>
			<div className="flex gap-2">
				<div className="hidden lg:flex lg:gap-2">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<div>
									<VideoCallDialog />
								</div>
							</TooltipTrigger>
							<TooltipContent side="bottom">Start Video Chat</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<div>
									<CallDialog />
								</div>
							</TooltipTrigger>
							<TooltipContent side="bottom">Start Call</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<ChatUserDropdown>
					<Button size="icon" variant="ghost">
						<Ellipsis />
					</Button>
				</ChatUserDropdown>
			</div>
		</div>
	);
}
