"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/app/(protected)/apps/chat/api";
import {
	fetchConversationMessages,
	markConversationAsRead,
} from "@/app/(protected)/apps/chat/api";
import { ChatBubble } from "@/app/(protected)/apps/chat/components/chat-bubbles";
import { ChatFooter } from "@/app/(protected)/apps/chat/components/chat-footer";
import { ChatHeader } from "@/app/(protected)/apps/chat/components/chat-header";
import { UserDetailSheet } from "@/app/(protected)/apps/chat/components/user-detail-sheet";
import useChatStore from "@/app/(protected)/apps/chat/useChatStore";
import { useAuth } from "@/components/providers/auth-provider";
import { useChatSocket } from "@/hooks/use-chat-socket";

export function ChatContent() {
	const { selectedChat, setSelectedChat, addMessage } = useChatStore();
	const { user } = useAuth();
	const messagesContainerRef = useRef<HTMLDivElement | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const {
		isConnected,
		joinConversation,
		leaveConversation,
		onNewMessage,
		onConversationUpdate,
		onTyping,
	} = useChatSocket();
	const queryClient = useQueryClient();
	const currentUserId = user?.id;
	const currentUserEmail = user?.email?.toLowerCase() || null;
	const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

	// Determine otherUser - use existing otherUser or calculate from user1/user2
	// This must be called BEFORE any conditional returns to maintain hook order
	const otherUser = React.useMemo(() => {
		if (!selectedChat) return null;
		if (selectedChat.otherUser) return selectedChat.otherUser;
		if (selectedChat.user1 && selectedChat.user2 && currentUserEmail) {
			const u1Email = selectedChat.user1.email?.toLowerCase() || null;
			const u2Email = selectedChat.user2.email?.toLowerCase() || null;
			if (u1Email === currentUserEmail) return selectedChat.user2;
			if (u2Email === currentUserEmail) return selectedChat.user1;
		}
		return null;
	}, [selectedChat, currentUserEmail]);

	const myTeamchatUserId = React.useMemo(() => {
		if (!selectedChat?.user1 || !selectedChat?.user2 || !currentUserEmail)
			return null;
		const u1Email = selectedChat.user1.email?.toLowerCase() || null;
		const u2Email = selectedChat.user2.email?.toLowerCase() || null;
		if (u1Email === currentUserEmail) return selectedChat.user1.id;
		if (u2Email === currentUserEmail) return selectedChat.user2.id;
		return null;
	}, [selectedChat, currentUserEmail]);

	const myComparableUserId = React.useMemo(() => {
		const teamchatId = myTeamchatUserId ? String(myTeamchatUserId).trim() : "";
		const userIdStr = currentUserId ? String(currentUserId).trim() : "";
		return teamchatId || userIdStr || "";
	}, [myTeamchatUserId, currentUserId]);

	const myTeamchatUserIdRef = useRef<string | null>(null);
	useEffect(() => {
		myTeamchatUserIdRef.current = myComparableUserId || null;
	}, [myComparableUserId]);

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

	// Helper function to scroll to bottom
	const scrollToBottom = React.useCallback((smooth = true) => {
		if (scrollContainerRef.current) {
			const scrollOptions: ScrollToOptions = {
				top: scrollContainerRef.current.scrollHeight,
				behavior: smooth ? "smooth" : "auto",
			};
			scrollContainerRef.current.scrollTo(scrollOptions);
		}
	}, []);

	// Don't sync query messages to store - let them be combined only for display
	// This prevents refetching and overwriting store messages which causes flickering

	const storedMessagesCount = selectedChat?.messages?.length ?? 0;

	// Auto-scroll when messages load or change
	useEffect(() => {
		if (messagesQuery.data && messagesQuery.data.length > 0) {
			// Scroll instantly on initial load, smooth on updates
			const isInitialLoad = storedMessagesCount === 0;
			setTimeout(() => scrollToBottom(!isInitialLoad), 100);
		}
	}, [messagesQuery.data, scrollToBottom, storedMessagesCount]);

	// Auto-scroll when new messages are added to store
	useEffect(() => {
		if (storedMessagesCount > 0) {
			setTimeout(() => scrollToBottom(true), 50);
		}
	}, [storedMessagesCount, scrollToBottom]);

	// Join conversation room when chat is selected and mark as read
	useEffect(() => {
		if (!selectedChat?.conversationId || !isConnected) {
			return;
		}

		joinConversation(selectedChat.conversationId);

		// Mark conversation as read when opening it
		markConversationAsRead(selectedChat.conversationId)
			.then(() => {
				// Invalidate conversations query to update unread counts
				queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
				queryClient.invalidateQueries({
					queryKey: ["chat", "conversations", "unread"],
				});
			})
			.catch((error) => {
				console.error("[chat-content] Failed to mark as read:", error);
			});

		return () => {
			leaveConversation(selectedChat.conversationId);
		};
	}, [
		selectedChat?.conversationId,
		isConnected,
		joinConversation,
		leaveConversation,
		queryClient,
	]);

	// Global Socket.IO event listeners
	useEffect(() => {
		// Handle new messages for current conversation
		const unsubscribeMessage = onNewMessage((payload) => {
			// Normalize IDs for comparison
			const normalizeId = (id: unknown): string => {
				if (id === null || id === undefined) return "";
				if (typeof id === "string") return id.trim();
				if (typeof id === "number") return String(id).trim();
				return String(id).trim();
			};

			const senderId = normalizeId(payload.message.senderId);
			const idsToCheck = [myTeamchatUserIdRef.current, currentUserId]
				.map((v) => normalizeId(v))
				.filter((v) => v !== "");
			const isOwnMessage =
				idsToCheck.length > 0 && idsToCheck.includes(senderId);

			// Always invalidate conversations query to update sidebar
			queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });

			// If message is for currently selected conversation, add it to store
			if (selectedChat?.conversationId === payload.conversationId) {
				// Only add message if it's NOT from the current user (to avoid duplicates with optimistic updates)
				if (!isOwnMessage) {
					addMessage(payload.message);
				}
			}
		});

		// Handle conversation updates
		const unsubscribeUpdate = onConversationUpdate((payload) => {
			// Invalidate conversations list
			queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });

			// If it's current conversation, don't refetch messages to preserve own_message determination
			if (selectedChat?.conversationId === payload.conversationId) {
				// Don't refetch messages immediately - let the socket message handler add the message
				// This prevents all messages from being refetched and potentially losing own_message determination
			}
		});

		// Handle typing events
		let typingTimeout: NodeJS.Timeout | null = null;
		const unsubscribeTyping = onTyping((payload) => {
			if (
				selectedChat?.conversationId === payload.conversationId &&
				payload.userId !== currentUserId
			) {
				// Clear existing timeout
				if (typingTimeout) {
					clearTimeout(typingTimeout);
					typingTimeout = null;
				}

				setIsOtherUserTyping(payload.isTyping);

				// Auto-hide typing indicator after 3 seconds if typing is true
				if (payload.isTyping) {
					typingTimeout = setTimeout(() => {
						setIsOtherUserTyping(false);
						typingTimeout = null;
					}, 3000);
				}
			}
		});

		return () => {
			unsubscribeMessage();
			unsubscribeUpdate();
			unsubscribeTyping();
			if (typingTimeout) {
				clearTimeout(typingTimeout);
			}
		};
	}, [
		onNewMessage,
		onConversationUpdate,
		onTyping,
		queryClient,
		selectedChat,
		selectedChat?.conversationId,
		addMessage,
		currentUserId,
		myComparableUserId,
	]);

	// Fix missing otherUser in store if it's not set but we can determine it
	useEffect(() => {
		if (selectedChat?.conversationId && !selectedChat.otherUser && otherUser) {
			setSelectedChat({
				...selectedChat,
				otherUser,
			});
		}
	}, [selectedChat, otherUser, setSelectedChat]);

	// Helper to normalize IDs for comparison (kept for potential future use)
	// const normalizeId = React.useCallback((id: unknown): string => {
	//   if (id === null || id === undefined) return "";
	//   if (typeof id === "string") return id.trim();
	//   if (typeof id === "number") return String(id).trim();
	//   return String(id).trim();
	// }, []);

	// Memoize normalized currentUserId to avoid recalculating (kept for potential future use)
	// const normalizedCurrentUserId = React.useMemo(() => {
	//   return normalizeId(currentUserId);
	// }, [currentUserId, normalizeId]);

	// Combine messages from store and query, removing duplicates
	const messages = React.useMemo(() => {
		const storeMessages = selectedChat?.messages || [];
		const queryMessages = messagesQuery.data || [];

		// Create a map to deduplicate messages by ID
		const messagesMap = new Map<string, ChatMessage>();

		// Add query messages first (they are the source of truth)
		queryMessages.forEach((msg) => {
			messagesMap.set(msg.id, msg);
		});

		// Add store messages (new messages from socket that might not be in query yet)
		// Preserve optimistic messages (temp-*) from store as they might not be in query yet
		storeMessages.forEach((msg) => {
			const msgId = String(msg.id);
			// Always keep optimistic messages from store
			if (msgId.startsWith("temp-")) {
				messagesMap.set(msg.id, msg);
			} else if (!messagesMap.has(msg.id)) {
				messagesMap.set(msg.id, msg);
			}
		});

		// Convert map to array and sort by createdAt
		return Array.from(messagesMap.values()).sort((a, b) => {
			const dateA = new Date(a.createdAt).getTime();
			const dateB = new Date(b.createdAt).getTime();
			return dateA - dateB;
		});
	}, [selectedChat?.messages, messagesQuery.data]);

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
					loading="eager"
					unoptimized
				/>
				<Image
					width={200}
					height={200}
					className="hidden max-w-sm dark:block"
					src={`/not-selected-chat-light.svg`}
					alt="shadcn/ui"
					loading="eager"
				/>
			</figure>
		);
	}

	if (!selectedChat.conversationId) {
		console.error(
			"[chat-content] Selected chat missing conversationId:",
			selectedChat,
		);
		return (
			<figure className="hidden h-full items-center justify-center text-center lg:flex">
				<div className="text-destructive text-center">
					<p className="mb-2 text-sm font-medium">
						Greška pri učitavanju konverzacije
					</p>
					<p className="text-xs">Nedostaje ID konverzacije.</p>
				</div>
			</figure>
		);
	}

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
					<p className="mb-2 text-sm font-medium">
						Greška pri učitavanju konverzacije
					</p>
					<p className="text-xs">Nedostaju podaci o korisniku.</p>
				</div>
			</figure>
		);
	}

	// Removed verbose logging for performance

	return (
		<div className="bg-background fixed inset-0 z-50 flex h-full flex-col p-4 lg:relative lg:z-10 lg:bg-transparent lg:p-0">
			<ChatHeader user={otherUser} />

			<div ref={scrollContainerRef} className="flex-1 overflow-y-auto lg:px-4">
				<div ref={messagesContainerRef}>
					<div className="flex w-full flex-col space-y-4 py-8">
						{messagesQuery.isLoading && (
							<div className="text-muted-foreground w-full text-center text-sm">
								Učitavanje poruka...
							</div>
						)}
						{messagesQuery.isError && (
							<div className="text-destructive w-full text-center text-sm">
								<p className="mb-1 font-medium">
									Greška pri učitavanju poruka.
								</p>
								{messagesQuery.error instanceof Error && (
									<p className="text-xs opacity-75">
										{messagesQuery.error.message}
									</p>
								)}
							</div>
						)}
						{isOtherUserTyping && (
							<div className="flex w-full justify-start">
								<div className="bg-muted flex max-w-[70%] items-center gap-2 rounded-md border p-3">
									<div className="flex gap-1">
										<div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
										<div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
										<div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full" />
									</div>
									<span className="text-muted-foreground text-xs">
										{otherUser?.firstName || otherUser?.email || "Korisnik"}{" "}
										kuca...
									</span>
								</div>
							</div>
						)}
						{messages.length > 0 &&
							messages.map((message: ChatMessage) => {
								// Optimistic messages (temp-*) are always own (sent by current user)
								const isOptimistic =
									typeof message.id === "string" &&
									message.id.startsWith("temp-");

								// Determine own_message: if senderId === currentUserId, it's MY message (right side)
								// Otherwise, it's a message I received (left side)
								let ownMessage = false;

								// ONLY set ownMessage to true if senderId EXACTLY matches currentUserId
								if (isOptimistic) {
									// Optimistic messages are always from current user
									ownMessage = true;
								} else if (message.senderId) {
									const senderId = String(message.senderId).trim();
									const idsToCheck = [
										myComparableUserId,
										currentUserId ? String(currentUserId).trim() : "",
									].filter((v) => v !== "");
									if (idsToCheck.includes(senderId)) {
										ownMessage = true;
									}
								}

								// Map status: "sent" | "delivered" | "read" -> "sent" | "delivered" | "read"
								const messageStatus =
									message.status === "read"
										? "read"
										: message.status === "delivered"
											? "delivered"
											: "sent";

								const finalOwnMessage = Boolean(ownMessage);

								return (
									<ChatBubble
										key={message.id}
										message={{
											id: parseInt(message.id) || 0,
											content: message.content || undefined,
											type: message.type as string,
											own_message: finalOwnMessage, // Force boolean
											read: message.status === "read",
											status: messageStatus,
											data: message.fileUrl
												? {
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
													}
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
