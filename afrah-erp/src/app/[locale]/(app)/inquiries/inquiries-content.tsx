"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { PlusCircle, Search, Filter, ExternalLink, Clock } from "lucide-react";
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
import { MOCK_INQUIRIES } from "@/lib/mock-data";
import { formatDate, cn } from "@/lib/utils";
import { NewInquiryDialog } from "./new-inquiry-dialog";
import { Can } from "@/components/auth/can";

export function InquiriesContent() {
  const t = useTranslations("inquiries");
  const tStatuses = useTranslations("inquiries.statuses");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = MOCK_INQUIRIES.filter((i) => {
    const matchSearch =
      !search ||
      i.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.client?.phone_1?.includes(search);
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const overdueIds = new Set(
    MOCK_INQUIRIES.filter(
      (i) =>
        i.follow_up_date &&
        new Date(i.follow_up_date) <= new Date() &&
        i.status !== "cancelled" &&
        i.status !== "converted"
    ).map((i) => i.id)
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Can permission="inquiries.create">
          <Button onClick={() => setNewOpen(true)} className="gap-2">
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
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="toured">Toured</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        {filtered.length} inquiry{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Inquiries list */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">{t("noInquiries")}</p>
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
                    {t("desiredDate")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("status")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    {t("source")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    {t("followUp")}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    {t("attempts")}
                  </th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((inq) => (
                  <tr
                    key={inq.id}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      overdueIds.has(inq.id) && "bg-red-50/50"
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium">{inq.client?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {inq.client?.phone_1}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="font-medium">
                        {inq.desired_date
                          ? formatDate(inq.desired_date, locale)
                          : "—"}
                      </p>
                      {inq.guest_count && (
                        <p className="text-xs text-muted-foreground">
                          ~{inq.guest_count} guests
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        status={inq.status}
                        label={tStatuses(inq.status as never)}
                      />
                      {inq.pending_reason && (
                        <p className="mt-0.5 text-[10px] text-amber-600 capitalize">
                          {inq.pending_reason.replace("_", " ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell capitalize">
                      {inq.source}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {inq.follow_up_date ? (
                        <div className="flex items-center gap-1">
                          {overdueIds.has(inq.id) && (
                            <Clock className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          )}
                          <span
                            className={cn(
                              "text-sm",
                              overdueIds.has(inq.id)
                                ? "text-red-600 font-medium"
                                : "text-foreground"
                            )}
                          >
                            {formatDate(inq.follow_up_date, locale)}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                      {inq.no_response_count > 0 ? (
                        <Badge
                          variant={inq.no_response_count >= 2 ? "destructive" : "warning"}
                          className="text-xs"
                        >
                          {inq.no_response_count}/3
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/${locale}/inquiries/${inq.id}`}>
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

      <Can permission="inquiries.create">
        <NewInquiryDialog open={newOpen} onClose={() => setNewOpen(false)} />
      </Can>
    </div>
  );
}
