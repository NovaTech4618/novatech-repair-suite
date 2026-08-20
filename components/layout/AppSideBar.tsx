"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Smartphone,
  Wrench,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Cpu,
  Search,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const workspaceItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
];

const workshopItems = [
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Devices",
    url: "/devices",
    icon: Smartphone,
  },
  {
    title: "Repairs",
    url: "/repairs",
    icon: Wrench,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Package,
  },
  {
    title: "Sales",
    url: "/sales",
    icon: ShoppingCart,
  },
];

const insightItems = [
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Technical Services",
    url: "/technical-services",
    icon: Cpu,
  },
];

function NavSection({
  label,
  items,
  pathname,
}: {
  label: string;
  items: {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
        {label}
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.url ||
              (item.url !== "/dashboard" &&
                pathname.startsWith(`${item.url}/`));

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.title}
                  render={<Link href={item.url} />}
                  className="
                    relative
                    h-10
                    rounded-xl
                    transition-all
                    duration-200
                    data-[active=true]:bg-[var(--novatech-primary)]
                    data-[active=true]:text-white
                    data-[active=true]:shadow-[0_0_24px_rgba(15,107,76,0.22)]
                    hover:bg-[var(--novatech-surface-alt)]
                  "
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.title}</span>

                  {isActive && (
                    <span
                      className="
                        absolute
                        right-2
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-[var(--novatech-glass-blue)]
                        shadow-[0_0_8px_var(--novatech-glass-blue)]
                      "
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[var(--novatech-border)]"
    >
      {/* BRAND */}
      <SidebarHeader className="border-b border-[var(--novatech-border)] px-3 py-4">
        <div className="flex items-center gap-3">
          <div
            className="
              relative
              flex
              size-9
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-xl
              bg-[var(--novatech-primary)]
              text-white
              shadow-[0_0_24px_rgba(15,107,76,0.28)]
            "
          >
            <span className="relative z-10 font-heading text-lg font-bold">
              N
            </span>

            <span
              className="
                absolute
                inset-x-0
                top-0
                h-px
                bg-[var(--novatech-glass-blue)]
                opacity-80
              "
            />
          </div>

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="font-heading text-sm font-bold tracking-tight">
              Novatech
            </p>

            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              Repair OS
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 py-3">
        {/* QUICK ACTIONS */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Search"
                  className="
                    h-10
                    rounded-xl
                    border
                    border-[var(--novatech-border)]
                    bg-[var(--novatech-surface)]
                    text-muted-foreground
                    hover:bg-[var(--novatech-surface-alt)]
                    hover:text-foreground
                  "
                >
                  <Search className="size-4" />
                  <span>Search</span>

                  <kbd className="ml-auto hidden rounded-md border border-border/60 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground group-data-[collapsible=icon]:hidden md:inline-block">
                    ⌘K
                  </kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Novatech Copilot"
                  className="
                    h-10
                    rounded-xl
                    text-[var(--novatech-glass-blue)]
                    hover:bg-[var(--novatech-surface-alt)]
                  "
                >
                  <Sparkles className="size-4" />
                  <span>Novatech Copilot</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavSection
          label="Workspace"
          items={workspaceItems}
          pathname={pathname}
        />

        <NavSection
          label="Workshop"
          items={workshopItems}
          pathname={pathname}
        />

        <NavSection
          label="Insights"
          items={insightItems}
          pathname={pathname}
        />
      </SidebarContent>

      {/* SETTINGS */}
      <SidebarFooter className="border-t border-[var(--novatech-border)] p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/settings"}
              tooltip="Settings"
              render={<Link href="/settings" />}
              className="
                h-10
                rounded-xl
                transition-all
                duration-200
                data-[active=true]:bg-[var(--novatech-primary)]
                data-[active=true]:text-white
                hover:bg-[var(--novatech-surface-alt)]
              "
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}