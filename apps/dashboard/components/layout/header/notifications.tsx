"use client";

import { useMemo, type ReactNode } from "react";

import { BellIcon, ClockIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/components/providers/auth-provider";
import type { NotificationPayload } from "@/lib/validations/notifications";

const NotificationBellWrapper = ({ count, children }: { count: number; children: ReactNode }) => {
  return (
    <div className="relative">
      {children}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1 text-xs text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
};

const Notifications = () => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, isLoading } = useNotifications(user?.id ?? null, {
    refreshOnFocus: true,
    limit: 50
  });

  const formattedNotifications = useMemo(() => {
    return notifications.map((item) => {
      let formattedDate = "";

      try {
        formattedDate = formatDistanceToNow(new Date(item.createdAt), {
          addSuffix: true
        });
      } catch {
        formattedDate = "";
      }

      return {
        ...item,
        formattedDate
      };
    });
  }, [notifications]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      return;
    }

    const unreadIds = notifications.filter((item) => !item.read).map((item) => item.id);

    if (unreadIds.length > 0) {
      void markAsRead(unreadIds);
    }
  };

  const handleSelect = (notification: NotificationPayload) => {
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <NotificationBellWrapper count={unreadCount}>
          <Button size="icon" variant="ghost" className="relative">
            <BellIcon className="animate-tada" />
            {unreadCount > 0 && (
              <span className="bg-destructive absolute end-0 top-0 block size-2 shrink-0 rounded-full" />
            )}
          </Button>
        </NotificationBellWrapper>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={isMobile ? "center" : "end"} className="ms-4 w-80 p-0">
        <DropdownMenuLabel className="bg-background dark:bg-muted sticky top-0 z-10 p-0">
          <div className="flex justify-between border-b px-6 py-4">
            <div className="font-medium">Notifications</div>
            <Button variant="link" className="h-auto p-0 text-xs" size="sm" asChild>
              <Link href="#">View all</Link>
            </Button>
          </div>
        </DropdownMenuLabel>

        <ScrollArea className="h-[350px]">
          {formattedNotifications.length === 0 ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center px-4 text-sm">
              {isLoading ? "Učitavanje notifikacija..." : "Nema notifikacija."}
            </div>
          ) : (
            formattedNotifications.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="group flex cursor-pointer items-start gap-9 rounded-none border-b px-4 py-3"
                onSelect={() => handleSelect(item)}>
                <div className="flex flex-1 items-start gap-2">
                  <div className="flex-none">
                    <Avatar className="size-8">
                      <AvatarImage src={undefined} />
                      <AvatarFallback> {item.title.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="dark:group-hover:text-default-800 truncate text-sm font-medium">
                      {item.title}
                    </div>
                    <div className="dark:group-hover:text-default-700 text-muted-foreground line-clamp-1 text-xs">
                      {item.message}
                    </div>
                    <div className="dark:group-hover:text-default-500 text-muted-foreground flex items-center gap-1 text-xs">
                      <ClockIcon className="size-3!" />
                      {item.formattedDate}
                    </div>
                  </div>
                </div>
                {!item.read && (
                  <div className="flex-0">
                    <span className="bg-destructive/80 block size-2 rounded-full border" />
                  </div>
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
