"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { PlusCircle, Search, Phone, Mail, BookMarked, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_CLIENTS, MOCK_BOOKINGS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { NewClientDialog } from "./new-client-dialog";
import { Can } from "@/components/auth/can";

export function ClientsContent() {
  const t = useTranslations("clients");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = MOCK_CLIENTS.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone_1.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  function getClientBookings(clientId: string) {
    return MOCK_BOOKINGS.filter((b) => b.client_id === clientId);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Can permission="bookings.create">
          <Button onClick={() => setNewOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            {t("new")}
          </Button>
        </Can>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} client{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Client cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <User className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">{t("noClients")}</p>
          </div>
        ) : (
          filtered.map((client) => {
            const bookings = getClientBookings(client.id);
            const lastBooking = bookings.sort(
              (a, b) =>
                new Date(b.event_date).getTime() -
                new Date(a.event_date).getTime()
            )[0];

            return (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                      {client.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{client.name}</p>
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
                        {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {lastBooking && (
                      <span className="text-xs text-muted-foreground">
                        Last: {formatDate(lastBooking.event_date, locale)}
                      </span>
                    )}
                  </div>

                  {client.notes && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-1 italic">
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
        <NewClientDialog open={newOpen} onClose={() => setNewOpen(false)} />
      </Can>
    </div>
  );
}
