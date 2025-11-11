"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Hash, Loader2, MessageSquarePlus, Search, UserCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ChannelMemberSummary, ChannelSummary } from "@/lib/teamchat/types";
import { cn } from "@/lib/utils";

type ChatSidebarProps = {
  channels: ChannelSummary[];
  directMessageTargets: ChannelMemberSummary[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onStartDirectMessage: (userId: string) => void;
  isCreatingDirectMessage: boolean;
};

const formatRelative = (date: Date | null) => {
  if (!date) {
    return "Bez poruka";
  }
  return formatDistanceToNow(date, { addSuffix: true });
};

export function ChatSidebar({
  channels,
  directMessageTargets,
  selectedChannelId,
  onSelectChannel,
  onStartDirectMessage,
  isCreatingDirectMessage
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");

  const filteredChannels = useMemo(() => {
    if (!search) {
      return channels;
    }
    const lower = search.toLowerCase();
    return channels.filter((channel) => channel.name.toLowerCase().includes(lower));
  }, [channels, search]);

  const filteredDmTargets = useMemo(() => {
    if (!search) {
      return directMessageTargets;
    }
    const lower = search.toLowerCase();
    return directMessageTargets.filter(
      (member) =>
        member.name.toLowerCase().includes(lower) || member.email.toLowerCase().includes(lower)
    );
  }, [directMessageTargets, search]);

  return (
    <Card className="border-border bg-card flex h-full w-full max-w-sm flex-col">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold">TeamChat</CardTitle>
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase">
            BETA
          </Badge>
        </div>
        <CardDescription>
          Razgovarajte sa svojim timom u realnom vremenu, delite fajlove i ostanite u toku.
        </CardDescription>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pretraži kanale ili članove..."
            className="h-10 rounded-full pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Kanali
            </h3>
            <Badge variant="outline" className="rounded-full">
              {channels.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {filteredChannels.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                Nijedan kanal ne odgovara pretrazi.
              </div>
            ) : (
              filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => onSelectChannel(channel.id)}
                  className={cn(
                    "group hover:border-border hover:bg-muted/50 relative flex w-full items-start gap-3 rounded-2xl border border-transparent px-4 py-3 text-left transition-all",
                    selectedChannelId === channel.id && "border-primary/60 bg-primary/10"
                  )}>
                  <div className="bg-primary/10 text-primary mt-1 flex size-10 items-center justify-center rounded-full">
                    <Hash className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-foreground text-sm font-semibold capitalize">
                        {channel.name}
                      </p>
                      <span className="text-muted-foreground text-xs">
                        {formatRelative(channel.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      {channel.lastMessagePreview ?? "Još uvek nema poruka"}
                    </p>
                  </div>
                  {channel.unreadCount > 0 ? (
                    <Badge className="bg-primary text-primary-foreground absolute top-3 right-4 rounded-full">
                      {channel.unreadCount}
                    </Badge>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Direktne poruke
            </h3>
            {isCreatingDirectMessage ? (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            ) : null}
          </div>

          <div className="space-y-2">
            {filteredDmTargets.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                Ni jedan član tima ne odgovara pretrazi.
              </div>
            ) : (
              filteredDmTargets.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onStartDirectMessage(member.id)}
                  className="group hover:border-border hover:bg-muted/50 relative flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left transition-all">
                  <Avatar className="border-border size-10 border">
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                    ) : (
                      <AvatarFallback className="bg-muted">
                        <UserCircle className="text-muted-foreground size-5" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-1 flex-col">
                    <p className="text-foreground text-sm font-semibold">{member.name}</p>
                    <p className="text-muted-foreground text-xs">{member.email}</p>
                  </div>
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      member.status === "online"
                        ? "bg-emerald-500"
                        : member.status === "idle"
                          ? "bg-amber-500"
                          : "bg-muted-foreground/60"
                    )}
                  />
                </button>
              ))
            )}
          </div>
        </section>

        <section className="border-primary/40 bg-primary/5 rounded-2xl border border-dashed p-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full">
              <MessageSquarePlus className="size-5" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-foreground text-sm font-semibold">Napravi novi kanal</h4>
              <p className="text-muted-foreground text-xs">
                Planiramo kreiranje kanala po timovima i projektima. Za sada koristite direktne
                poruke i postojeće kanale.
              </p>
              <Button variant="outline" size="sm" className="rounded-full" disabled>
                Uskoro dostupno
              </Button>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
