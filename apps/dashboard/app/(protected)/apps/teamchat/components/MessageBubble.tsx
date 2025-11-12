"use client";

import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MessageWithAuthor } from "@/lib/teamchat/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: MessageWithAuthor;
  currentUserId: string;
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isOwnMessage = message.senderId === currentUserId;
  const displayName = message.senderName || message.senderEmail;

  return (
    <div className={cn("flex gap-3", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
      {!isOwnMessage && (
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={message.senderAvatarUrl || undefined} alt={displayName} />
          <AvatarFallback>{displayName?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isOwnMessage ? "items-end" : "items-start"
        )}>
        {!isOwnMessage && (
          <span className="text-muted-foreground text-xs font-semibold">{displayName}</span>
        )}
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
          {message.content && (
            <p className="text-sm wrap-break-word whitespace-pre-wrap">{message.content}</p>
          )}
          {message.attachment && (
            <div className="mt-2">
              {message.attachment.mimeType?.startsWith("image/") ? (
                <Image
                  src={message.attachment.url}
                  alt={message.attachment.name || "Image"}
                  width={400}
                  height={300}
                  className="max-w-full rounded-md"
                  unoptimized
                />
              ) : (
                <a
                  href={message.attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline">
                  {message.attachment.name || "Attachment"}
                </a>
              )}
            </div>
          )}
          {message.fileUrl && !message.attachment && (
            <div className="mt-2">
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline">
                Download file
              </a>
            </div>
          )}
        </div>
        <span className="text-muted-foreground text-xs">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </span>
      </div>
    </div>
  );
}
