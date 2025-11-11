"use client";

import * as React from "react";
import { useEffect } from "react";
import { ChevronsUpDown, ShoppingBagIcon, UserCircle2Icon, XIcon } from "lucide-react";
import { PlusIcon } from "@radix-ui/react-icons";
import { usePathname } from "next/navigation";
import { useIsTablet } from "@/hooks/use-mobile";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/layout/sidebar/nav-main";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import Logo from "@/components/layout/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const isTablet = useIsTablet();
  const [isDownloadBannerVisible, setIsDownloadBannerVisible] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname]);

  useEffect(() => {
    setOpen(!isTablet);
  }, [isTablet]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="size-10 rounded-md" />
            <div className="flex flex-1 flex-col gap-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="space-y-2 p-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </SidebarContent>
        <SidebarFooter>
          <Skeleton className="h-20 w-full rounded-md" />
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="hover:text-foreground h-10 group-data-[collapsible=icon]:px-0! hover:bg-primary/5">
                  <Logo />
                  <span className="font-semibold">Cloud Native d.o.o.</span>
                  <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="mt-4 w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}>
                <DropdownMenuLabel>Companies</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-md border">
                    <ShoppingBagIcon className="text-muted-foreground size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">E-commerce</span>
                    <span className="text-xs text-green-700">Active</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-md border">
                    <UserCircle2Icon className="text-muted-foreground size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Blog Platform</span>
                    <span className="text-muted-foreground text-xs">Inactive</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Button className="w-full">
                  <PlusIcon />
                  New Company
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <NavMain />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        {isDownloadBannerVisible && (
          <Card className="relative gap-4 overflow-hidden py-4 group-data-[collapsible=icon]:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 size-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsDownloadBannerVisible(false)}
              aria-label="Zatvori promotivni baner">
              <XIcon className="size-4" />
            </Button>
            <CardHeader className="px-3">
              <CardTitle>Download</CardTitle>
              <CardDescription>
                Unlock lifetime access to all dashboards, templates and components.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3">
              <Button className="w-full" asChild>
                <Link href="https://shadcnuikit.com/pricing" target="_blank">
                  Get Shadcn UI Kit
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="hidden">
          <NavUser />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
