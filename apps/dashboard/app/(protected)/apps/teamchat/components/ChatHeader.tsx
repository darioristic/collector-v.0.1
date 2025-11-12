"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ChannelSummary } from "@/lib/teamchat/types";

interface ChatHeaderProps {
  channel: ChannelSummary | null;
}

export function ChatHeader({ channel }: ChatHeaderProps) {
  if (!channel) {
    return (
      <div className="flex h-16 items-center border-b px-4">
        <span className="text-muted-foreground text-sm">No channel selected</span>
      </div>
    );
  }

  const isDM = channel.metadata?.type === "dm";
  const otherMember = isDM ? channel.members.find((m) => m.id !== channel.members[0]?.id) : null;

  return (
    <div className="flex h-16 items-center gap-3 border-b px-4">
      {isDM && otherMember && (
        <Avatar className="size-8">
          <AvatarImage src={otherMember.avatarUrl || undefined} alt={otherMember.name} />
          <AvatarFallback>{otherMember.name?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col">
        <span className="font-semibold">{channel.name}</span>
        {isDM && otherMember ? (
          <span className="text-muted-foreground text-xs">
            {otherMember.status === "online" ? "Online" : "Offline"}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">
            {channel.members.length} {channel.members.length === 1 ? "member" : "members"}
          </span>
        )}
      </div>
      {channel.isPrivate && <span className="text-muted-foreground ml-auto text-xs">Private</span>}
    </div>
  );
}
