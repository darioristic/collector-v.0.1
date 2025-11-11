"use client";

import { Users, Lock, Hash } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ChannelMemberSummary, ChannelSummary } from "@/lib/teamchat/types";
import { cn } from "@/lib/utils";

type ChatHeaderProps = {
  channel: ChannelSummary | null;
  currentUserId: string;
};

const getDisplayMembers = (
  channel: ChannelSummary,
  currentUserId: string
): ChannelMemberSummary[] => {
  if (!channel.isPrivate) {
    return channel.members.slice(0, 5);
  }

  const others = channel.members.filter((member) => member.id !== currentUserId);
  return others.length > 0 ? others : channel.members;
};

const getChannelIcon = (channel: ChannelSummary | null) => {
  if (!channel) {
    return null;
  }
  if (channel.isPrivate) {
    return <Lock className="text-primary size-4" />;
  }
  return <Hash className="text-primary size-4" />;
};

export function ChatHeader({ channel, currentUserId }: ChatHeaderProps) {
  if (!channel) {
    return (
      <header className="border-border bg-card flex items-center justify-between rounded-2xl border px-6 py-4 shadow-sm">
        <div>
          <h2 className="text-foreground text-lg font-semibold">TeamChat</h2>
          <p className="text-muted-foreground text-sm">
            Odaberite kanal ili započnite direktnu poruku.
          </p>
        </div>
      </header>
    );
  }

  const members = getDisplayMembers(channel, currentUserId);

  return (
    <header className="border-border bg-card flex items-center justify-between rounded-2xl border px-6 py-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {getChannelIcon(channel)}
          <h2 className="text-foreground text-lg font-semibold capitalize">{channel.name}</h2>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
          <span className="bg-muted text-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
            <Users className="size-3.5" />
            {channel.members.length} član{channel.members.length === 1 ? "" : "ova"}
          </span>
          {channel.isPrivate ? (
            <span className="bg-muted text-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
              <Lock className="size-3.5" />
              Privatna konverzacija
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center -space-x-3">
        {members.map((member) => (
          <Avatar
            key={member.id}
            className={cn(
              "border-background border transition-transform hover:-translate-y-1",
              member.id === currentUserId && "ring-primary ring-2"
            )}>
            {member.avatarUrl ? (
              <AvatarImage src={member.avatarUrl} alt={member.name} />
            ) : (
              <AvatarFallback className="bg-muted text-xs font-medium uppercase">
                {member.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0] ?? "")
                  .join("") || "??"}
              </AvatarFallback>
            )}
          </Avatar>
        ))}
        {channel.members.length > members.length ? (
          <div className="border-background bg-muted text-foreground flex size-9 items-center justify-center rounded-full border text-xs font-semibold shadow-sm">
            +{channel.members.length - members.length}
          </div>
        ) : null}
      </div>
    </header>
  );
}
