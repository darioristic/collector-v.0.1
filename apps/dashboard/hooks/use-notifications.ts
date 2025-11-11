"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

import {
	notificationListResponseSchema,
	notificationPayloadSchema,
	notificationUpdateResponseSchema,
	type NotificationPayload,
} from "@/lib/validations/notifications";

type UseNotificationsOptions = {
	refreshOnFocus?: boolean;
	limit?: number;
};

type NotificationReadPayload = {
	updatedIds: string[];
	unreadCount: number;
};

const SOCKET_PATH = "/api/notifications/socket";

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
				});

				if (response.status === 401) {
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

				console.error("[notifications] Fetch failed", error);
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

		const endpoint =
			process.env.NEXT_PUBLIC_SOCKET_URL &&
			process.env.NEXT_PUBLIC_SOCKET_URL.length > 0
				? process.env.NEXT_PUBLIC_SOCKET_URL
				: window.location.origin;

		const socket = io(endpoint, {
			path: SOCKET_PATH,
			addTrailingSlash: false,
			withCredentials: true,
			transports: ["websocket"],
			query: { userId },
		});

		socketRef.current = socket;

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
				const response = await fetch("/api/notifications/read", {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ ids }),
				});

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
				console.error("[notifications] Mark as read failed", error);
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
