import { format } from "date-fns";
import { Ellipsis, FileIcon, PlayIcon } from "lucide-react";
import Image from "next/image";
import { useId } from "react";
import { MessageStatusIcon } from "@/app/(protected)/apps/chat/components/message-status-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChatMessageProps } from "../types";

type ChatBubbleProps = {
  message: ChatMessageProps;
  type?: string;
  createdAt?: string;
};

function TextChatBubble({ message, createdAt }: { message: ChatMessageProps; createdAt?: string }) {
  const formattedTime = createdAt ? format(new Date(createdAt), "HH:mm") : null;

  // Force alignment based on own_message
  // CRITICAL: Only align right if own_message is EXPLICITLY true
  const isOwnMessage = message.own_message === true;

  return (
    <div
      className="flex w-full"
      style={
        {
          justifyContent: isOwnMessage ? "flex-end" : "flex-start",
          display: "flex"
        } as React.CSSProperties
      }
      data-own-message={isOwnMessage}
      data-test-align={isOwnMessage ? "right" : "left"}>
      <div
        className="flex max-w-[70%] flex-col"
        style={{
          alignItems: isOwnMessage ? "flex-end" : "flex-start"
        }}>
        <div className="flex items-center gap-2">
          {!message.own_message && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Forward</DropdownMenuItem>
                  <DropdownMenuItem>Star</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="bg-muted inline-flex rounded-md border p-4">{message.content}</div>
          {message.own_message && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Forward</DropdownMenuItem>
                  <DropdownMenuItem>Star</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div
          className={cn("flex items-center gap-2", {
            "justify-end": message.own_message,
            "justify-start": !message.own_message
          })}>
          <time className="text-muted-foreground mt-1 flex items-center text-xs">
            {formattedTime || "05:23 PM"}
          </time>
          {message.own_message && (
            <MessageStatusIcon status={message.status || (message.read ? "read" : "sent")} />
          )}
        </div>
      </div>
    </div>
  );
}

function FileChatBubble({ message, createdAt }: { message: ChatMessageProps; createdAt?: string }) {
  const formattedTime = createdAt ? format(new Date(createdAt), "HH:mm") : null;
  const isOwnMessage = message.own_message === true;
  return (
    <div
      className="flex w-full"
      style={
        {
          justifyContent: isOwnMessage ? "flex-end" : "flex-start",
          display: "flex"
        } as React.CSSProperties
      }>
      <div
        className="flex max-w-[70%] flex-col"
        style={{
          alignItems: isOwnMessage ? "flex-end" : "flex-start"
        }}>
        <div className="flex items-center gap-2">
          {!message.own_message && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Forward</DropdownMenuItem>
                  <DropdownMenuItem>Star</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="bg-muted inline-flex items-start rounded-md border p-4">
            <FileIcon className="me-4 mt-1 size-8 opacity-50" strokeWidth={1.5} />
            <div className="flex flex-col gap-2">
              <div className="text-sm">
                {message.data?.file_name}
                <span className="text-muted-foreground ms-2 text-sm">({message.data?.size})</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  Preview
                </Button>
              </div>
            </div>
          </div>
          {message.own_message && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Forward</DropdownMenuItem>
                  <DropdownMenuItem>Star</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div
          className={cn("flex items-center gap-2", {
            "justify-end": message.own_message,
            "justify-start": !message.own_message
          })}>
          <time className="text-muted-foreground mt-1 flex items-center text-xs">
            {formattedTime || "05:23 PM"}
          </time>
          {message.own_message && (
            <MessageStatusIcon status={message.status || (message.read ? "read" : "sent")} />
          )}
        </div>
      </div>
    </div>
  );
}

function VideoChatBubble({
  message,
  createdAt
}: {
  message: ChatMessageProps;
  createdAt?: string;
}) {
  const formattedTime = createdAt ? format(new Date(createdAt), "HH:mm") : null;
  const isOwnMessage = message.own_message === true;
  return (
    <div
      className="flex w-full"
      style={
        {
          justifyContent: isOwnMessage ? "flex-end" : "flex-start",
          display: "flex"
        } as React.CSSProperties
      }>
      <div
        className="flex max-w-[70%] flex-col"
        style={
          {
            alignItems: isOwnMessage ? "flex-end" : "flex-start",
            display: "flex"
          } as React.CSSProperties
        }>
        <div className="flex items-center gap-4">
          {!message.own_message && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Forward</DropdownMenuItem>
                  <DropdownMenuItem>Star</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div
            style={{
              backgroundImage: `url(${message?.data?.cover})`
            }}
            className="relative flex aspect-4/3 w-52 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-cover transition-opacity hover:opacity-90">
            <PlayIcon className="size-8 text-white/80" />
            <div className="absolute end-2 top-2 text-xs font-semibold text-white/60">
              {message?.data?.duration}
            </div>
          </div>
          {message.own_message && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Forward</DropdownMenuItem>
                  <DropdownMenuItem>Star</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div
          className={cn("flex items-center gap-2", {
            "justify-end": message.own_message,
            "justify-start": !message.own_message
          })}>
          <time className="text-muted-foreground mt-1 flex items-center text-xs">
            {formattedTime || "05:23 PM"}
          </time>
          {message.own_message && (
            <MessageStatusIcon status={message.status || (message.read ? "read" : "sent")} />
          )}
        </div>
      </div>
    </div>
  );
}

function SoundChatBubble({
  message,
  createdAt
}: {
  message: ChatMessageProps;
  createdAt?: string;
}) {
  const formattedTime = createdAt ? format(new Date(createdAt), "HH:mm") : null;
  const audioId = useId();
  const isOwnMessage = message.own_message === true;
  return (
    <div
      className="flex w-full"
      style={
        {
          justifyContent: isOwnMessage ? "flex-end" : "flex-start",
          display: "flex"
        } as React.CSSProperties
      }>
      <div
        className="flex max-w-[70%] flex-col"
        style={
          {
            alignItems: isOwnMessage ? "flex-end" : "flex-start",
            display: "flex"
          } as React.CSSProperties
        }>
        <div className="flex items-center gap-2">
          {!message.own_message && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Forward</DropdownMenuItem>
                  <DropdownMenuItem>Star</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="bg-muted inline-flex gap-4 rounded-md p-4">
            {message.content}
            <audio id={audioId} className="block w-80" controls>
              <source src={message?.data?.path} type="audio/mpeg" />
              <track kind="captions" srcLang="en" label="English captions" />
            </audio>
          </div>
          {message.own_message && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Forward</DropdownMenuItem>
                  <DropdownMenuItem>Star</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div
          className={cn("flex items-center gap-2", {
            "justify-end": message.own_message,
            "justify-start": !message.own_message
          })}>
          <time className="text-muted-foreground mt-1 flex items-center text-sm">
            {formattedTime || "05:23 PM"}
          </time>
          {message.own_message && (
            <MessageStatusIcon status={message.status || (message.read ? "read" : "sent")} />
          )}
        </div>
      </div>
    </div>
  );
}

function ImageChatBubble({
  message,
  createdAt
}: {
  message: ChatMessageProps;
  createdAt?: string;
}) {
  const formattedTime = createdAt ? format(new Date(createdAt), "HH:mm") : null;
  const images_limit = 4;
  const images = message?.data?.images ?? [];
  const images_with_limit = images.slice(0, images_limit);
  const isOwnMessage = message.own_message === true;

  return (
    <div
      className="flex w-full"
      style={
        {
          justifyContent: isOwnMessage ? "flex-end" : "flex-start",
          display: "flex"
        } as React.CSSProperties
      }>
      <div
        className="flex max-w-[70%] flex-col"
        style={
          {
            alignItems: isOwnMessage ? "flex-end" : "flex-start",
            display: "flex"
          } as React.CSSProperties
        }>
        <div className="flex items-center gap-2">
          {!message.own_message && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Forward</DropdownMenuItem>
                  <DropdownMenuItem>Star</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="bg-muted inline-flex gap-4 rounded-md border p-4">
            {message.content}
            {images.length > 0 && (
              <div
                className={cn("grid gap-2", {
                  "grid-cols-1": images.length === 1,
                  "grid-cols-2": images.length > 1
                })}>
                {images_with_limit.map((image, index) => (
                  <figure
                    className="relative cursor-pointer overflow-hidden rounded-lg transition-opacity hover:opacity-90"
                    key={typeof image === "string" ? image : `image-${index}`}>
                    <Image
                      src={image}
                      className="aspect-4/3 object-cover"
                      width={100}
                      height={100}
                      alt="shadcn/ui"
                      unoptimized
                    />
                    {index + 1 === images_limit && images.length > images_limit && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-3xl font-semibold text-white">
                        +{images.length - images_with_limit.length}
                      </div>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </div>
          {message.own_message && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Forward</DropdownMenuItem>
                  <DropdownMenuItem>Star</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div
          className={cn("mt-1 flex items-center gap-2", {
            "justify-end": message.own_message,
            "justify-start": !message.own_message
          })}>
          <time className="text-muted-foreground mt-1 flex items-center text-xs">
            {formattedTime || "05:23 PM"}
          </time>
          {message.own_message && (
            <MessageStatusIcon status={message.status || (message.read ? "read" : "sent")} />
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatBubble({ message, type, createdAt }: ChatBubbleProps) {
  switch (type) {
    case "text":
      return <TextChatBubble message={message} createdAt={createdAt} />;
    case "video":
      return <VideoChatBubble message={message} createdAt={createdAt} />;
    case "sound":
      return <SoundChatBubble message={message} createdAt={createdAt} />;
    case "image":
      return <ImageChatBubble message={message} createdAt={createdAt} />;
    case "file":
      return <FileChatBubble message={message} createdAt={createdAt} />;
    default:
      break;
  }
}
