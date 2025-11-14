import { useCallback, useEffect, useRef, useState } from "react";
import { io, type ManagerOptions, type Socket, type SocketOptions } from "socket.io-client";
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
		console.log("[chat-socket] 🚀 useEffect triggered", { hasUser: !!user?.id });

		if (!user?.id) {
			console.log("[chat-socket] ⚠️ No user ID, skipping socket initialization");
			return;
		}

		// Get session token from cookie (if available - for non-httpOnly cookies)
		const getSessionToken = () => {
			if (typeof document === "undefined") return null;
			const cookieValue = document.cookie
				.split("; ")
				.find((row) => row.startsWith(`${SESSION_COOKIE_NAME}=`))
				?.split("=")[1];
			return cookieValue ? decodeURIComponent(cookieValue) : null;
		};

		const token = getSessionToken();
		console.log("[chat-socket] 🔑 Token retrieval:", {
			hasToken: !!token,
			tokenLength: token?.length,
			tokenPreview: token ? `${token.substring(0, 10)}...` : "none",
			allCookies: document.cookie.split("; ").map(c => c.split("=")[0]),
		});

		// Note: If token is not found in JavaScript (httpOnly cookie),
		// Socket.IO will still send it automatically in the HTTP request headers
		// The server will read it from the cookie header
		if (!token) {
			console.log(
				"[chat-socket] ℹ️ Token not accessible from JavaScript (likely httpOnly cookie). " +
				"Socket.IO will automatically send it in HTTP headers."
			);
		}

		console.log("[chat-socket] 🔌 Initializing Socket.IO connection to:", CHAT_SERVICE_URL);

		// Create socket connection
		// Note: Socket.IO will automatically send all cookies (including httpOnly)
		// in the HTTP request, so the server can read them from headers
		const socketOptions: Partial<ManagerOptions & SocketOptions> = {
			path: "/socket/teamchat",
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 5,
			withCredentials: true, // Important: send cookies with cross-origin requests
		};

		// If token is available in JavaScript, also send it via auth/query
		// (for additional compatibility)
		if (token) {
			socketOptions.auth = { token };
			socketOptions.query = { token };
		}

		const newSocket = io(CHAT_SERVICE_URL, socketOptions);

		console.log("[chat-socket] ✅ Socket.IO client created, waiting for connection...");

		socketRef.current = newSocket;

		// Connection events
		newSocket.on("connect", () => {
			console.log("[chat-socket] ✅ Connected successfully!", {
				socketId: newSocket.id,
				transport: newSocket.io.engine.transport.name,
			});
			setIsConnected(true);
		});

		newSocket.on("disconnect", (reason) => {
			console.log("[chat-socket] ⚠️ Disconnected:", {
				reason,
				socketId: newSocket.id,
			});
			setIsConnected(false);
		});

		newSocket.on("connect_error", (error: SocketConnectionError) => {
			console.error("[chat-socket] ❌ Connection error:", {
				message: error.message,
				type: error.type,
				description: error.description,
				context: error.context,
				error: error,
			});
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
				console.log("[chat-socket] ⚡ NEW MESSAGE EVENT RECEIVED:", {
					conversationId: data.conversationId,
					messageId: data.message?.id,
					senderId: data.message?.senderId,
					content: data.message?.content,
					callbackCount: messageCallbacksRef.current.size,
				});
				messageCallbacksRef.current.forEach((callback) => {
					try {
						console.log("[chat-socket] Calling message callback");
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
		 
	}, [user?.id]);

	// Join conversation room
	const joinConversation = (conversationId: string) => {
		if (socket && isConnected) {
			console.log("[chat-socket] Joining conversation:", conversationId);
			socket.emit("join", { conversationId });
			console.log("[chat-socket] Join event emitted");
		} else {
			console.warn("[chat-socket] Cannot join - socket not ready", {
				hasSocket: !!socket,
				isConnected,
			});
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

type SocketConnectionError = Error & {
	type?: string;
	description?: string;
	context?: unknown;
};
