"use client";

import { useEffect, useMemo, useRef } from "react";

import { Card, CardContent } from "@/components/ui/card";
import type { ChannelSummary, MessageWithAuthor } from "@/lib/teamchat/types";

import { MessageBubble } from "./MessageBubble";

type ChatWindowProps = {
  messages: MessageWithAuthor[];
  currentUserId: string;
  isLoading: boolean;
  channel: ChannelSummary | null;
};

export function ChatWindow({ messages, currentUserId, isLoading, channel }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    const currentChannelId = channel?.id ?? "unknown";
    const latestMessageId = messages.at(-1)?.id ?? "none";
    element.setAttribute("data-scroll-channel", currentChannelId);
    element.setAttribute("data-scroll-last-message", latestMessageId);
    element.scrollTop = element.scrollHeight;
  }, [messages, channel?.id]);

  const groupedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const previous = index > 0 ? messages[index - 1] : null;
      const showAvatar = !previous || previous.senderId !== message.senderId;
      const showAuthorName = showAvatar;
      const isOwn = message.senderId === currentUserId;
      return {
        message,
        showAvatar,
        showAuthorName,
        isOwn
      };
    });
  }, [messages, currentUserId]);

  if (!channel) {
    return (
      <Card className="border-muted-foreground/40 bg-muted/20 flex h-full w-full flex-col justify-center gap-4 border-dashed text-center">
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <h2 className="text-foreground text-lg font-semibold">Odaberite kanal</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            Izaberite kanal ili započnite novu direktnu poruku sa članom tima.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    const placeholderKeys = ["s1", "s2", "s3", "s4", "s5", "s6"];
    return (
      <Card className="border-border bg-background flex h-full w-full flex-col">
        <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden py-8">
          {placeholderKeys.map((key) => (
            <div
              key={key}
              className="border-border/70 bg-muted/50 flex w-full max-w-[70%] flex-col gap-2 rounded-2xl border px-4 py-3 shadow-sm">
              <div className="bg-muted h-3 w-24 rounded-full" />
              <div className="bg-muted h-3 w-full rounded-full" />
              <div className="bg-muted h-3 w-1/2 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-background flex h-full w-full flex-col">
      <CardContent ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
        {groupedMessages.length === 0 ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-center text-sm">
            <p>Još uvek nema poruka u {channel.isPrivate ? "ovoj konverzaciji" : "ovom kanalu"}.</p>
          </div>
        ) : (
          groupedMessages.map(({ message, isOwn, showAvatar, showAuthorName }) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar && !isOwn}
              showAuthorName={showAuthorName && !isOwn}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
