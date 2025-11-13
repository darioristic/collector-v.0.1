import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/components/providers/auth-provider";
import type { ChatMessage } from "@/app/(protected)/apps/chat/api";

const CHAT_SERVICE_URL =
	process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4001";
const SESSION_COOKIE_NAME = "auth_session";

export function useChatSocket() {
	const { user } = useAuth();
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [userStatuses, setUserStatuses] = useState<
		Record<string, "online" | "offline" | "away">
	>({});
	const socketRef = useRef<Socket | null>(null);
	const messageCallbacksRef = useRef<
		Set<(data: { conversationId: string; message: ChatMessage }) => void>
	>(new Set());
	const conversationUpdateCallbacksRef = useRef<
		Set<(data: { conversationId: string }) => void>
	>(new Set());

	useEffect(() => {
		if (!user?.id) {
			return;
		}

		// Get session token from cookie
		const getSessionToken = () => {
			if (typeof document === "undefined") return null;
			const cookieValue = document.cookie
				.split("; ")
				.find((row) => row.startsWith(`${SESSION_COOKIE_NAME}=`))
				?.split("=")[1];
			return cookieValue ? decodeURIComponent(cookieValue) : null;
		};

		const token = getSessionToken();
		if (!token) {
			console.warn("[chat-socket] No session token found");
			return;
		}

		// Create socket connection
		// Note: extraHeaders doesn't work in browser WebSocket
		// We need to pass token via auth object or query parameter
		const newSocket = io(CHAT_SERVICE_URL, {
			path: "/socket/teamchat",
			auth: {
				token: token,
			},
			query: {
				token: token,
			},
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 5,
		});

		socketRef.current = newSocket;

		// Connection events
		newSocket.on("connect", () => {
			console.log("[chat-socket] Connected");
			setIsConnected(true);
		});

		newSocket.on("disconnect", () => {
			console.log("[chat-socket] Disconnected");
			setIsConnected(false);
		});

		newSocket.on("connect_error", (error) => {
			console.error("[chat-socket] Connection error:", error);
			setIsConnected(false);
		});

		// Status update events
		newSocket.on(
			"user:status:update",
			(data: {
				userId: string;
				status: "online" | "offline" | "away";
				timestamp: string;
			}) => {
				console.log("[chat-socket] Status update:", data);
				setUserStatuses((prev) => ({
					...prev,
					[data.userId]: data.status,
				}));
			},
		);

		// Message events - notify all registered callbacks
		newSocket.on(
			"chat:message:new",
			(data: { conversationId: string; message: ChatMessage }) => {
				console.log("[chat-socket] New message received:", data);
				messageCallbacksRef.current.forEach((callback) => {
					try {
						callback(data);
					} catch (error) {
						console.error("[chat-socket] Error in message callback:", error);
					}
				});
			},
		);

		// Conversation update events - notify all registered callbacks
		newSocket.on(
			"chat:conversation:updated",
			(data: { conversationId: string }) => {
				console.log("[chat-socket] Conversation updated:", data);
				conversationUpdateCallbacksRef.current.forEach((callback) => {
					try {
						callback(data);
					} catch (error) {
						console.error(
							"[chat-socket] Error in conversation update callback:",
							error,
						);
					}
				});
			},
		);

		setSocket(newSocket);

		// Cleanup
		return () => {
			if (newSocket) {
				newSocket.disconnect();
				socketRef.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id]);

	// Join conversation room
	const joinConversation = (conversationId: string) => {
		if (socket && isConnected) {
			socket.emit("join", { conversationId });
		}
	};

	// Leave conversation room
	const leaveConversation = (conversationId: string) => {
		if (socket && isConnected) {
			socket.emit("leave", { conversationId });
		}
	};

	// Get user status - returns status from socket state or null if not available
	const getUserStatus = (
		userId: string,
	): "online" | "offline" | "away" | null => {
		return userStatuses[userId] || null;
	};

	// Subscribe to new message events
	const onNewMessage = useCallback(
		(
			callback: (data: { conversationId: string; message: ChatMessage }) => void,
		) => {
			messageCallbacksRef.current.add(callback);
			// Return unsubscribe function
			return () => {
				messageCallbacksRef.current.delete(callback);
			};
		},
		[],
	);

	// Subscribe to conversation update events
	const onConversationUpdate = useCallback(
		(callback: (data: { conversationId: string }) => void) => {
			conversationUpdateCallbacksRef.current.add(callback);
			// Return unsubscribe function
			return () => {
				conversationUpdateCallbacksRef.current.delete(callback);
			};
		},
		[],
	);

	return {
		socket,
		isConnected,
		userStatuses,
		joinConversation,
		leaveConversation,
		getUserStatus,
		onNewMessage,
		onConversationUpdate,
	};
}
