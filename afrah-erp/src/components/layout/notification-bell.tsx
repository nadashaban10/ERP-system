"use client";

import { useTranslations, useLocale } from "next-intl";
import { Bell, CheckCheck, BellRing, Loader2 } from "lucide-react";
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
import { formatDateRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types/database";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useSubscribeToNotifications,
} from "@/lib/queries/notifications";
import { useMyProfile } from "@/lib/auth/use-my-profile";

export function NotificationBell() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const { data: profile } = useMyProfile();
  const userId = profile?.user_id;

  useSubscribeToNotifications(userId);

  const listQuery = useNotifications(userId);
  const notifications = listQuery.data ?? [];
  const isLoading = listQuery.isPending;

  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = notifications.filter((n) => !n.is_read).length;

  function markAllRead() {
    if (!userId) return;
    markAll.mutate(userId);
  }

  function markRead(id: string) {
    if (!userId) return;
    markOne.mutate({ userId, notificationId: id });
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
        className="w-[360px] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <DropdownMenuLabel className="p-0 font-semibold">
            {t("title")}
            {unread > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </DropdownMenuLabel>
          {unread > 0 && userId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={markAllRead}
              disabled={markAll.isPending}
            >
              <CheckCheck className="h-3 w-3" />
              {t("markAllRead")}
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {!userId || isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              {t("loading")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">{t("noNotifications")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif: Notification) => (
                <DropdownMenuItem
                  key={notif.id}
                  className={cn(
                    "cursor-pointer rounded-none px-4 py-3 focus:bg-accent",
                    !notif.is_read && "bg-primary/5"
                  )}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!notif.is_read) markRead(notif.id);
                  }}
                >
                  <div className="flex w-full items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {iconMap[notif.type] ?? (
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">
                        {notif.title}
                        {!notif.is_read && (
                          <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
                        )}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {notif.body}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {formatDateRelative(notif.created_at, locale)}
                      </p>
                    </div>
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
