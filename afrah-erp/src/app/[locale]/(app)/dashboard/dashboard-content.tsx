"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { formatDate, formatCurrency } from "@/lib/utils";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { hasPermission } from "@/lib/auth/my-profile";
import {
  useDashboardOverdueInquiries,
  useDashboardRecentBookings,
  useDashboardSummary,
} from "@/lib/queries/dashboard";
import type { BookingStatus } from "@/lib/types/database";

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const hallParam = searchParams.get("hall");
  const hallId =
    hallParam && hallParam !== "all" && hallParam.length > 0
      ? hallParam
      : null;

  const { data: profile } = useMyProfile();
  const canViewInquiries = hasPermission(profile, "inquiries.view");

  const summaryQuery = useDashboardSummary(hallId);
  const recentQuery = useDashboardRecentBookings(hallId);
  const overdueQuery = useDashboardOverdueInquiries(canViewInquiries);

  const summary = summaryQuery.data;
  const isSummaryLoading = summaryQuery.isPending;

  const recentBookings = recentQuery.data ?? [];
  const overdueInquiries = overdueQuery.data ?? [];

  const todayCount = summary?.today_bookings.length ?? 0;
  const weekCount = summary?.week_count ?? 0;
  const outstanding = summary?.outstanding_egp ?? 0;
  const overdueCount = summary?.overdue_followups_count ?? 0;
  const holds = summary?.expiring_holds ?? [];

  const stats = [
    {
      title: t("todayBookings"),
      value: isSummaryLoading ? "—" : todayCount,
      icon: <CalendarDays className="h-5 w-5" />,
      gradient: "from-indigo-500 to-violet-600",
      glow: "shadow-[0_4px_12px_oklch(0.50_0.22_264/0.35)]",
      sub: !isSummaryLoading && todayCount === 0 ? t("noEvents") : undefined,
    },
    {
      title: t("weekCount"),
      value: isSummaryLoading ? "—" : weekCount,
      icon: <TrendingUp className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-600",
      glow: "shadow-[0_4px_12px_oklch(0.52_0.17_145/0.35)]",
      sub: t("eventsThisWeekHint"),
    },
    {
      title: t("outstandingAmount"),
      value: isSummaryLoading ? "—" : formatCurrency(outstanding),
      icon: <AlertCircle className="h-5 w-5" />,
      gradient: "from-amber-500 to-orange-600",
      glow: "shadow-[0_4px_12px_oklch(0.72_0.18_65/0.35)]",
      sub: t("outstandingBalanceHint"),
    },
    {
      title: t("overdueFollowups"),
      value: isSummaryLoading ? "—" : overdueCount,
      icon: <Clock className="h-5 w-5" />,
      gradient:
        overdueCount > 0 ? "from-red-500 to-rose-600" : "from-slate-400 to-slate-500",
      glow:
        overdueCount > 0 ? "shadow-[0_4px_12px_oklch(0.577_0.245_27.3/0.35)]" : "",
      sub:
        overdueCount > 0
          ? t("overdueAttentionHint")
          : t("overdueCaughtUpHint"),
    },
  ];

  const toBookingAmount = (v: unknown) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = parseFloat(v);
      return Number.isNaN(n) ? 0 : n;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-2xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <HallSelector />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="group relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  {stat.sub && (
                    <p className="mt-1 text-xs text-muted-foreground/80">{stat.sub}</p>
                  )}
                </div>
                <div
                  className={`shrink-0 rounded-2xl bg-gradient-to-br p-3 text-white transition-transform duration-300 group-hover:scale-105 ${stat.gradient} ${stat.glow}`}
                >
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {holds.length > 0 && (
        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 shadow-[0_1px_4px_oklch(0.72_0.18_65/0.12)]">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-2 text-white shadow-[0_2px_8px_oklch(0.72_0.18_65/0.3)]">
              <Timer className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {t("expiringHoldBanner", { count: holds.length })}
              </p>
              <p className="mt-0.5 text-xs text-amber-700/80">
                {holds
                  .map((b) => b.client?.name)
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
            <Button size="sm" variant="warning" className="shrink-0" asChild>
              <Link href={`/${locale}/bookings?status=on_hold`}>
                {t("viewHolds")}
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("recentBookings")}</CardTitle>
              <CardDescription>{t("recentBookingsDesc")}</CardDescription>
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
              {recentQuery.isPending ? (
                <div className="space-y-0 px-5 py-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="mb-3 h-14 animate-pulse rounded-lg bg-muted/60 last:mb-0"
                    />
                  ))}
                </div>
              ) : recentBookings.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  {t("noRecentBookings")}
                </div>
              ) : (
                recentBookings.map((booking) => {
                  const outstandingAmt = toBookingAmount(
                    booking.amount_outstanding
                  );
                  const totalAmt = booking.total_amount
                    ? toBookingAmount(booking.total_amount)
                    : null;
                  return (
                    <Link
                      key={booking.id}
                      href={`/${locale}/bookings/${booking.id}`}
                      className="flex translate-x-0 items-center gap-4 px-5 py-3.5 transition-all duration-150 hover:translate-x-0.5 hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {booking.clients?.name ?? "—"}
                          </p>
                          <StatusBadge
                            status={booking.status}
                            label={tStatus(booking.status as BookingStatus)}
                          />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {booking.halls?.name ?? "—"} ·{" "}
                          {formatDate(booking.event_date, locale)} ·{" "}
                          {booking.shift
                            ? tStatus(booking.shift as never)
                            : "—"}
                        </p>
                      </div>
                      <div className="shrink-0 text-end">
                        <p className="text-sm font-semibold">
                          {totalAmt !== null ? formatCurrency(totalAmt) : "—"}
                        </p>
                        {outstandingAmt > 0 && (
                          <p className="text-xs text-amber-600">
                            {formatCurrency(outstandingAmt)} {t("due")}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {canViewInquiries && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">
                  {t("overdueFollowupsCard")}
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="gap-1">
                  <Link href={`/${locale}/inquiries`}>
                    {t("viewAll")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {overdueQuery.isPending ? (
                  <div className="space-y-2 px-5 py-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-12 animate-pulse rounded-lg bg-muted/60"
                      />
                    ))}
                  </div>
                ) : overdueInquiries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <CheckCircle2 className="mb-2 h-7 w-7 text-emerald-500" />
                    <p className="text-sm">{t("allCaughtUp")}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {overdueInquiries.map((inq) => (
                      <Link
                        key={inq.id}
                        href={`/${locale}/inquiries/${inq.id}`}
                        className="flex translate-x-0 items-center gap-3 px-5 py-3 transition-all duration-150 hover:translate-x-0.5 hover:bg-muted/50"
                      >
                        <Circle className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {inq.clients?.name ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {inq.follow_up_date &&
                              t("followUpWasDueOn", {
                                date: formatDate(inq.follow_up_date, locale),
                              })}
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-[10px]">
                          {(inq.no_response_count ?? 0) > 0
                            ? `${inq.no_response_count}/3`
                            : t("badgeNew")}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
              {isSummaryLoading ? (
                <div className="space-y-2 px-5 py-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded-lg bg-muted/60"
                    />
                  ))}
                </div>
              ) : (summary?.today_bookings.length ?? 0) === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <CalendarDays className="mb-2 h-7 w-7 opacity-30" />
                    <p className="text-sm">{t("noEvents")}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {summary!.today_bookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <div className="w-10 shrink-0 font-mono text-xs text-muted-foreground">
                          {b.start_time}
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {b.client?.name ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {b.hall?.name ?? "—"}
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
