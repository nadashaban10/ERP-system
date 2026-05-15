"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Filter,
  ExternalLink,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types/database";
import { Can } from "@/components/auth/can";
import { useBookingsList } from "@/lib/queries/bookings";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function BookingsContent() {
  const t = useTranslations("bookings");
  const tStatus = useTranslations("status");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);

  const hallParam = searchParams.get("hall");
  const hallId =
    hallParam && hallParam !== "all" && hallParam.length > 0
      ? hallParam
      : null;

  const statusFilter = searchParams.get("status") ?? "all";
  const clientFilterRaw = searchParams.get("client");
  const clientId =
    clientFilterRaw && clientFilterRaw.length > 0 ? clientFilterRaw : null;

  function setStatusFilter(v: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (v === "all") p.delete("status");
    else p.set("status", v);
    router.replace(`${pathname}?${p.toString()}`);
  }

  const listQuery = useBookingsList({
    hallId,
    status: statusFilter,
    clientId,
    sortAsc,
  });

  const bookings = listQuery.data ?? [];
  const isLoadingList = listQuery.isPending;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => {
      const name = b.client?.name?.toLowerCase() ?? "";
      const phone = b.client?.phone_1 ?? "";
      return (
        name.includes(q) ||
        phone.includes(search.trim()) ||
        b.id.toLowerCase().includes(q)
      );
    });
  }, [bookings, search]);

  const statusOptions: BookingStatus[] = [
    "confirmed",
    "on_hold",
    "inquiry",
    "completed",
    "cancelled",
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          {clientId && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("filteredByClientHint")}
              <Button
                variant="link"
                className="h-auto p-0 pl-2 text-xs"
                onClick={() => {
                  const p = new URLSearchParams(searchParams.toString());
                  p.delete("client");
                  router.replace(`${pathname}?${p.toString()}`);
                }}
              >
                {t("clearClientFilter")}
              </Button>
            </p>
          )}
        </div>
        <Can permission="bookings.create">
          <Button onClick={() => setWizardOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            {t("new")}
          </Button>
        </Can>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              disabled={isLoadingList}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]" disabled={isLoadingList}>
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder={t("status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {tCommon("all")} ({t("status")})
              </SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {tStatus(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoadingList
            ? t("loadingList")
            : t("bookingCountPlural", { count: filtered.length })}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setSortAsc((d) => !d)}
          disabled={isLoadingList}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {t("dateSort", { dir: sortAsc ? "↑" : "↓" })}
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoadingList ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">{t("noBookings")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("client")}
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                    {t("hall")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("date")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("status")}
                  </th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                    {t("amount")}
                  </th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                    {t("outstanding")}
                  </th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((booking) => (
                  <tr
                    key={booking.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium">{booking.client?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.client?.phone_1}
                        </p>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3.5 md:table-cell">
                      <div>
                        <p className="font-medium">{booking.hall?.name}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {booking.shift
                            ? booking.shift.replace("_", " ")
                            : "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium">
                        {formatDate(booking.event_date, locale)}
                      </p>
                      {booking.guest_count != null && (
                        <p className="text-xs text-muted-foreground">
                          {t("guestCountTable", {
                            count: booking.guest_count,
                          })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        status={booking.status}
                        label={tStatus(booking.status as BookingStatus)}
                      />
                      {booking.status === "on_hold" &&
                        booking.hold_expires_at && (
                          <p className="mt-0.5 text-[10px] text-amber-600">
                            {t("expiresOn", {
                              date: formatDate(
                                booking.hold_expires_at,
                                locale
                              ),
                            })}
                          </p>
                        )}
                    </td>
                    <td className="hidden px-4 py-3.5 text-right lg:table-cell">
                      <p className="font-semibold">
                        {booking.total_amount != null
                          ? formatCurrency(booking.total_amount)
                          : "—"}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3.5 text-right lg:table-cell">
                      {booking.amount_outstanding > 0 ? (
                        <p className="font-semibold text-amber-600">
                          {formatCurrency(booking.amount_outstanding)}
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-emerald-600">
                          {t("paidInFull")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/${locale}/bookings/${booking.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Can permission="bookings.create">
        <BookingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      </Can>
    </div>
  );
}
