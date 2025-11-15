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

    try {
        if (event === "notification:new" && typeof payload === "object" && payload !== null) {
            const notificationData = payload as {
                title?: string;
                message?: string;
                type?: string;
                link?: string;
                recipientId?: string;
                companyId?: string;
            };

            const response = await fetch(`/api/notifications/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
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
