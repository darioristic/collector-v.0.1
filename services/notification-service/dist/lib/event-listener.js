import { createNotification } from "./repository.js";
export function setupEventListener(redis, io, cache) {
    // Listen for new message events
    redis.subscribe("events:new_message", async (message) => {
        try {
            const data = JSON.parse(message);
            const { conversationId, message: chatMessage, senderId, recipientId, recipientStatus, companyId, } = data;
            const alwaysNotifyDM = process.env.ALWAYS_NOTIFY_DM_ONLINE === "true";
            const alwaysNotifyChannel = process.env.ALWAYS_NOTIFY_CHANNEL_ONLINE === "true";
            // For 1-on-1 chat, check if recipient is offline
            if (conversationId && recipientId && senderId) {
                // Check if recipient is online via Socket.IO
                const recipientSockets = await io
                    .in(`user:${recipientId}`)
                    .fetchSockets();
                const isRecipientOnline = recipientSockets.length > 0;
                // Create notification if recipient is offline (based on sockets), or always when enabled
                if (alwaysNotifyDM || !isRecipientOnline) {
                    const notification = await createNotification(companyId, recipientId, "New message", chatMessage?.content || "You have a new message", "info", `/apps/chat?conversation=${conversationId}`, cache);
                    // Emit socket event if recipient comes online later
                    io.to(`user:${recipientId}`).emit("notification:new", notification);
                    console.log(`[notification-service] Notification created for offline user ${recipientId}`);
                }
            }
            else {
                // For channel messages, create notifications for all members except sender
                const memberIds = data.memberIds || [];
                const channelId = data.channelId;
                for (const memberId of memberIds) {
                    if (memberId !== senderId) {
                        // Check if member is online
                        const memberSockets = await io
                            .in(`user:${memberId}`)
                            .fetchSockets();
                        const isMemberOnline = memberSockets.length > 0;
                        // Create notification if member is offline, or always when enabled
                        if (alwaysNotifyChannel || !isMemberOnline) {
                            const notification = await createNotification(companyId || "", memberId, "New message", chatMessage?.content || "You have a new message", "info", channelId ? `/teamchat?channel=${channelId}` : undefined, cache);
                            // Emit socket event if member comes online later
                            io.to(`user:${memberId}`).emit("notification:new", notification);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error("[notification-service] Error processing new message event:", error);
        }
    });
}
