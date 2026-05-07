"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  LayoutDashboard,
  CalendarDays,
  BookMarked,
  MessageSquare,
  Users,
  Settings,
  Sparkles,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { hasPermission, type Permission } from "@/lib/auth/my-profile";

interface NavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
  requires?: Permission[];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: profile } = useMyProfile();

  const navItems: NavItem[] = [
    {
      key: "dashboard",
      href: `/${locale}/dashboard`,
      icon: <LayoutDashboard className="h-5 w-5" />,
      requires: ["reports.view"],
    },
    {
      key: "calendar",
      href: `/${locale}/calendar`,
      icon: <CalendarDays className="h-5 w-5" />,
      // Calendar is driven by bookings data in this app.
      requires: ["bookings.view"],
    },
    {
      key: "bookings",
      href: `/${locale}/bookings`,
      icon: <BookMarked className="h-5 w-5" />,
      requires: ["bookings.view"],
    },
    {
      key: "inquiries",
      href: `/${locale}/inquiries`,
      icon: <MessageSquare className="h-5 w-5" />,
      requires: ["inquiries.view"],
    },
    {
      key: "clients",
      href: `/${locale}/clients`,
      icon: <Users className="h-5 w-5" />,
      requires: ["bookings.view"], // change to "clients.view" if you add it in RPC response
    },
    {
      key: "users",
      href: `/${locale}/users`,
      icon: <Shield className="h-5 w-5" />,
      requires: ["users.view"],
    },
    {
      key: "settings",
      href: `/${locale}/settings`,
      icon: <Settings className="h-5 w-5" />,
      requires: ["venues.view"],
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (!item.requires || item.requires.length === 0) return true;
    return item.requires.some((p) => hasPermission(profile, p));
  });

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border/60">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/5 ring-1 ring-white/20 shadow-[0_2px_8px_oklch(0_0_0/0.3)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight tracking-tight">Afrah</p>
            <p className="text-[10px] text-sidebar-foreground/50 leading-tight tracking-widest uppercase">
              Venue ERP
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-xl"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-0.5 px-3">
          {visibleNavItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
                isActive(item.href)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_1px_4px_oklch(0_0_0/0.15)]"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              {isActive(item.href) && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sidebar-primary shadow-[0_0_8px_oklch(0.68_0.18_264/0.6)]" />
              )}
              <span
                className={cn(
                  "shrink-0 transition-all duration-200",
                  isActive(item.href)
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/70"
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1">{t(item.key as keyof typeof t)}</span>
            </Link>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border/50 px-4 py-3">
        <p className="text-[10px] text-sidebar-foreground/30 tracking-wide uppercase">
          Afrah ERP v1.0 · MVP
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col shrink-0 fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
