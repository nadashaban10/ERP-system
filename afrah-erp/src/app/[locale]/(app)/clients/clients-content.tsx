"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { PlusCircle, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import { NewClientDialog } from "./new-client-dialog";
import { Can } from "@/components/auth/can";
import { useVenue } from "@/lib/queries/venue";
import {
  useClientBookingSummaries,
  useClientsForVenue,
} from "@/lib/queries/clients";
export function ClientsContent() {
  const t = useTranslations("clients");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const venueQuery = useVenue();
  const venueId = venueQuery.data?.id;
  const clientsQuery = useClientsForVenue(venueId);
  const summariesQuery = useClientBookingSummaries(venueId);

  const venueLoading = venueQuery.isPending;
  const listLoading = !!venueId && clientsQuery.isPending;
  const summariesLoading = !!venueId && summariesQuery.isPending;

  const clients = clientsQuery.data ?? [];
  const summaries = summariesQuery.data ?? {};

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone_1.includes(search.trim()) ||
        (c.email?.toLowerCase().includes(q) ?? false)
    );
  }, [clients, search]);

  const showTableLoading = venueLoading || listLoading;

  if (!venueLoading && !venueQuery.data) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("noVenue")}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Can permission="bookings.create">
          <Button
            onClick={() => setNewOpen(true)}
            className="gap-2"
            disabled={!venueId}
          >
            <PlusCircle className="h-4 w-4" />
            {t("new")}
          </Button>
        </Can>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            disabled={showTableLoading}
          />
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {showTableLoading
            ? t("matchCountLoading")
            : t("matchCount", { count: filtered.length })}
        </p>
      </div>

      <Card className="overflow-hidden">
        {showTableLoading ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-11 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <User className="mb-3 h-10 w-10 opacity-20" />
            <p className="text-sm">{t("noClients")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("name")}
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    {t("phone")}
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                    {t("email")}
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                    {t("bookings")}
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground xl:table-cell">
                    {t("lastBooking")}
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground 2xl:table-cell">
                    {t("notesLabel")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((client) => {
                  const rollup = summaries[client.id];
                  const bookingCount = rollup?.count ?? 0;
                  const lastBookingDate = rollup?.lastEventDate ?? null;

                  return (
                    <tr
                      key={client.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary",
                              "sm:h-10 sm:w-10 sm:text-sm"
                            )}
                          >
                            {client.name[0]?.toUpperCase() ?? "—"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium leading-tight">
                              {client.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                              {client.phone_1}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3.5 text-muted-foreground sm:table-cell">
                        {client.phone_1}
                      </td>
                      <td className="hidden max-w-[200px] truncate px-4 py-3.5 text-muted-foreground lg:table-cell">
                        {client.email ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3.5 md:table-cell">
                        {summariesLoading && !rollup ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="tabular-nums">
                            {t("bookingCountBadge", { count: bookingCount })}
                          </span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3.5 text-muted-foreground xl:table-cell">
                        {lastBookingDate
                          ? formatDate(lastBookingDate, locale)
                          : "—"}
                      </td>
                      <td className="hidden max-w-[220px] px-4 py-3.5 text-muted-foreground 2xl:table-cell">
                        {client.notes ? (
                          <span className="line-clamp-2 text-xs">
                            {client.notes}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Button variant="outline" size="sm" className="text-xs" asChild>
                            <Link
                              href={`/${locale}/bookings?client=${client.id}`}
                            >
                              {t("viewBookings")}
                            </Link>
                          </Button>
                          <Can permission="bookings.edit">
                            <Button variant="ghost" size="sm" className="text-xs">
                              {t("edit")}
                            </Button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Can permission="bookings.create">
        <NewClientDialog
          venueId={venueId ?? null}
          open={newOpen}
          onClose={() => setNewOpen(false)}
        />
      </Can>
    </div>
  );
}
