"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from "@/components/ui/sidebar";
import {
  ArchiveRestoreIcon,
  BadgeDollarSignIcon,
  BrainCircuitIcon,
  ChartBarDecreasingIcon,
  ChartPieIcon,
  ChevronRight,
  ClipboardCheckIcon,
  FingerprintIcon,
  FolderDotIcon,
  FolderIcon,
  KeyIcon,
  MailIcon,
  MessageSquareIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  ShoppingBagIcon,
  UserIcon,
  UsersIcon,
  WalletMinimalIcon,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type NavGroup = {
  title: string;
  items: NavItem;
};

type NavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  isComing?: boolean;
  isDataBadge?: string;
  isNew?: boolean;
  newTab?: boolean;
  items?: NavItem;
}[];

export const navItems: NavGroup[] = [
  {
    title: "My Things",
    items: [
      {
        title: "Dashboard",
        href: "/finance",
        icon: WalletMinimalIcon
      },
      {
        title: "Chats",
        href: "/apps/chat",
        icon: MessageSquareIcon,
        isDataBadge: "5"
      },
      {
        title: "Inbox",
        href: "/apps/mail",
        icon: MailIcon
      },
      {
        title: "Tasks",
        href: "/apps/tasks",
        icon: ClipboardCheckIcon
      }
    ]
  },
  {
    title: "Sales and Finance",
    items: [
      {
        title: "Accounts",
        href: "/accounts/companies",
        icon: UsersIcon,
        items: [
          { title: "Companies", href: "/accounts/companies" },
          { title: "Contacts", href: "/accounts/contacts" }
        ]
      },
      {
        title: "Sales",
        href: "/sales",
        icon: BadgeDollarSignIcon,
        items: [
          { title: "Overview", href: "/sales" },
          { title: "Quotes", href: "/quotes" },
          { title: "Orders", href: "/orders" },
          { title: "Invoices", href: "/invoices" }
        ]
      },
      {
        title: "CRM",
        href: "/crm",
        icon: ChartBarDecreasingIcon,
        items: [
          { title: "Overview", href: "/crm" },
          { title: "Leads", href: "/crm/leads" },
          { title: "Deals", href: "/crm/deals" },
          { title: "Activities", href: "/crm/activities" },
          { title: "Reports", href: "/crm?tab=reports" }
        ]
      },
      {
        title: "Products",
        href: "/products",
        icon: ShoppingBagIcon,
        items: [
          { title: "Catalog", href: "/products" },
          { title: "Product Detail", href: "/products/1" },
          { title: "Add Product", href: "/products/create" }
        ]
      }
    ]
  },
  {
    title: "Business Operations",
    items: [
      {
        title: "Projects",
        href: "/project-management",
        icon: FolderDotIcon,
        items: [
          { title: "Dashboard", href: "/project-management" },
          { title: "Project List", href: "/project-list" }
        ]
      },
      {
        title: "HR",
        href: "/hr/employees",
        icon: UsersIcon,
        items: [
          { title: "Employees", href: "/hr/employees" },
          { title: "Dashboard", href: "/employee-dashboard" },
          { title: "Departments", href: "/employee-dashboard?tab=departments" },
          { title: "Payroll", href: "/employee-dashboard?tab=payroll" }
        ]
      },
      {
        title: "Vault",
        href: "/apps/file-manager",
        icon: ArchiveRestoreIcon
      },
      {
        title: "AI Assistant",
        href: "/apps/ai-chat-v2",
        icon: BrainCircuitIcon
      }
    ]
  },
  {
    title: "Settings",
    items: [
      {
        title: "Profile",
        href: "/pages/profile",
        icon: UserIcon
      },
      {
        title: "Settings",
        href: "/settings",
        icon: SettingsIcon
      },
      {
        title: "Legacy Settings",
        href: "/pages/settings",
        icon: SlidersHorizontalIcon,
        items: [
          { title: "Profile", href: "/pages/settings" },
          { title: "Account", href: "/pages/settings/account" },
          { title: "Billing", href: "/pages/settings/billing" },
          { title: "Appearance", href: "/pages/settings/appearance" },
          { title: "Notifications", href: "/pages/settings/notifications" },
          { title: "Display", href: "/pages/settings/display" },
          { title: "Api Keys", href: "/apps/api-keys", icon: KeyIcon }
        ]
      },
      {
        title: "Authentication",
        href: "/",
        icon: FingerprintIcon,
        items: [
          { title: "Login v1", href: "/login/v1" },
          { title: "Login v2", href: "/login/v2" },
          { title: "Register v1", href: "/register/v1" },
          { title: "Register v2", href: "/register/v2" },
          { title: "Forgot Password", href: "/forgot-password" }
        ]
      }
    ]
  }
];

export function NavMain() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <>
      {navItems.map((nav) => (
        <SidebarGroup key={nav.title}>
          <SidebarGroupLabel>{nav.title}</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {nav.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {Array.isArray(item.items) && item.items.length > 0 ? (
                    <>
                      <div className="hidden group-data-[collapsible=icon]:block">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton tooltip={item.title}>
                              {item.icon && <item.icon />}
                              <span>{item.title}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side={isMobile ? "bottom" : "right"}
                            align={isMobile ? "end" : "start"}
                            className="min-w-48 rounded-lg">
                            <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                            {item.items?.map((item) => (
                              <DropdownMenuItem
                                className="hover:text-foreground active:text-foreground hover:bg-[var(--primary)]/10! active:bg-[var(--primary)]/10!"
                                asChild
                                key={item.title}>
                                <a href={item.href}>{item.title}</a>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Collapsible className="group/collapsible block group-data-[collapsible=icon]:hidden">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className="hover:text-foreground active:text-foreground hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/10"
                            tooltip={item.title}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item?.items?.map((subItem, key) => (
                              <SidebarMenuSubItem key={key}>
                                <SidebarMenuSubButton
                                  className="hover:text-foreground active:text-foreground hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/10"
                                  isActive={pathname === subItem.href}
                                  asChild>
                                  <Link href={subItem.href} target={subItem.newTab ? "_blank" : ""}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </>
                  ) : (
                    <SidebarMenuButton
                      className="hover:text-foreground active:text-foreground hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/10"
                      isActive={pathname === item.href}
                      tooltip={item.title}
                      asChild>
                      <Link href={item.href} target={item.newTab ? "_blank" : ""}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                  {!!item.isComing && (
                    <SidebarMenuBadge className="peer-hover/menu-button:text-foreground opacity-50">
                      Coming
                    </SidebarMenuBadge>
                  )}
                  {!!item.isNew && (
                    <SidebarMenuBadge className="border border-green-400 text-green-600 peer-hover/menu-button:text-green-600">
                      New
                    </SidebarMenuBadge>
                  )}
                  {!!item.isDataBadge && (
                    <SidebarMenuBadge className="peer-hover/menu-button:text-foreground">
                      {item.isDataBadge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
