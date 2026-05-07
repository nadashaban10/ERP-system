"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { HallSelector } from "@/components/shared/hall-selector";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { MOCK_BOOKINGS } from "@/lib/mock-data";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types/database";
import { Can } from "@/components/auth/can";

export function BookingsContent() {
  const t = useTranslations("bookings");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = MOCK_BOOKINGS.filter((b) => {
    const matchSearch =
      !search ||
      b.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    const diff = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    return sortDir === "asc" ? diff : -diff;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Can permission="bookings.create">
          <Button onClick={() => setWizardOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            {t("new")}
          </Button>
        </Can>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="inquiry">Inquiry</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <HallSelector />
        </div>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} booking{filtered.length !== 1 ? "s" : ""} found
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Date {sortDir === "asc" ? "↑" : "↓"}
        </Button>
      </div>

      {/* Bookings table / list */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">{t("noBookings")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("client")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    {t("hall")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("date")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("status")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    {t("amount")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    {t("outstanding")}
                  </th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium">{booking.client?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.client?.phone_1}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div>
                        <p className="font-medium">{booking.hall?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {booking.shift?.replace("_", " ")}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium">
                        {formatDate(booking.event_date, locale)}
                      </p>
                      {booking.guest_count && (
                        <p className="text-xs text-muted-foreground">
                          {booking.guest_count} guests
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        status={booking.status}
                        label={tStatus(booking.status as never)}
                      />
                      {booking.status === "on_hold" &&
                        booking.hold_expires_at && (
                          <p className="mt-0.5 text-[10px] text-amber-600">
                            Expires{" "}
                            {formatDate(booking.hold_expires_at, locale)}
                          </p>
                        )}
                    </td>
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                      <p className="font-semibold">
                        {booking.total_amount
                          ? formatCurrency(booking.total_amount)
                          : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                      {booking.amount_outstanding > 0 ? (
                        <p className="font-semibold text-amber-600">
                          {formatCurrency(booking.amount_outstanding)}
                        </p>
                      ) : (
                        <p className="text-emerald-600 text-xs font-medium">
                          Paid ✓
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
