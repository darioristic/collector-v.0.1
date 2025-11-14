"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Search, Users } from "lucide-react";
import React from "react";
import {
	type ChatConversation,
	createConversation,
	fetchConversations,
} from "@/app/(protected)/apps/chat/api";
import { ActionDropdown } from "@/app/(protected)/apps/chat/components/action-dropdown";
import { ChatListItem } from "@/app/(protected)/apps/chat/components/chat-list-item";
import useChatStore, {
	type ChatItem,
} from "@/app/(protected)/apps/chat/useChatStore";
import {
	fetchTeamMembers,
	type TeamMember,
} from "@/app/(protected)/settings/teams/api";
import {
	fetchEmployees,
	type Employee,
} from "@/app/(protected)/hr/employees/api";
import { useAuth } from "@/components/providers/auth-provider";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	AvatarIndicator,
} from "@/components/ui/avatar";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useToast } from "@/hooks/use-toast";
import { cn, generateAvatarFallback } from "@/lib/utils";

export function ChatSidebar() {
	const { selectedChat, setSelectedChat } = useChatStore();
	const { user } = useAuth();
	const [searchTerm, setSearchTerm] = React.useState("");
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const { getUserStatus, onNewMessage, onConversationUpdate } = useChatSocket();

	const conversationsQuery = useQuery({
		queryKey: ["chat", "conversations"],
		queryFn: fetchConversations,
		refetchOnWindowFocus: false,
		retry: 1,
		// Don't throw errors, return empty array instead
		throwOnError: false,
	});

	// Track if chat service is unavailable
	// We check this when user tries to create a conversation, not just when fetching conversations
	// because fetchConversations returns empty array instead of throwing error
	const [chatServiceUnavailable, setChatServiceUnavailable] =
		React.useState(false);

	// Check if chat service is unavailable from query error or from our state
	const isChatServiceUnavailable =
		chatServiceUnavailable ||
		(conversationsQuery.isError &&
			conversationsQuery.error instanceof Error &&
			(conversationsQuery.error.message
				.toLowerCase()
				.includes("servis nije dostupan") ||
				conversationsQuery.error.message
					.toLowerCase()
					.includes("service unavailable") ||
				conversationsQuery.error.message
					.toLowerCase()
					.includes("nije dostupan") ||
				conversationsQuery.error.message
					.toLowerCase()
					.includes("failed to fetch")));

	// Fetch employees instead of team members for chat
	const employeesQuery = useQuery({
		queryKey: ["employees", "chat"],
		queryFn: async () => {
			// Fetch employees with valid parameters (max limit is 100)
			const response = await fetchEmployees({
				query: {
					limit: 100, // Maximum allowed by API
					sortField: "name",
					sortOrder: "asc",
				},
			});
			return response.data || [];
		},
		staleTime: 30_000,
		retry: 1,
		throwOnError: false,
	});

	// Fetch users to match with employees by email
	const usersQuery = useQuery({
		queryKey: ["users", "chat"],
		queryFn: async () => {
			try {
				const response = await fetch("/api/users", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					cache: "no-store",
					credentials: "include",
				});
				if (!response.ok) {
					return [];
				}
				const data = await response.json();
				return Array.isArray(data.data) ? data.data : [];
			} catch {
				return [];
			}
		},
		staleTime: 30_000,
		retry: 1,
		throwOnError: false,
	});

	// Map employees to TeamMember-like format and match with users by email
	const teamMembers = React.useMemo(() => {
		const employees = employeesQuery.data || [];
		const users = usersQuery.data || [];
		
		// Create email to userId map
		const emailToUserIdMap = new Map<string, string>();
		users.forEach((u: { email: string; id: string }) => {
			if (u.email) {
				emailToUserIdMap.set(u.email.toLowerCase(), u.id);
			}
		});

		return employees.map((emp: Employee) => {
			const userId = emailToUserIdMap.get(emp.email.toLowerCase()) || null;
			return {
				id: String(emp.id),
				firstName: emp.firstName,
				lastName: emp.lastName,
				fullName: emp.fullName,
				email: emp.email,
				role: emp.role || "Employee",
				status: emp.status === "Active" ? "online" : "offline",
				avatarUrl: null,
				userId, // Matched from users table by email
				companyId: null,
				createdAt: new Date(emp.createdAt),
				updatedAt: new Date(emp.updatedAt),
			} as TeamMember;
		});
	}, [employeesQuery.data, usersQuery.data]);

	const conversations = conversationsQuery.data || [];
	const currentUserId = user?.id;

	const filteredConversations = React.useMemo(() => {
		if (!searchTerm.trim()) {
			return conversations;
		}
		const term = searchTerm.toLowerCase();
		return conversations.filter((conv) => {
			const otherUser =
				conv.userId1 === currentUserId ? conv.user2 : conv.user1;
			const displayName =
				otherUser.displayName?.trim() ||
				[otherUser.firstName, otherUser.lastName].filter(Boolean).join(" ") ||
				otherUser.email;
			return (
				displayName.toLowerCase().includes(term) ||
				otherUser.email.toLowerCase().includes(term)
			);
		});
	}, [conversations, searchTerm, currentUserId]);

	const chatItems = React.useMemo(() => {
		if (!currentUserId) {
			return [];
		}
		return filteredConversations.map((conv) => {
			const otherUser =
				conv.userId1 === currentUserId ? conv.user2 : conv.user1;
			const displayName =
				otherUser.displayName?.trim() ||
				[otherUser.firstName, otherUser.lastName].filter(Boolean).join(" ") ||
				otherUser.email;

			// Get real-time status from socket, prioritize real-time over database status
			const realTimeStatus = getUserStatus(otherUser.id);
			// If real-time status exists, use it; otherwise use database status
			const status = realTimeStatus ?? (otherUser.status || "offline");

			const onlineStatus: "success" | "warning" | "danger" =
				status === "online"
					? "success"
					: status === "away"
						? "warning"
						: "danger";
			const date = conv.lastMessageAt
				? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })
				: "Never";

			return {
				conversationId: conv.id,
				...conv,
				otherUser: {
					...otherUser,
					status, // Use real-time status
				},
				user: {
					id: otherUser.id,
					name: displayName,
					avatar: otherUser.avatarUrl || undefined,
					online_status: onlineStatus,
					last_seen:
						status === "online"
							? undefined
							: status === "away"
								? "Away"
								: "Offline",
				},
				date,
				last_message: conv.lastMessage || "",
				status: "read" as const,
			};
		});
	}, [filteredConversations, currentUserId, getUserStatus]);

	const availableTeamMembers = React.useMemo(() => {
		if (!currentUserId || !teamMembers.length) {
			return [];
		}

		return teamMembers.filter((member) => {
			if (member.email === user?.email) {
				return false;
			}

			const memberInConversation = conversations.some((conv) => {
				if (!member.userId) {
					return false;
				}
				if (conv.userId1 === currentUserId && conv.userId2 === member.userId) {
					return true;
				}
				if (conv.userId2 === currentUserId && conv.userId1 === member.userId) {
					return true;
				}
				return false;
			});

			return !memberInConversation;
		});
	}, [teamMembers, conversations, currentUserId, user?.email]);

	const createConversationMutation = useMutation({
		mutationFn: async (member: TeamMember) => {
			console.log("[chat] Creating conversation with member:", {
				id: member.id,
				email: member.email,
				fullName: member.fullName,
				userId: member.userId,
			});

			if (!member.userId) {
				const errorMsg = `Korisnik ${member.fullName} (${member.email}) nije registrovan u sistemu. Nije moguće kreirati konverzaciju. Proverite da li korisnik postoji u users tabeli sa istom email adresom.`;
				console.error("[chat]", errorMsg);
				throw new Error(errorMsg);
			}

			// Mark that we're attempting to create a conversation
			// This will help us detect if service is unavailable
			setChatServiceUnavailable(false);

			try {
				console.log(
					"[chat] Calling createConversation with userId:",
					member.userId,
				);
				const conversation = await createConversation(member.userId);
				console.log("[chat] Conversation created successfully:", conversation);

				// If we successfully created a conversation, service is available
				setChatServiceUnavailable(false);

				return conversation;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				const errorMessageLower = errorMessage.toLowerCase();

				// Check if this is a service unavailable error
				const isServiceUnavailable =
					errorMessageLower.includes("servis nije dostupan") ||
					errorMessageLower.includes("service unavailable") ||
					errorMessageLower.includes("nije dostupan") ||
					errorMessageLower.includes("failed to fetch") ||
					errorMessageLower.includes("networkerror") ||
					errorMessageLower.includes("err_connection_refused") ||
					errorMessageLower.includes("connection refused");

				if (isServiceUnavailable) {
					// Mark chat service as unavailable
					setChatServiceUnavailable(true);

					// Log as warning for service unavailable (expected scenario)
					console.warn(
						"[chat] Chat service unavailable when creating conversation",
						{
							userId: member.userId,
							errorMessage,
						},
					);
					// Throw clear error that will be handled by onError callback
					throw new Error(
						"Chat servis nije dostupan. Proverite da li je servis pokrenut.",
					);
				}

				// Log actual errors (not service unavailable)
				console.error("[chat] Error creating conversation:", {
					userId: member.userId,
					errorMessage,
					error: error instanceof Error ? error.stack : undefined,
				});
				throw error;
			}
		},
		onSuccess: (conversation) => {
			console.log("[chat] Conversation created successfully, opening chat:", {
				conversationId: conversation.id,
				userId1: conversation.userId1,
				userId2: conversation.userId2,
				currentUserId,
				hasUser1: !!conversation.user1,
				hasUser2: !!conversation.user2,
				user1: conversation.user1,
				user2: conversation.user2,
				conversation,
			});

			// First, determine the other user
			if (!currentUserId) {
				console.error("[chat] No current user ID, cannot open conversation");
				toast({
					title: "Greška",
					description: "Niste prijavljeni. Molimo osvežite stranicu.",
					variant: "destructive",
				});
				return;
			}

			// Determine which user is the current user and which is the other user
			const isUser1 = conversation.userId1 === currentUserId;
			const otherUser = isUser1 ? conversation.user2 : conversation.user1;

			if (!otherUser) {
				console.error("[chat] No other user found in conversation:", {
					conversationId: conversation.id,
					userId1: conversation.userId1,
					userId2: conversation.userId2,
					currentUserId,
					isUser1,
					user1: conversation.user1,
					user2: conversation.user2,
				});
				toast({
					title: "Greška",
					description: "Nije moguće odrediti drugog korisnika u konverzaciji.",
					variant: "destructive",
				});
				return;
			}

			console.log("[chat] Other user determined:", {
				isUser1,
				currentUserId,
				otherUserId: otherUser.id,
				otherUserEmail: otherUser.email,
				otherUser,
			});

			// Create the chat item with all required fields matching ChatItem interface
			const newChatItem: ChatItem = {
				id: conversation.id,
				userId1: conversation.userId1,
				userId2: conversation.userId2,
				companyId: conversation.companyId,
				lastMessageAt: conversation.lastMessageAt,
				lastMessage: conversation.lastMessage,
				unreadCount: conversation.unreadCount ?? 0,
				createdAt: conversation.createdAt,
				updatedAt: conversation.updatedAt,
				user1: conversation.user1,
				user2: conversation.user2,
				conversationId: conversation.id,
				otherUser,
				messages: [],
			};

			console.log("[chat] Setting selected chat with full data:", {
				conversationId: newChatItem.conversationId,
				hasOtherUser: !!newChatItem.otherUser,
				otherUserId: newChatItem.otherUser?.id,
				otherUserEmail: newChatItem.otherUser?.email,
				newChatItem,
			});

			// Set the selected chat immediately so it opens right away
			// This must happen before any cache updates or query invalidations
			console.log("[chat] About to call setSelectedChat with:", {
				conversationId: newChatItem.conversationId,
				hasOtherUser: !!newChatItem.otherUser,
				otherUserId: newChatItem.otherUser?.id,
				otherUserEmail: newChatItem.otherUser?.email,
				newChatItem,
			});

			// Set selected chat synchronously
			setSelectedChat(newChatItem);

			// Verify it was set by reading from store immediately
			// Use a small delay to allow Zustand to update
			setTimeout(() => {
				const store = useChatStore.getState();
				console.log("[chat] Verified selected chat after set:", {
					conversationId: store.selectedChat?.conversationId,
					hasOtherUser: !!store.selectedChat?.otherUser,
					otherUserId: store.selectedChat?.otherUser?.id,
					matches:
						store.selectedChat?.conversationId === newChatItem.conversationId,
				});

				// If for some reason it didn't set, try again
				if (
					!store.selectedChat ||
					store.selectedChat.conversationId !== newChatItem.conversationId
				) {
					console.warn("[chat] Selected chat not set correctly, retrying...");
					setSelectedChat(newChatItem);
				}
			}, 50);

			console.log("[chat] setSelectedChat called");

			// Update the cache to include the new conversation
			// This ensures the conversation appears in the sidebar list
			queryClient.setQueryData<ChatConversation[]>(
				["chat", "conversations"],
				(oldConversations = []) => {
					// Check if conversation already exists in cache
					const exists = oldConversations.some((c) => c.id === conversation.id);
					if (exists) {
						// If it exists, update it with the new data
						return oldConversations.map((c) =>
							c.id === conversation.id ? conversation : c,
						);
					}
					// Add new conversation to the beginning of the list
					return [conversation, ...oldConversations];
				},
			);

			// Show success toast
			toast({
				title: "Konverzacija kreirana",
				description: "Konverzacija je uspešno kreirana.",
			});

			// Don't invalidate queries immediately - we've already updated the cache
			// Invalidating would cause a refetch which might interfere with the selected chat
			// The conversation will be refetched naturally when the component remounts or when needed
		},
		onError: (error: Error) => {
			const errorMessage = error.message.toLowerCase();
			const isServiceUnavailable =
				errorMessage.includes("servis nije dostupan") ||
				errorMessage.includes("service unavailable") ||
				errorMessage.includes("nije dostupan") ||
				errorMessage.includes("failed to fetch") ||
				errorMessage.includes("connection refused");

			if (isServiceUnavailable) {
				// Mark chat service as unavailable
				setChatServiceUnavailable(true);

				toast({
					title: "Chat servis nije dostupan",
					description:
						"Chat servis nije pokrenut. Da biste koristili chat, pokrenite servis sa 'bun run dev' u root direktorijumu projekta.",
					variant: "destructive",
					duration: 10000, // Show for 10 seconds
				});
			} else {
				toast({
					title: "Greška pri kreiranju konverzacije",
					description: error.message,
					variant: "destructive",
				});
			}
		},
	});

	const handleTeamMemberClick = (member: TeamMember) => {
		createConversationMutation.mutate(member);
	};

	const filteredTeamMembers = React.useMemo(() => {
		if (!searchTerm.trim()) {
			return availableTeamMembers;
		}
		const term = searchTerm.toLowerCase();
		return availableTeamMembers.filter((member) => {
			const fullName = member.fullName.toLowerCase();
			const email = member.email.toLowerCase();
			return fullName.includes(term) || email.includes(term);
		});
	}, [availableTeamMembers, searchTerm]);

	// Auto-select first conversation only on initial load when no chat is selected
	// Don't auto-select if user has explicitly selected a chat or is creating a new conversation
	React.useEffect(() => {
		// Only auto-select if:
		// 1. There are chat items available
		// 2. No chat is currently selected
		// 3. We're not currently creating a conversation
		// 4. Conversations query has finished loading (not loading and not error)
		if (
			chatItems.length > 0 &&
			!selectedChat &&
			!createConversationMutation.isPending &&
			!conversationsQuery.isLoading &&
			!conversationsQuery.isError
		) {
			const firstChat = chatItems[0];
			if (firstChat?.conversationId && firstChat?.otherUser) {
				console.log(
					"[chat] Auto-selecting first conversation:",
					firstChat.conversationId,
				);
				setSelectedChat({
					id: firstChat.conversationId,
					userId1: firstChat.userId1,
					userId2: firstChat.userId2,
					companyId: firstChat.companyId,
					lastMessageAt: firstChat.lastMessageAt,
					lastMessage: firstChat.lastMessage,
					unreadCount: firstChat.unreadCount ?? 0,
					createdAt: firstChat.createdAt,
					updatedAt: firstChat.updatedAt,
					user1: firstChat.user1,
					user2: firstChat.user2,
					conversationId: firstChat.conversationId,
					otherUser: firstChat.otherUser,
					messages: [],
				} as ChatItem);
			}
		}
	}, [
		chatItems,
		selectedChat,
		setSelectedChat,
		createConversationMutation.isPending,
		conversationsQuery.isLoading,
		conversationsQuery.isError,
	]);

	// Listen to Socket.IO events for real-time conversation updates
	React.useEffect(() => {
		// Handle new messages - refetch conversations to update last message and timestamp
		const unsubscribeMessage = onNewMessage(() => {
			console.log(
				"[chat-sidebar] New message received, refetching conversations",
			);
			queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
		});

		// Handle conversation updates - refetch conversations
		const unsubscribeUpdate = onConversationUpdate(() => {
			console.log(
				"[chat-sidebar] Conversation updated, refetching conversations",
			);
			queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
		});

		return () => {
			unsubscribeMessage();
			unsubscribeUpdate();
		};
	}, [onNewMessage, onConversationUpdate, queryClient]);

	return (
		<Card className="w-full pb-0 lg:w-96">
			<CardHeader>
				<CardTitle className="font-display text-xl lg:text-2xl">
					Chats
				</CardTitle>
				<CardAction>
					<ActionDropdown />
				</CardAction>
				<CardDescription className="relative col-span-2 mt-4 flex w-full items-center">
					<Search className="text-muted-foreground absolute start-4 size-4" />
					<Input
						type="text"
						className="ps-10"
						placeholder="Chats search..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</CardDescription>
			</CardHeader>

			<CardContent className="flex-1 overflow-auto p-0">
				<div className="block min-w-0 divide-y">
					{isChatServiceUnavailable && (
						<div className="bg-muted/50 border-muted-foreground/20 m-4 rounded-lg border p-4">
							<div className="text-muted-foreground mb-2 text-sm font-medium">
								⚠️ Chat servis nije dostupan
							</div>
							<div className="text-muted-foreground text-xs">
								Chat servis nije pokrenut. Da biste koristili chat, pokrenite
								servis sa{" "}
								<code className="bg-muted rounded px-1 py-0.5">
									bun run dev
								</code>{" "}
								u root direktorijumu projekta.
							</div>
							<div className="text-muted-foreground mt-2 text-xs">
								Chat servis se pokreće na portu 4001.
							</div>
						</div>
					)}
					{conversationsQuery.isLoading &&
						(employeesQuery.isLoading || usersQuery.isLoading) &&
						!isChatServiceUnavailable && (
							<div className="text-muted-foreground mt-4 text-center text-sm">
								Učitavanje konverzacija...
							</div>
						)}
					{conversationsQuery.isError && !isChatServiceUnavailable && (
						<div className="text-destructive mt-4 text-center text-sm">
							Greška pri učitavanju konverzacija.
						</div>
					)}
					{chatItems.length > 0 &&
						chatItems.map((chat) => {
							const originalConversation = conversations.find(
								(c) => c.id === chat.conversationId,
							);
							if (!originalConversation) {
								return null;
							}
							return (
								<ChatListItem
									chat={{
										id: chat.conversationId,
										conversationId: chat.conversationId,
										user: chat.user,
										date: chat.date,
										last_message: chat.last_message,
										status: chat.status,
										otherUser: chat.otherUser,
										conversation: originalConversation,
									}}
									key={chat.conversationId}
									active={
										selectedChat &&
										selectedChat.conversationId === chat.conversationId
									}
								/>
							);
						})}
					{filteredTeamMembers.length > 0 && (
						<>
							{chatItems.length > 0 && <Separator />}
							<div className="bg-muted/30 px-6 py-3">
								<div className="flex items-center gap-2">
									<Users className="text-muted-foreground size-4" />
									<span className="text-muted-foreground text-sm font-medium">
										Kolege (Zaposleni)
									</span>
								</div>
							</div>
							{filteredTeamMembers.map((member) => {
								// Get real-time status from socket, prioritize real-time over database status
								const realTimeStatus = member.userId
									? getUserStatus(member.userId)
									: null;
								// If real-time status exists, use it; otherwise use database status
								const memberStatus =
									realTimeStatus ?? (member.status || "offline");

								const statusMap: Record<
									string,
									"success" | "warning" | "danger"
								> = {
									online: "success",
									away: "warning",
									idle: "warning",
									offline: "danger",
									invited: "warning",
								};
								const statusColor = statusMap[memberStatus] || "warning";
								const hasUserId = Boolean(member.userId);
								const isCreating =
									createConversationMutation.isPending &&
									(createConversationMutation.variables?.id === member.id ||
										createConversationMutation.variables?.userId ===
											member.userId);

								return (
									<button
										type="button"
										key={member.id}
										className={cn(
											"group/item hover:bg-muted relative flex w-full min-w-0 items-center gap-4 px-6 py-4 text-left",
											{
												"cursor-pointer": hasUserId && !isCreating,
												"cursor-not-allowed opacity-60": !hasUserId,
												"opacity-50": isCreating,
											},
										)}
										onClick={() => {
											if (isChatServiceUnavailable) {
												toast({
													title: "Chat servis nije dostupan",
													description:
														"Chat servis nije pokrenut. Pokrenite servis sa 'bun run dev' u root direktorijumu projekta.",
													variant: "destructive",
													duration: 10000,
												});
												return;
											}
											if (hasUserId && !isCreating) {
												handleTeamMemberClick(member);
											} else if (!hasUserId) {
												toast({
													title: "Korisnik nije registrovan",
													description: `${member.fullName} mora biti registrovan u sistemu da bi mogao da koristi chat.`,
													variant: "default",
												});
											}
										}}
										disabled={
											!hasUserId || isCreating || isChatServiceUnavailable
										}
									>
										<Avatar className="overflow-visible md:size-10">
											<AvatarImage
												src={member.avatarUrl || undefined}
												alt="avatar image"
											/>
											<AvatarIndicator variant={statusColor} />
											<AvatarFallback>
												{generateAvatarFallback(member.fullName)}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 grow">
											<div className="flex items-center justify-between">
												<span className="truncate text-sm font-medium">
													{member.fullName}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-muted-foreground truncate text-start text-sm">
													{member.role} •{" "}
													{memberStatus === "online"
														? "Online"
														: memberStatus === "away"
															? "Away"
															: "Offline"}
												</span>
												{!hasUserId && (
													<span className="text-muted-foreground text-xs">
														(Nije registrovan)
													</span>
												)}
											</div>
										</div>
										{isCreating && (
											<div className="flex-none">
												<Skeleton className="size-4 rounded-full" />
											</div>
										)}
									</button>
								);
							})}
						</>
					)}
					{!conversationsQuery.isLoading &&
						!conversationsQuery.isError &&
						!employeesQuery.isLoading &&
						!employeesQuery.isError &&
						!usersQuery.isLoading &&
						!usersQuery.isError &&
						chatItems.length === 0 &&
						filteredTeamMembers.length === 0 && (
							<div className="text-muted-foreground mt-4 space-y-2 px-6 text-center text-sm">
								<div>Nema konverzacija</div>
								{teamMembers.length > 0 ? (
									<div className="space-y-1 text-xs">
										<div>
											Pronađeno {teamMembers.length} zaposlenih, ali nijedan
											nije dostupan za chat.
										</div>
										{teamMembers.filter((m) => !m.userId).length > 0 && (
											<div className="text-amber-600 dark:text-amber-400">
												{teamMembers.filter((m) => !m.userId).length} zaposlenih
												nije registrovan u sistemu. Registrujte ih da biste
												mogli da započnete chat.
											</div>
										)}
										{teamMembers.filter((m) => m.userId).length > 0 && (
											<div>
												{teamMembers.filter((m) => m.userId).length} zaposlenih
												je već u konverzacijama.
											</div>
										)}
									</div>
								) : (
									<div className="text-xs">
										Nema zaposlenih. Dodajte zaposlene u HR → Employees.
									</div>
								)}
							</div>
						)}
					{employeesQuery.isError && (
						<div className="text-destructive mt-4 space-y-2 px-6 text-center text-sm">
							<div>Greška pri učitavanju zaposlenih.</div>
							{employeesQuery.error instanceof Error && (
								<div className="text-xs">{employeesQuery.error.message}</div>
							)}
							<div className="text-muted-foreground text-xs">
								Proverite da li imate zaposlene u HR → Employees.
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
