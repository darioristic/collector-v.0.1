"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import type { ChatMessage } from "@/app/(protected)/apps/chat/api";
import { fetchConversationMessages } from "@/app/(protected)/apps/chat/api";
import { ChatBubble } from "@/app/(protected)/apps/chat/components/chat-bubbles";
import { ChatFooter } from "@/app/(protected)/apps/chat/components/chat-footer";
import { ChatHeader } from "@/app/(protected)/apps/chat/components/chat-header";
import { UserDetailSheet } from "@/app/(protected)/apps/chat/components/user-detail-sheet";
import useChatStore from "@/app/(protected)/apps/chat/useChatStore";
import { useAuth } from "@/components/providers/auth-provider";
import { useChatSocket } from "@/hooks/use-chat-socket";

export function ChatContent() {
	const { selectedChat, setSelectedChat, setMessages, addMessage } = useChatStore();
	const { user } = useAuth();
	const messagesContainerRef = useRef<HTMLDivElement | null>(null);
	const { isConnected, joinConversation, leaveConversation, onNewMessage, onConversationUpdate } = useChatSocket();
	const queryClient = useQueryClient();
	const currentUserId = user?.id;

	// Determine otherUser - use existing otherUser or calculate from user1/user2
	// This must be called BEFORE any conditional returns to maintain hook order
	const otherUser = React.useMemo(() => {
		if (!selectedChat) {
			return null;
		}

		if (selectedChat.otherUser) {
			return selectedChat.otherUser;
		}

		// Fallback: determine otherUser from user1 and user2
		if (selectedChat.user1 && selectedChat.user2 && currentUserId) {
			const fallbackOtherUser =
				selectedChat.userId1 === currentUserId ? selectedChat.user2 : selectedChat.user1;
			if (fallbackOtherUser) {
				console.log("[chat-content] Using fallback otherUser:", {
					conversationId: selectedChat.conversationId,
					fallbackOtherUserId: fallbackOtherUser.id,
					fallbackOtherUserEmail: fallbackOtherUser.email,
				});
				return fallbackOtherUser;
			}
		}

		return null;
	}, [selectedChat, currentUserId]);

	// Log whenever selectedChat changes
	useEffect(() => {
		console.log("[chat-content] selectedChat changed:", {
			hasSelectedChat: !!selectedChat,
			conversationId: selectedChat?.conversationId,
			hasOtherUser: !!selectedChat?.otherUser,
			otherUserId: selectedChat?.otherUser?.id,
			selectedChat
		});
	}, [selectedChat]);

	const messagesQuery = useQuery({
		queryKey: ["chat", "messages", selectedChat?.conversationId],
		queryFn: async () => {
			if (!selectedChat?.conversationId) {
				return [];
			}
			return fetchConversationMessages(selectedChat.conversationId, 50);
		},
		enabled: Boolean(selectedChat?.conversationId),
		refetchOnWindowFocus: false,
		retry: 1,
	});

	useEffect(() => {
		if (messagesQuery.data && selectedChat?.conversationId) {
			setMessages(selectedChat.conversationId, messagesQuery.data);
		}
	}, [messagesQuery.data, selectedChat?.conversationId, setMessages]);

	useEffect(() => {
		if (messagesContainerRef.current && messagesQuery.data && messagesQuery.data.length > 0) {
			// Use setTimeout to ensure DOM is updated
			setTimeout(() => {
				if (messagesContainerRef.current) {
					messagesContainerRef.current.scrollIntoView({
						behavior: "smooth",
						block: "end",
					});
				}
			}, 100);
		}
	}, [messagesQuery.data]);

	// Join conversation room when chat is selected
	useEffect(() => {
		if (!selectedChat?.conversationId || !isConnected) {
			console.log("[chat-content] Not joining conversation:", {
				hasConversationId: !!selectedChat?.conversationId,
				isConnected,
			});
			return;
		}

		console.log("[chat-content] Joining conversation:", selectedChat.conversationId);
		joinConversation(selectedChat.conversationId);

		return () => {
			console.log("[chat-content] Leaving conversation:", selectedChat.conversationId);
			leaveConversation(selectedChat.conversationId);
		};
	}, [selectedChat?.conversationId, isConnected, joinConversation, leaveConversation]);

	// Global Socket.IO event listeners
	useEffect(() => {
		// Handle new messages for current conversation
		const unsubscribeMessage = onNewMessage((payload) => {
			console.log("[chat-content] New message from socket:", payload);

			// Always invalidate conversations query to update sidebar
			queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });

			// If message is for currently selected conversation, add it to store
			if (selectedChat?.conversationId === payload.conversationId) {
				console.log("[chat-content] Adding message to current conversation");
				addMessage(payload.message);

				// Scroll to bottom
				setTimeout(() => {
					const container = messagesContainerRef.current?.parentElement;
					if (container) {
						container.scrollTop = container.scrollHeight;
					}
				}, 100);
			}
		});

		// Handle conversation updates
		const unsubscribeUpdate = onConversationUpdate((payload) => {
			console.log("[chat-content] Conversation updated from socket:", payload);

			// Invalidate conversations list
			queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });

			// If it's current conversation, invalidate messages query
			if (selectedChat?.conversationId === payload.conversationId) {
				queryClient.invalidateQueries({
					queryKey: ["chat", "messages", payload.conversationId]
				});
			}
		});

		return () => {
			unsubscribeMessage();
			unsubscribeUpdate();
		};
	}, [onNewMessage, onConversationUpdate, queryClient, selectedChat?.conversationId, addMessage]);

	// Fix missing otherUser in store if it's not set but we can determine it
	useEffect(() => {
		if (
			selectedChat &&
			selectedChat.conversationId &&
			!selectedChat.otherUser &&
			otherUser
		) {
			console.log("[chat-content] Updating selectedChat with otherUser:", {
				conversationId: selectedChat.conversationId,
				otherUserId: otherUser.id,
			});
			setSelectedChat({
				...selectedChat,
				otherUser,
			});
		}
	}, [selectedChat, otherUser, setSelectedChat]);

	// Now we can safely return early after all hooks are called
	if (!selectedChat) {
		return (
			<figure className="hidden h-full items-center justify-center text-center lg:flex">
				<Image
					width={200}
					height={200}
					className="block max-w-sm dark:hidden"
					src={`/not-selected-chat.svg`}
					alt="shadcn/ui"
					unoptimized
				/>
				<Image
					width={200}
					height={200}
					className="hidden max-w-sm dark:block"
					src={`/not-selected-chat-light.svg`}
					alt="shadcn/ui"
				/>
			</figure>
		);
	}

	if (!selectedChat.conversationId) {
		console.error("[chat-content] Selected chat missing conversationId:", selectedChat);
		return (
			<figure className="hidden h-full items-center justify-center text-center lg:flex">
				<div className="text-destructive text-center">
					<p className="mb-2 text-sm font-medium">Greška pri učitavanju konverzacije</p>
					<p className="text-xs">Nedostaje ID konverzacije.</p>
				</div>
			</figure>
		);
	}

	const messages = selectedChat.messages || messagesQuery.data || [];

	if (!otherUser) {
		console.error("[chat-content] Cannot determine otherUser:", {
			conversationId: selectedChat.conversationId,
			hasOtherUser: !!selectedChat.otherUser,
			hasUser1: !!selectedChat.user1,
			hasUser2: !!selectedChat.user2,
			currentUserId,
			selectedChat,
		});
		return (
			<figure className="hidden h-full items-center justify-center text-center lg:flex">
				<div className="text-destructive text-center">
					<p className="mb-2 text-sm font-medium">Greška pri učitavanju konverzacije</p>
					<p className="text-xs">Nedostaju podaci o korisniku.</p>
				</div>
			</figure>
		);
	}

	console.log("[chat-content] Rendering chat content:", {
		conversationId: selectedChat.conversationId,
		otherUserId: otherUser.id,
		otherUserEmail: otherUser.email,
		hasMessages: messages.length > 0,
		messagesCount: messages.length,
	});

	return (
		<div className="bg-background fixed inset-0 z-50 flex h-full flex-col p-4 lg:relative lg:z-10 lg:bg-transparent lg:p-0">
			<ChatHeader user={otherUser} />

			<div className="flex-1 overflow-y-auto lg:px-4">
				<div ref={messagesContainerRef}>
					<div className="flex flex-col items-start space-y-10 py-8">
						{messagesQuery.isLoading && (
							<div className="text-muted-foreground w-full text-center text-sm">
								Učitavanje poruka...
							</div>
						)}
						{messagesQuery.isError && (
							<div className="text-destructive w-full text-center text-sm">
								Greška pri učitavanju poruka.
							</div>
						)}
						{messages.length > 0 &&
							messages.map((message: ChatMessage) => {
								const ownMessage = message.senderId === currentUserId;
								return (
									<ChatBubble
										key={message.id}
										message={{
											id: parseInt(message.id) || 0,
											content: message.content || undefined,
											type: message.type as string,
											own_message: ownMessage,
											read: message.status === "read",
											data: message.fileUrl
												? ({
														file_name: message.fileMetadata || undefined,
														path: message.fileUrl,
														images:
															message.type === "image"
																? [message.fileUrl]
																: undefined,
														cover:
															message.type === "video"
																? message.fileUrl
																: undefined,
													} as any)
												: undefined,
										}}
										type={message.type}
										createdAt={message.createdAt}
									/>
								);
							})}
					</div>
				</div>
			</div>

			<ChatFooter />

			<UserDetailSheet user={otherUser} />
		</div>
	);
}
