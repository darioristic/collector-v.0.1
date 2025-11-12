"use client";

import type { ChatConversation } from "@/app/(protected)/apps/chat/api";
import useChatStore from "@/app/(protected)/apps/chat/useChatStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { generateAvatarFallback } from "@/lib/utils";

type ChatUser = ChatConversation["user1"] | ChatConversation["user2"];

export function UserDetailSheet({ user }: { user: ChatUser }) {
	const { showProfileSheet, toggleProfileSheet } = useChatStore();
	const displayName =
		user.displayName?.trim() ||
		[user.firstName, user.lastName].filter(Boolean).join(" ") ||
		user.email;

	return (
		<Sheet open={showProfileSheet} onOpenChange={toggleProfileSheet}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle className="text-2xl">Profile</SheetTitle>
				</SheetHeader>
				<div className="overflow-y-auto px-4">
					<div className="my-4 flex flex-col items-center justify-end">
						<Avatar className="mb-4 size-32">
							<AvatarImage
								src={user.avatarUrl || undefined}
								alt="avatar image"
							/>
							<AvatarFallback>
								{generateAvatarFallback(displayName)}
							</AvatarFallback>
						</Avatar>
						<h4 className="mb-2 text-xl font-semibold">{displayName}</h4>
						<div className="text-xs">
							Status:{" "}
							{user.status === "online" ? (
								<span className="text-green-500">Online</span>
							) : (
								<span className="text-muted-foreground">Offline</span>
							)}
						</div>
					</div>
					<div className="space-y-2 divide-y">
						<div className="space-y-3 py-4">
							<h5 className="text-xs font-semibold uppercase">Email</h5>
							<div className="text-muted-foreground">{user.email}</div>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
