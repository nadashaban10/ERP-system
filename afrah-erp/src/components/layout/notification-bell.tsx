"use client";

import { useState } from "react";
import { Bell, CheckCheck, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import { formatDateRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types/database";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export function NotificationBell() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unread = notifications.filter((n) => !n.is_read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  const iconMap: Record<string, React.ReactNode> = {
    reminder_due: <BellRing className="h-4 w-4 text-indigo-500" />,
    hold_expiring: <Bell className="h-4 w-4 text-amber-500" />,
    payment_overdue: <Bell className="h-4 w-4 text-red-500" />,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
          <span className="sr-only">{t("title")}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[360px] p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <DropdownMenuLabel className="p-0 font-semibold">
            {t("title")}
            {unread > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </DropdownMenuLabel>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={markAllRead}
            >
              <CheckCheck className="h-3 w-3" />
              {t("markAllRead")}
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">{t("noNotifications")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 cursor-pointer focus:bg-accent rounded-none",
                    !notif.is_read && "bg-primary/5"
                  )}
                  onClick={() => markRead(notif.id)}
                >
                  <div className="mt-0.5 shrink-0">
                    {iconMap[notif.type] ?? (
                      <Bell className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {notif.title}
                      {!notif.is_read && (
                        <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notif.body}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {formatDateRelative(notif.created_at, locale)}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
