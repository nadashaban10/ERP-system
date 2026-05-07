"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Globe, LogOut, Settings, User, Menu } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./notification-bell";
import { createClient } from "@/lib/supabase/client";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { hasPermission } from "@/lib/auth/my-profile";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear all cached queries so the next user sees fresh data.
    queryClient.clear();
    router.replace(`/${locale}/login`);
  }

  function switchLocale() {
    const newLocale = locale === "en" ? "ar" : "en";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  }

  const venueName = profile?.venues?.length ? "Venue" : undefined;
  const displayName = profile?.full_name ?? profile?.email ?? "User";
  const canViewSettings = hasPermission(profile, "venues.view") || hasPermission(profile, "users.view") || hasPermission(profile, "billing.manage");

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/60 bg-background/90 backdrop-blur-xl px-4 lg:px-6 shadow-[0_1px_8px_oklch(0_0_0/0.06)]">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Venue name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground truncate hidden sm:block">
          {venueName ?? ""}
        </p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Language switcher */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs font-medium"
          onClick={switchLocale}
        >
          <Globe className="h-4 w-4" />
          {locale === "en" ? "عربي" : "EN"}
        </Button>

        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-transparent">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                  N
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground font-normal">
                {profile?.email ?? ""}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canViewSettings && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/settings`} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("nav.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
