"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import {
  type BootstrapResponse,
  bootstrapTeamChat,
  fetchMessages,
  sendMessage,
  uploadAttachment,
  fetchChatHealth
} from "@/app/(protected)/apps/teamchat/api";
import { ChatHeader } from "@/app/(protected)/apps/teamchat/components/ChatHeader";
import { ChatSidebar } from "@/app/(protected)/apps/teamchat/components/ChatSidebar";
import { ChatWindow } from "@/app/(protected)/apps/teamchat/components/ChatWindow";
import { MessageInput } from "@/app/(protected)/apps/teamchat/components/MessageInput";
import { useToast } from "@/hooks/use-toast";
import { getTeamChatSocket } from "@/lib/teamchat/socket-client";
import type { ChannelSummary, MessageWithAuthor } from "@/lib/teamchat/types";

interface TeamChatClientProps {
  initialData: BootstrapResponse;
  currentUserId: string;
}

export function TeamChatClient({ initialData, currentUserId }: TeamChatClientProps) {
  const [selectedChannelId, setSelectedChannelId] = React.useState<string | null>(
    initialData.channels[0]?.id || null
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const bootstrapQuery = useQuery({
    queryKey: ["teamchat", "bootstrap"],
    queryFn: bootstrapTeamChat,
    initialData,
    staleTime: 1000 * 60 * 5
  });

  const channels = bootstrapQuery.data?.channels || [];
  const directMessageTargets = bootstrapQuery.data?.directMessageTargets || [];

  const messagesQuery = useQuery({
    queryKey: ["teamchat", "messages", selectedChannelId],
    queryFn: () => {
      if (!selectedChannelId) {
        throw new Error("Channel ID is required");
      }
      return fetchMessages(selectedChannelId);
    },
    enabled: Boolean(selectedChannelId),
    staleTime: 1000 * 30
  });

  const selectedChannel = React.useMemo(() => {
    return channels.find((c) => c.id === selectedChannelId) || null;
  }, [channels, selectedChannelId]);

  const healthQuery = useQuery({
    queryKey: ["teamchat", "health"],
    queryFn: fetchChatHealth,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamchat", "messages"] });
      queryClient.invalidateQueries({ queryKey: ["teamchat", "bootstrap"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: uploadAttachment,
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    }
  });

  const handleSend = React.useCallback(
    (content: string, fileUrl?: string | null) => {
      if (!selectedChannelId) {
        return;
      }
      
      // Ensure content is a non-empty string (required by schema)
      if (!content && !fileUrl) {
        return;
      }

      sendMessageMutation.mutate({
        channelId: selectedChannelId,
        content: content || "",
        fileUrl: fileUrl || undefined
      });
    },
    [selectedChannelId, sendMessageMutation]
  );

  const handleFileUpload = React.useCallback(
    async (file: File): Promise<string | null> => {
      try {
        const result = await uploadMutation.mutateAsync(file);
        return result.url;
      } catch {
        return null;
      }
    },
    [uploadMutation]
  );

  React.useEffect(() => {
    if (!selectedChannelId || typeof window === "undefined") {
      return;
    }

    try {
      const socket = getTeamChatSocket();
      socket.emit("channel:join", `channel:${selectedChannelId}`);

      const handleNewMessage = (payload: unknown) => {
        const message = payload as MessageWithAuthor;
        if (message.channelId === selectedChannelId) {
          queryClient.setQueryData<MessageWithAuthor[]>(
            ["teamchat", "messages", selectedChannelId],
            (old) => {
              if (!old) return [message];
              return [...old, message];
            }
          );
          queryClient.invalidateQueries({
            queryKey: ["teamchat", "bootstrap"]
          });
        }
      };

      const handleChannelUpdated = (payload: unknown) => {
        const channel = payload as ChannelSummary;
        if (channel.id === selectedChannelId) {
          queryClient.invalidateQueries({
            queryKey: ["teamchat", "bootstrap"]
          });
          queryClient.invalidateQueries({ queryKey: ["teamchat", "messages"] });
        }
      };

      socket.on("message:new", handleNewMessage);
      socket.on("channel:updated", handleChannelUpdated);

      return () => {
        socket.off("message:new", handleNewMessage);
        socket.off("channel:updated", handleChannelUpdated);
        socket.emit("channel:leave", `channel:${selectedChannelId}`);
      };
    } catch (error) {
      console.error("[teamchat] Socket connection error:", error);
    }
  }, [selectedChannelId, queryClient]);

  const handleChannelSelect = React.useCallback((channelId: string) => {
    setSelectedChannelId(channelId);
  }, []);

  return (
    <div className="flex h-full gap-4">
      <ChatSidebar
        channels={channels}
        directMessageTargets={directMessageTargets}
        selectedChannelId={selectedChannelId}
        onChannelSelect={handleChannelSelect}
      />
      <div className="flex flex-1 flex-col gap-4">
        <ChatHeader channel={selectedChannel} chatServiceOnline={Boolean(healthQuery.data)} />
        <ChatWindow messages={messagesQuery.data || []} currentUserId={currentUserId} />
        <MessageInput
          onSend={handleSend}
          onFileUpload={handleFileUpload}
          disabled={!selectedChannelId || sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
}
