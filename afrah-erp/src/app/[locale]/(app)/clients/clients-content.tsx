"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { PlusCircle, Search, Phone, Mail, BookMarked, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
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

  const showGridLoading = venueLoading || listLoading;

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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          disabled={showGridLoading}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {showGridLoading
          ? t("matchCountLoading")
          : t("matchCount", { count: filtered.length })}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {showGridLoading ? (
          <>
            {[0, 1, 2].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <User className="mb-3 h-10 w-10 opacity-20" />
            <p className="text-sm">{t("noClients")}</p>
          </div>
        ) : (
          filtered.map((client) => {
            const rollup = summaries[client.id];
            const bookingCount = rollup?.count ?? 0;
            const lastBookingDate = rollup?.lastEventDate ?? null;

            return (
              <Card
                key={client.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {client.name[0]?.toUpperCase() ?? "—"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{client.name}</p>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          {client.phone_1}
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BookMarked className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {summariesLoading && !rollup
                          ? "—"
                          : t("bookingCountBadge", { count: bookingCount })}
                      </span>
                    </div>
                    {lastBookingDate ? (
                      <span className="text-xs text-muted-foreground">
                        {t("lastBookingWithDate", {
                          date: formatDate(lastBookingDate, locale),
                        })}
                      </span>
                    ) : summariesLoading ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : null}
                  </div>

                  {client.notes && (
                    <p className="mt-2 line-clamp-1 text-xs italic text-muted-foreground">
                      {client.notes}
                    </p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      asChild
                    >
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
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

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
