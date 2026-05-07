"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  CalendarDays,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Circle,
  Timer,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { HallSelector } from "@/components/shared/hall-selector";
import { MOCK_DASHBOARD, MOCK_BOOKINGS, MOCK_INQUIRIES } from "@/lib/mock-data";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { hasPermission } from "@/lib/auth/my-profile";

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const tStatus = useTranslations("status");
  const tBookings = useTranslations("bookings");
  const locale = useLocale();
  const { data: profile } = useMyProfile();
  const canViewInquiries = hasPermission(profile, "inquiries.view");

  const summary = MOCK_DASHBOARD;
  const recentBookings = MOCK_BOOKINGS.slice(0, 5);
  const overdueInquiries = MOCK_INQUIRIES.filter(
    (i) =>
      i.follow_up_date &&
      new Date(i.follow_up_date) <= new Date() &&
      i.status !== "cancelled" &&
      i.status !== "converted"
  );

  const stats = [
    {
      title: t("todayBookings"),
      value: summary.today_bookings.length,
      icon: <CalendarDays className="h-5 w-5" />,
      gradient: "from-indigo-500 to-violet-600",
      glow: "shadow-[0_4px_12px_oklch(0.50_0.22_264/0.35)]",
      sub: summary.today_bookings.length === 0 ? t("noEvents") : undefined,
      trend: null,
    },
    {
      title: t("weekCount"),
      value: summary.week_count,
      icon: <TrendingUp className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-600",
      glow: "shadow-[0_4px_12px_oklch(0.52_0.17_145/0.35)]",
      sub: "events this week",
      trend: null,
    },
    {
      title: t("outstandingAmount"),
      value: formatCurrency(summary.outstanding_egp),
      icon: <AlertCircle className="h-5 w-5" />,
      gradient: "from-amber-500 to-orange-600",
      glow: "shadow-[0_4px_12px_oklch(0.72_0.18_65/0.35)]",
      sub: "across all bookings",
      trend: null,
    },
    {
      title: t("overdueFollowups"),
      value: summary.overdue_followups_count,
      icon: <Clock className="h-5 w-5" />,
      gradient: summary.overdue_followups_count > 0 ? "from-red-500 to-rose-600" : "from-slate-400 to-slate-500",
      glow: summary.overdue_followups_count > 0 ? "shadow-[0_4px_12px_oklch(0.577_0.245_27.3/0.35)]" : "",
      sub:
        summary.overdue_followups_count > 0
          ? "need immediate attention"
          : "all caught up",
      trend: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <HallSelector />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  {stat.sub && (
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      {stat.sub}
                    </p>
                  )}
                </div>
                <div className={`rounded-2xl p-3 shrink-0 bg-gradient-to-br ${stat.gradient} text-white ${stat.glow} transition-transform duration-300 group-hover:scale-105`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiring holds alert */}
      {summary.expiring_holds.length > 0 && (
        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 shadow-[0_1px_4px_oklch(0.72_0.18_65/0.12)]">
          <div className="flex items-center gap-4 p-4">
            <div className="rounded-xl p-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_2px_8px_oklch(0.72_0.18_65/0.3)] shrink-0">
              <Timer className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                {summary.expiring_holds.length} hold
                {summary.expiring_holds.length !== 1 ? "s" : ""} expiring soon
              </p>
              <p className="text-xs text-amber-700/80 mt-0.5">
                {summary.expiring_holds.map((b) => b.client?.name).join(", ")}
              </p>
            </div>
            <Button size="sm" variant="warning" asChild>
              <Link href={`/${locale}/bookings?status=on_hold`}>
                View Holds
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("recentBookings")}</CardTitle>
              <CardDescription>Latest booking activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1.5">
              <Link href={`/${locale}/bookings`}>
                {t("viewAll")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/${locale}/bookings/${booking.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-all duration-150 hover:translate-x-0.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {booking.client?.name}
                      </p>
                      <StatusBadge
                        status={booking.status}
                        label={tStatus(booking.status as never)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {booking.hall?.name} ·{" "}
                      {formatDate(booking.event_date, locale)} ·{" "}
                      {tStatus(booking.shift as never)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {booking.total_amount
                        ? formatCurrency(booking.total_amount)
                        : "—"}
                    </p>
                    {booking.amount_outstanding > 0 && (
                      <p className="text-xs text-amber-600">
                        {formatCurrency(booking.amount_outstanding)} due
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Overdue follow-ups */}
          {canViewInquiries && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Overdue Follow-ups</CardTitle>
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link href={`/${locale}/inquiries`}>
                  {t("viewAll")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {overdueInquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-7 w-7 mb-2 text-emerald-500" />
                  <p className="text-sm">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {overdueInquiries.slice(0, 4).map((inq) => (
                    <Link
                      key={inq.id}
                      href={`/${locale}/inquiries/${inq.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-all duration-150 hover:translate-x-0.5"
                    >
                      <Circle className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {inq.client?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(inq.follow_up_date!, locale)}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-[10px]">
                        {inq.no_response_count > 0
                          ? `${inq.no_response_count}/3`
                          : "new"}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Today's events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("todayBookings")}</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString(
                  locale === "ar" ? "ar-EG" : "en-EG",
                  { weekday: "long", month: "long", day: "numeric" }
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {summary.today_bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CalendarDays className="h-7 w-7 mb-2 opacity-30" />
                  <p className="text-sm">{t("noEvents")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {summary.today_bookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div className="text-xs font-mono text-muted-foreground w-10 shrink-0">
                        {b.start_time}
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {b.client?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {b.hall?.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
