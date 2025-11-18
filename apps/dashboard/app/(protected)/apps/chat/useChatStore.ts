import { create, type StateCreator } from "zustand";
import type {
	ChatConversation,
	ChatMessage,
} from "@/app/(protected)/apps/chat/api";

interface ChatItem extends ChatConversation {
	messages?: ChatMessage[];
	conversationId: string;
	otherUser: ChatConversation["user1"] | ChatConversation["user2"];
}

interface UseChatStore {
	selectedChat: ChatItem | null;
	showProfileSheet: boolean;
	setSelectedChat: (chat: ChatItem | null) => void;
	toggleProfileSheet: (value: boolean) => void;
	addMessage: (message: ChatMessage) => void;
	removeMessage: (messageId: string) => void;
	updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
	setMessages: (conversationId: string, messages: ChatMessage[]) => void;
}

const chatStore: StateCreator<UseChatStore> = (set, get) => ({
	selectedChat: null,
	showProfileSheet: false,
	setSelectedChat: (chat) => {
		console.log("[chat-store] Setting selected chat:", {
			conversationId: chat?.conversationId,
			hasOtherUser: !!chat?.otherUser,
			otherUserId: chat?.otherUser?.id,
			chat,
		});
		set(() => ({ selectedChat: chat }));
		// Verify it was set
		const state = get();
		console.log("[chat-store] Selected chat after set:", {
			conversationId: state.selectedChat?.conversationId,
			hasOtherUser: !!state.selectedChat?.otherUser,
			otherUserId: state.selectedChat?.otherUser?.id,
		});
	},
	toggleProfileSheet: (value) => set({ showProfileSheet: value }),
	addMessage: (message) => {
		const state = get();
		if (
			state.selectedChat &&
			state.selectedChat.conversationId === message.conversationId
		) {
			const existingMessages = state.selectedChat.messages || [];
			// Check if message already exists to avoid duplicates
			const messageExists = existingMessages.some(
				(msg) => msg.id === message.id,
			);
			if (messageExists) {
				console.log(
					"[chat-store] Message already exists, skipping:",
					message.id,
				);
				return;
			}
			set({
				selectedChat: {
					...state.selectedChat,
					messages: [...existingMessages, message],
				},
			});
		}
	},
	removeMessage: (messageId) => {
		const state = get();
		if (state.selectedChat && state.selectedChat.messages) {
			set({
				selectedChat: {
					...state.selectedChat,
					messages: state.selectedChat.messages.filter(
						(msg) => msg.id !== messageId,
					),
				},
			});
		}
	},
	updateMessage: (messageId, updates) => {
		const state = get();
		if (state.selectedChat && state.selectedChat.messages) {
			set({
				selectedChat: {
					...state.selectedChat,
					messages: state.selectedChat.messages.map((msg) =>
						msg.id === messageId ? { ...msg, ...updates } : msg,
					),
				},
			});
		}
	},
	setMessages: (conversationId, messages) => {
		const state = get();
		if (
			state.selectedChat &&
			state.selectedChat.conversationId === conversationId
		) {
			set({
				selectedChat: {
					...state.selectedChat,
					messages,
				},
			});
		}
	},
});

const useChatStore = create(chatStore);

export default useChatStore;
export type { ChatItem };
