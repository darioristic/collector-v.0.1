'use client';

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheck, Bell, CreditCard, LogOut, Sparkles } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { generateAvatarFallback } from "@/lib/utils";

export default function UserMenu() {
  const { user, setAuth } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const fallback = React.useMemo(
    () => generateAvatarFallback(user?.name ?? user?.email ?? "U"),
    [user?.email, user?.name]
  );

  const handleLogout = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST"
        });

        if (!response.ok && response.status !== 204) {
          const payload = await response.json().catch(() => null);
          const message =
            (payload && typeof payload === "object" && "message" in payload && payload.message) || "Odjava nije uspela.";
          throw new Error(message as string);
        }

        setAuth(null);
        router.push("/login");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Odjava nije uspela.");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarImage src={`/images/avatars/01.png`} alt="shadcn ui kit" />
          <AvatarFallback className="rounded-lg">{fallback || "U"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-60" align="end">
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar>
              <AvatarImage src={`/images/avatars/01.png`} alt="shadcn ui kit" />
              <AvatarFallback className="rounded-lg">{fallback || "U"}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user?.name ?? "Nepoznat korisnik"}</span>
              <span className="text-muted-foreground truncate text-xs">{user?.email ?? "n/a"}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="https://shadcnuikit.com/pricing" target="_blank">
              <Sparkles /> Upgrade to Pro
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            if (!isPending) {
              handleLogout();
            }
          }}
          disabled={isPending}>
          <LogOut />
          {isPending ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
