"use client";

import {
	useNotifications as novuUseNotifications,
	useCounts,
} from "@novu/react";
import { useCallback, useMemo } from "react";

type NovuNotification = {
	_id?: string;
	payload?: Record<string, unknown> & {
		title?: string;
		message?: string;
		type?: "info" | "success" | "warning" | "error";
		link?: string;
		companyId?: string;
	};
	read?: boolean;
	_subscriberId?: string;
	createdAt?: string | Date;
};

export function useNovuNotifications() {
	const {
		notifications: novuNotifications,
		fetchMore,
		hasMore,
		isFetching,
		isLoading,
		refetch,
	} = novuUseNotifications();

	const { counts } = useCounts({ filters: [{ seen: false }] });

	const notifications = useMemo(() => {
		const list = Array.isArray(novuNotifications)
			? (novuNotifications as unknown[])
			: [];
		return list.map((raw) => {
			const notification = raw as NovuNotification;
			return {
				id: notification._id,
				title: notification.payload?.title as string | undefined,
				message: notification.payload?.message as string | undefined,
				type: ((notification.payload?.type as
					| "info"
					| "success"
					| "warning"
					| "error") || "info") as "info" | "success" | "warning" | "error",
				link: notification.payload?.link as string | undefined,
				read: notification.read || false,
				recipientId: notification._subscriberId || "",
				companyId: notification.payload?.companyId as string | undefined,
				createdAt: notification.createdAt
					? new Date(notification.createdAt).toISOString()
					: new Date().toISOString(),
			};
		});
	}, [novuNotifications]);

	const refresh = useCallback(async () => {
		await refetch();
	}, [refetch]);

	const unseenCount = (counts || [])
		.map((c) => c.count)
		.reduce((sum, n) => sum + n, 0);

	return {
		notifications,
		unreadCount: unseenCount || 0,
		isLoading: isLoading || isFetching,
		refresh,
		fetchNextPage: fetchMore,
		hasNextPage: hasMore,
	};
}
