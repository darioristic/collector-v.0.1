"use client";

import { format } from "date-fns";
import { LinkIcon } from "lucide-react";
import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MessageWithAuthor } from "@/lib/teamchat/types";
import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  message: MessageWithAuthor;
  isOwn: boolean;
  showAvatar: boolean;
  showAuthorName: boolean;
};

const isImage = (url: string) => {
  if (!url) {
    return false;
  }
  const lower = url.toLowerCase();
  return lower.startsWith("data:image") || /\.(png|jpe?g|gif|webp|svg)$/.test(lower);
};

const getInitials = (displayName: string) => {
  const parts = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return parts.join("") || "??";
};

export function MessageBubble({ message, isOwn, showAvatar, showAuthorName }: MessageBubbleProps) {
  const timestamp = format(message.createdAt, "HH:mm");
  const bubbleClasses = cn(
    "max-w-[min(80ch,80%)] rounded-2xl px-4 py-3 text-sm shadow-sm transition-colors",
    isOwn
      ? "ml-auto rounded-br-md bg-primary text-primary-foreground"
      : "mr-auto rounded-bl-md bg-muted/60 text-foreground"
  );

  return (
    <div className={cn("flex w-full gap-3", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && (
        <div className={cn("mt-auto", showAvatar ? "opacity-100" : "opacity-0")}>
          <Avatar className="size-8">
            {message.senderAvatarUrl ? (
              <AvatarImage src={message.senderAvatarUrl} alt={message.senderName} />
            ) : (
              <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
            )}
          </Avatar>
        </div>
      )}
      <div className="flex flex-col gap-1">
        {showAuthorName && !isOwn && (
          <span className="text-muted-foreground text-xs font-medium">{message.senderName}</span>
        )}
        <div className={bubbleClasses}>
          {message.content ? (
            <p className="leading-relaxed whitespace-pre-line">{message.content}</p>
          ) : null}

          {message.fileUrl ? (
            <div className="border-border bg-background/80 mt-3 overflow-hidden rounded-xl border">
              {isImage(message.fileUrl) ? (
                <Image
                  src={message.fileUrl}
                  alt="Prilog"
                  width={320}
                  height={220}
                  unoptimized
                  className="h-auto w-full object-cover"
                />
              ) : (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary flex items-center gap-2 px-3 py-2 text-sm font-medium underline-offset-4 hover:underline">
                  <LinkIcon className="size-4" />
                  Preuzmi prilog
                </a>
              )}
            </div>
          ) : null}
        </div>
        <span className="text-muted-foreground ml-auto text-xs">{timestamp}</span>
      </div>
    </div>
  );
}
