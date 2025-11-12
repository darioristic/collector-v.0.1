"use client";

import { Search } from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ChannelMemberSummary, ChannelSummary } from "@/lib/teamchat/types";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  channels: ChannelSummary[];
  directMessageTargets: ChannelMemberSummary[];
  selectedChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
}

export function ChatSidebar({
  channels,
  directMessageTargets,
  selectedChannelId,
  onChannelSelect
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredChannels = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return channels;
    }
    const term = searchTerm.toLowerCase();
    return channels.filter((channel) => channel.name.toLowerCase().includes(term));
  }, [channels, searchTerm]);

  const filteredDMTargets = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return directMessageTargets;
    }
    const term = searchTerm.toLowerCase();
    return directMessageTargets.filter(
      (target) =>
        target.name.toLowerCase().includes(term) || target.email.toLowerCase().includes(term)
    );
  }, [directMessageTargets, searchTerm]);

  return (
    <Card className="flex h-full w-80 flex-col">
      <CardHeader>
        <CardTitle>Channels</CardTitle>
        <div className="relative mt-4">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="divide-y">
          {filteredChannels.length > 0 && (
            <div className="p-2">
              <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                Channels
              </h3>
              {filteredChannels.map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    selectedChannelId === channel.id && "bg-muted"
                  )}
                  onClick={() => onChannelSelect(channel.id)}>
                  <span className="flex-1 truncate text-left">{channel.name}</span>
                  {channel.unreadCount > 0 && (
                    <Badge variant="secondary">{channel.unreadCount}</Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
          {filteredDMTargets.length > 0 && (
            <div className="p-2">
              <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                Direct Messages
              </h3>
              {filteredDMTargets.map((target) => (
                <Button
                  key={target.id}
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    // Handle DM channel creation
                  }}>
                  <Avatar className="size-6">
                    <AvatarImage src={target.avatarUrl || undefined} alt={target.name} />
                    <AvatarFallback>{target.name?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate text-left">{target.name}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
