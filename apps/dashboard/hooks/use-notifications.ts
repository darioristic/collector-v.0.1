"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

import {
	type NotificationPayload,
	notificationListResponseSchema,
	notificationPayloadSchema,
	notificationUpdateResponseSchema,
} from "@/lib/validations/notifications";

type UseNotificationsOptions = {
	refreshOnFocus?: boolean;
	limit?: number;
};

type NotificationReadPayload = {
	updatedIds: string[];
	unreadCount: number;
};

const SOCKET_PATH = "/socket/notifications";

export function useNotifications(
	userId: string | null | undefined,
	options?: UseNotificationsOptions,
) {
	const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const socketRef = useRef<Socket | null>(null);
	const controllerRef = useRef<AbortController | null>(null);

	const limit = options?.limit ?? 25;

	const disconnectSocket = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.removeAllListeners();
			socketRef.current.disconnect();
			socketRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			disconnectSocket();
			if (controllerRef.current) {
				controllerRef.current.abort();
			}
		};
	}, [disconnectSocket]);

	const fetchNotifications = useCallback(
	async (signal?: AbortSignal) => {
		if (!userId) {
			setNotifications([]);
			setUnreadCount(0);
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch(`/api/notifications?limit=${limit}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				cache: "no-store",
				signal,
				credentials: "include",
			});

			if (response.status === 401) {
				setNotifications([]);
				setUnreadCount(0);
				return;
			}

			// Handle service unavailable (503) gracefully
			if (response.status === 503) {
				console.warn(
					"[notifications] Service unavailable (503), notifications will not be loaded. Make sure notification service is running on port 4002.",
				);
				setNotifications([]);
				setUnreadCount(0);
				return;
			}

			if (!response.ok) {
				throw new Error(
					`Preuzimanje notifikacija nije uspelo (${response.status}).`,
				);
			}

			const payload = notificationListResponseSchema.parse(
				await response.json(),
			);

			setNotifications(payload.data);
			setUnreadCount(payload.data.filter((item) => !item.read).length);
			} catch (error) {
				if ((error as Error).name === "AbortError") {
					return;
				}

				// Network errors (service unavailable) should be handled gracefully
				const errorMessage = error instanceof Error ? error.message : String(error);
				if (
					errorMessage.includes("Failed to fetch") ||
					errorMessage.includes("NetworkError") ||
					errorMessage.includes("503")
				) {
					console.warn(
						"[notifications] Service unavailable, notifications will not be loaded. Make sure notification service is running on port 4002.",
					);
					// Set empty state but don't throw - app should work without notifications
					setNotifications([]);
					setUnreadCount(0);
				} else {
					console.error("[notifications] Fetch failed", error);
				}
			} finally {
				setIsLoading(false);
			}
		},
		[limit, userId],
	);

	useEffect(() => {
		if (!userId) {
			disconnectSocket();
			setNotifications([]);
			setUnreadCount(0);
			return;
		}

		const controller = new AbortController();
		controllerRef.current = controller;
		void fetchNotifications(controller.signal);

		// Use notification service
		const serviceUrl = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || "http://localhost:4002";
		const socket = io(serviceUrl, {
			path: SOCKET_PATH,
			addTrailingSlash: false,
			withCredentials: true,
			transports: ["websocket"],
			query: { userId },
			reconnection: true,
			reconnectionAttempts: 3,
			reconnectionDelay: 2000,
			timeout: 5000,
		});

		socketRef.current = socket;

		let hasLoggedConnectionError = false;

		// Handle connection errors gracefully
		socket.on("connect_error", (error) => {
			// Only log once to avoid spam
			if (!hasLoggedConnectionError) {
				hasLoggedConnectionError = true;
				console.warn(
					"[notifications] Socket connection failed. Notifications will not be received in real-time. Make sure notification service is running on port 4002.",
					error.message,
				);
			}
		});

		socket.on("connect", () => {
			console.info("[notifications] Socket connected successfully");
		});

		const handleNewNotification = (payload: unknown) => {
			const parsed = notificationPayloadSchema.safeParse(payload);
			if (!parsed.success) {
				return;
			}

			setNotifications((prev) => {
				const exists = prev.some((item) => item.id === parsed.data.id);
				const next = exists ? prev : [parsed.data, ...prev];
				return next.slice(0, limit);
			});
			if (!parsed.data.read) {
				setUnreadCount((prev) => prev + 1);
			}
		};

		const handleReadNotification = (payload: NotificationReadPayload) => {
			setNotifications((prev) =>
				prev.map((item) =>
					payload.updatedIds.includes(item.id)
						? {
								...item,
								read: true,
							}
						: item,
				),
			);
			setUnreadCount(payload.unreadCount);
		};

		socket.on("notification:new", handleNewNotification);
		socket.on("notification:read", handleReadNotification);
		socket.emit("join", { userId });

		return () => {
			socket.off("notification:new", handleNewNotification);
			socket.off("notification:read", handleReadNotification);
			disconnectSocket();
			controller.abort();
		};
	}, [disconnectSocket, fetchNotifications, limit, userId]);

	useEffect(() => {
		if (!options?.refreshOnFocus) {
			return;
		}

		const onFocus = () => {
			if (document.visibilityState === "visible") {
				controllerRef.current?.abort();
				const controller = new AbortController();
				controllerRef.current = controller;
				void fetchNotifications(controller.signal);
			}
		};

		window.addEventListener("visibilitychange", onFocus);
		window.addEventListener("focus", onFocus);

		return () => {
			window.removeEventListener("visibilitychange", onFocus);
			window.removeEventListener("focus", onFocus);
		};
	}, [fetchNotifications, options?.refreshOnFocus]);

	const markAsRead = useCallback(
		async (ids: string[]) => {
			if (!userId || ids.length === 0) {
				return;
			}

		try {
			const response = await fetch(`/api/notifications/read`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ ids }),
				credentials: "include",
			});

			// Handle service unavailable (503) gracefully
			if (response.status === 503) {
				console.warn(
					"[notifications] Service unavailable (503), mark as read failed. Make sure notification service is running on port 4002.",
				);
				// Optimistically update local state even if service is unavailable
				setNotifications((prev) =>
					prev.map((item) =>
						ids.includes(item.id)
							? {
									...item,
									read: true,
								}
							: item,
					),
				);
				setUnreadCount((prev) => Math.max(0, prev - ids.length));
				return;
			}

			if (!response.ok) {
				throw new Error(`Označavanje nije uspelo (${response.status}).`);
			}

			const payload = notificationUpdateResponseSchema.parse(
				await response.json(),
			);

			setNotifications((prev) =>
				prev.map((item) =>
					payload.updatedIds.includes(item.id)
						? {
								...item,
								read: true,
							}
						: item,
				),
			);
			setUnreadCount(payload.unreadCount);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			if (
				errorMessage.includes("Failed to fetch") ||
				errorMessage.includes("NetworkError") ||
				errorMessage.includes("503")
			) {
				console.warn(
					"[notifications] Service unavailable, mark as read failed. Make sure notification service is running on port 4002.",
				);
				// Optimistically update local state even if service is unavailable
				setNotifications((prev) =>
					prev.map((item) =>
						ids.includes(item.id)
							? {
									...item,
									read: true,
								}
							: item,
					),
				);
				setUnreadCount((prev) => Math.max(0, prev - ids.length));
			} else {
				console.error("[notifications] Mark as read failed", error);
			}
		}
		},
		[userId],
	);

	const refresh = useCallback(async () => {
		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;
		await fetchNotifications(controller.signal);
	}, [fetchNotifications]);

	return useMemo(
		() => ({
			notifications,
			unreadCount,
			isLoading,
			markAsRead,
			refresh,
			setNotifications,
		}),
		[notifications, unreadCount, isLoading, markAsRead, refresh],
	);
}
