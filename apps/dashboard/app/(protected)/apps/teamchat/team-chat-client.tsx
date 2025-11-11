"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ChatHeader } from "@/app/(protected)/apps/teamchat/components/ChatHeader";
import { ChatSidebar } from "@/app/(protected)/apps/teamchat/components/ChatSidebar";
import { ChatWindow } from "@/app/(protected)/apps/teamchat/components/ChatWindow";
import { MessageInput } from "@/app/(protected)/apps/teamchat/components/MessageInput";
import {
  ensureDirectChannel,
  fetchChannels,
  fetchDirectMessageTargets,
  fetchMessages,
  sendMessage,
  uploadAttachment
} from "@/app/(protected)/apps/teamchat/api";
import type { MessageWithAuthor, TeamChatBootstrap } from "@/lib/teamchat/types";
import { getTeamChatSocket } from "@/lib/teamchat/socket-client";
import { useToast } from "@/hooks/use-toast";

type TeamChatClientProps = {
  bootstrap: TeamChatBootstrap;
};

type SocketMessagePayload = {
  channelId: string;
  message: MessageWithAuthor & { createdAt: string | Date };
};

export function TeamChatClient({ bootstrap }: TeamChatClientProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    bootstrap.channels[0]?.id ?? null
  );

  const channelsQuery = useQuery({
    queryKey: ["teamchat", "channels"],
    queryFn: fetchChannels,
    initialData: bootstrap.channels,
    refetchOnWindowFocus: false
  });

  const directTargetsQuery = useQuery({
    queryKey: ["teamchat", "direct-targets"],
    queryFn: fetchDirectMessageTargets,
    initialData: bootstrap.directMessageTargets,
    refetchOnWindowFocus: false
  });

  const selectedChannel = useMemo(() => {
    return channelsQuery.data?.find((channel) => channel.id === selectedChannelId) ?? null;
  }, [channelsQuery.data, selectedChannelId]);

  useEffect(() => {
    if (selectedChannelId) {
      return;
    }
    const fallback = channelsQuery.data?.[0]?.id;
    if (fallback) {
      setSelectedChannelId(fallback);
    }
  }, [channelsQuery.data, selectedChannelId]);

  const messagesQuery = useQuery({
    queryKey: ["teamchat", "messages", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) {
        return [];
      }
      return fetchMessages(selectedChannelId);
    },
    enabled: Boolean(selectedChannelId),
    refetchOnWindowFocus: false,
    retry: 1
  });

  useEffect(() => {
    const socket = getTeamChatSocket();

    const handleMessage = (payload: SocketMessagePayload) => {
      const normalized: MessageWithAuthor = {
        ...payload.message,
        createdAt:
          payload.message.createdAt instanceof Date
            ? payload.message.createdAt
            : new Date(payload.message.createdAt)
      };

      queryClient.setQueryData<MessageWithAuthor[] | undefined>(
        ["teamchat", "messages", payload.channelId],
        (previous) => {
          const existing = previous ?? [];
          if (existing.some((message) => message.id === normalized.id)) {
            return existing;
          }
          return [...existing, normalized].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          );
        }
      );
    };

    const handleChannelUpdated = () => {
      void queryClient.invalidateQueries({ queryKey: ["teamchat", "channels"] });
    };

    socket.on("message:new", handleMessage);
    socket.on("channel:updated", handleChannelUpdated);

    return () => {
      socket.off("message:new", handleMessage);
      socket.off("channel:updated", handleChannelUpdated);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!selectedChannelId) {
      return;
    }
    const socket = getTeamChatSocket();
    socket.emit("channel:join", { channelId: selectedChannelId });
  }, [selectedChannelId]);

  const uploadMutation = useMutation({
    mutationFn: uploadAttachment
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (message) => {
      queryClient.setQueryData<MessageWithAuthor[] | undefined>(
        ["teamchat", "messages", message.channelId],
        (previous) => {
          const exists = previous?.some((item) => item.id === message.id);
          if (exists) {
            return previous;
          }
          const next = [...(previous ?? []), message];
          return next.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
      );
      void queryClient.invalidateQueries({ queryKey: ["teamchat", "channels"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Slanje poruke nije uspelo. Pokušajte ponovo.";
      toast({
        title: "Greška",
        description: message,
        variant: "destructive"
      });
    }
  });

  const directMessageMutation = useMutation({
    mutationFn: ensureDirectChannel,
    onSuccess: async (channelId) => {
      setSelectedChannelId(channelId);
      await queryClient.invalidateQueries({ queryKey: ["teamchat", "channels"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Otvaranje direktne poruke nije uspelo.";
      toast({
        title: "Greška",
        description: message,
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = async ({ content, file }: { content: string; file: File | null }) => {
    if (!selectedChannelId) {
      toast({
        title: "Nema odabranog kanala",
        description: "Odaberite kanal kako biste poslali poruku.",
        variant: "destructive"
      });
      return;
    }

    let fileUrl: string | null = null;
    if (file) {
      const uploaded = await uploadMutation.mutateAsync(file);
      fileUrl = uploaded.url;
    }

    await sendMessageMutation.mutateAsync({
      channelId: selectedChannelId,
      content,
      fileUrl
    });
  };

  return (
    <div className="flex h-full w-full gap-4">
      <div className="hidden lg:block lg:w-80 xl:w-96">
        <ChatSidebar
          channels={channelsQuery.data ?? []}
          directMessageTargets={directTargetsQuery.data ?? []}
          selectedChannelId={selectedChannelId}
          onSelectChannel={setSelectedChannelId}
          onStartDirectMessage={(userId) => directMessageMutation.mutate(userId)}
          isCreatingDirectMessage={directMessageMutation.isPending}
        />
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <ChatHeader channel={selectedChannel} currentUserId={bootstrap.currentUser.id} />
        <ChatWindow
          messages={messagesQuery.data ?? []}
          currentUserId={bootstrap.currentUser.id}
          isLoading={messagesQuery.isLoading}
          channel={selectedChannel}
        />
        <MessageInput
          disabled={!selectedChannel}
          isSubmitting={sendMessageMutation.isPending || uploadMutation.isPending}
          onSubmit={handleSendMessage}
        />
      </div>
    </div>
  );
}
