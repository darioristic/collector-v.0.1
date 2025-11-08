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
  CalendarIcon,
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
  ShoppingBagIcon,
  SquareCheckIcon,
  SquareKanbanIcon,
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
        href: "/dashboard/finance",
        icon: WalletMinimalIcon
      },
      {
        title: "Chats",
        href: "/dashboard/apps/chat",
        icon: MessageSquareIcon,
        isDataBadge: "5"
      },
      {
        title: "Inbox",
        href: "/dashboard/apps/mail",
        icon: MailIcon
      },
      {
        title: "Tasks",
        href: "/dashboard/apps/tasks",
        icon: ClipboardCheckIcon
      }
    ]
  },
  {
    title: "Sales and Finance",
    items: [
      {
        title: "Accounts",
        href: "/dashboard/pages/users",
        icon: UsersIcon,
        items: [
          { title: "Contacts", href: "/dashboard/pages/users" },
          { title: "Companies", href: "/dashboard/pages/users?tab=companies" }
        ]
      },
      {
        title: "Sales",
        href: "/dashboard/sales",
        icon: BadgeDollarSignIcon,
        items: [
          { title: "Quotes", href: "/dashboard/sales?tab=quotes" },
          { title: "Orders", href: "/dashboard/pages/orders" },
          { title: "Invoices", href: "/dashboard/sales?tab=invoices" },
          { title: "Payments", href: "/dashboard/sales?tab=payments" }
        ]
      },
      {
        title: "CRM",
        href: "/dashboard/crm",
        icon: ChartBarDecreasingIcon,
        items: [
          { title: "Leads", href: "/dashboard/crm?tab=leads" },
          { title: "Deals", href: "/dashboard/crm?tab=deals" },
          { title: "Activities", href: "/dashboard/crm?tab=activities" },
          { title: "Reports", href: "/dashboard/crm?tab=reports" }
        ]
      },
      {
        title: "Products",
        href: "#",
        icon: ShoppingBagIcon,
        items: [
          { title: "Dashboard", href: "/dashboard/ecommerce" },
          { title: "Product List", href: "/dashboard/pages/products" },
          { title: "Product Detail", href: "/dashboard/pages/products/1" },
          { title: "Add Product", href: "/dashboard/pages/products/create" },
          { title: "Order List", href: "/dashboard/pages/orders" },
          { title: "Order Detail", href: "/dashboard/pages/orders/detail" }
        ]
      }
    ]
  },
  {
    title: "Business Operations",
    items: [
      {
        title: "Projects",
        href: "/dashboard/project-management",
        icon: FolderDotIcon,
        items: [
          { title: "Calendar", href: "/dashboard/apps/calendar" },
          { title: "Kanban", href: "/dashboard/apps/kanban" },
          { title: "Todo List App", href: "/dashboard/apps/todo-list-app" },
          { title: "Dashboard", href: "/dashboard/project-management" },
          { title: "Project List", href: "/dashboard/project-list" }
        ]
      },
      {
        title: "HR",
        href: "/dashboard/employee-dashboard",
        icon: UsersIcon,
        items: [
          { title: "Employees", href: "/dashboard/employee-dashboard" },
          { title: "Departments", href: "/dashboard/employee-dashboard?tab=departments" },
          { title: "Payroll", href: "/dashboard/employee-dashboard?tab=payroll" }
        ]
      },
      {
        title: "Vault",
        href: "/dashboard/apps/file-manager",
        icon: ArchiveRestoreIcon
      },
      {
        title: "AI Assistant",
        href: "/dashboard/apps/ai-chat-v2",
        icon: BrainCircuitIcon
      }
    ]
  },
  {
    title: "Settings",
    items: [
      {
        title: "Profile",
        href: "/dashboard/pages/profile",
        icon: UserIcon
      },
      {
        title: "Settings",
        href: "/dashboard/pages/settings",
        icon: SettingsIcon,
        items: [
          { title: "Profile", href: "/dashboard/pages/settings" },
          { title: "Account", href: "/dashboard/pages/settings/account" },
          { title: "Billing", href: "/dashboard/pages/settings/billing" },
          { title: "Appearance", href: "/dashboard/pages/settings/appearance" },
          { title: "Notifications", href: "/dashboard/pages/settings/notifications" },
          { title: "Display", href: "/dashboard/pages/settings/display" },
          { title: "Api Keys", href: "/dashboard/apps/api-keys", icon: KeyIcon }
        ]
      },
      {
        title: "Authentication",
        href: "/",
        icon: FingerprintIcon,
        items: [
          { title: "Login v1", href: "/dashboard/login/v1" },
          { title: "Login v2", href: "/dashboard/login/v2" },
          { title: "Register v1", href: "/dashboard/register/v1" },
          { title: "Register v2", href: "/dashboard/register/v2" },
          { title: "Forgot Password", href: "/dashboard/forgot-password" }
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
