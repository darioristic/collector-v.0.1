"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { MessageWithAuthor } from "@/lib/teamchat/types";
import { MessageBubble } from "./MessageBubble";

interface ChatWindowProps {
  messages: MessageWithAuthor[];
  currentUserId: string;
}

export function ChatWindow({ messages, currentUserId }: ChatWindowProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = React.useRef(messages.length);

  React.useEffect(() => {
    if (messages.length !== prevMessagesLengthRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages.length]);

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-center text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} currentUserId={currentUserId} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
    </Card>
  );
}
