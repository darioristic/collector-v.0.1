/**
 * Emit notification via HTTP request to notification service
 * This function is kept for backward compatibility but now calls notification-service
 */
export const emitNotification = async (
	userId: string,
	event: string,
	payload: unknown,
) => {
	if (typeof userId !== "string" || userId.length === 0) {
		return;
	}

	const serviceUrl = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || "http://localhost:4002";

	try {
		// For notification:new events, create notification via API
		if (event === "notification:new" && typeof payload === "object" && payload !== null) {
			const notificationData = payload as {
				title?: string;
				message?: string;
				type?: string;
				link?: string;
				recipientId?: string;
				companyId?: string;
			};

			// Get token from cookies if available
			const token = typeof document !== "undefined" 
				? document.cookie
					.split("; ")
					.find((row) => row.startsWith("auth_session="))
					?.split("=")[1]
				: undefined;

			const response = await fetch(`${serviceUrl}/api/notifications`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token && {
						Authorization: `Bearer ${token}`,
					}),
				},
				body: JSON.stringify({
					title: notificationData.title || "Notification",
					message: notificationData.message || "",
					type: notificationData.type || "info",
					link: notificationData.link,
					recipientId: notificationData.recipientId || userId,
				}),
			});

			if (!response.ok) {
				console.error(
					`[socket] Failed to emit notification: ${response.status} ${response.statusText}`,
				);
			}
		}
	} catch (error) {
		console.error("[socket] Error emitting notification:", error);
		// Silently fail - notifications are not critical
	}
};
