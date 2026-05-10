"use client";

import { use, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Loader2,
  Mail,
  MessageSquare,
  Package2,
  Phone,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReminderTimeline } from "@/components/inquiry/reminder-timeline";
import { SetPendingSheet } from "@/components/inquiry/set-pending-sheet";
import { LogOutcomeSheet } from "@/components/inquiry/log-outcome-sheet";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { formatDate } from "@/lib/utils";
import { Can } from "@/components/auth/can";
import {
  inquiryToBookingConversionContext,
  useInquiryDetail,
} from "@/lib/queries/inquiries";

interface InquiryDetailContentProps {
  params: Promise<{ id: string; locale: string }>;
}

export function InquiryDetailContent({ params }: InquiryDetailContentProps) {
  const { id } = use(params);
  const t = useTranslations("inquiries");
  const tStatuses = useTranslations("inquiries.statuses");
  const locale = useLocale();
  const [pendingOpen, setPendingOpen] = useState(false);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [convertWizardOpen, setConvertWizardOpen] = useState(false);

  const detailQuery = useInquiryDetail(id);
  const inquiry = detailQuery.data;

  const inquiryConversionContext = useMemo(
    () =>
      inquiry && convertWizardOpen ? inquiryToBookingConversionContext(inquiry) : null,
    [inquiry, convertWizardOpen]
  );

  if (detailQuery.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p className="text-sm">{t("loadingList")}</p>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/inquiries`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToList")}
          </Link>
        </Button>
      </div>
    );
  }

  const isOverdue =
    inquiry.follow_up_date &&
    new Date(inquiry.follow_up_date) <= new Date() &&
    inquiry.status !== "cancelled" &&
    inquiry.status !== "converted";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/inquiries`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("title")}
          </Link>
        </Button>
        <div className="flex-1" />
        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {inquiry.status !== "cancelled" && inquiry.status !== "converted" && (
            <>
              <Can permission="bookings.edit">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingOpen(true)}
                >
                  {t("setPending")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOutcomeOpen(true)}
                >
                  {t("logOutcome")}
                </Button>
              </Can>
              <Can permission="bookings.create">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setConvertWizardOpen(true)}
                >
                  <ArrowRight className="h-4 w-4" />
                  {t("convert")}
                </Button>
              </Can>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">
            {inquiry.client?.name}
          </h1>
          <StatusBadge
            status={inquiry.status}
            label={tStatuses(inquiry.status as never)}
          />
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue Follow-up
            </Badge>
          )}
          {inquiry.no_response_count > 0 && (
            <Badge variant="warning" className="text-xs">
              {inquiry.no_response_count}/3 no-responses
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Inquiry #{inquiry.id.slice(0, 8)} · Created{" "}
          {formatDate(inquiry.created_at, locale)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Event interest */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inquiry Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Desired Date</p>
                  <p className="text-sm font-semibold">
                    {inquiry.desired_date
                      ? formatDate(inquiry.desired_date, locale)
                      : "—"}
                  </p>
                </div>
              </div>

              {inquiry.alt_date && (
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-muted p-2 shrink-0">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Alt Date</p>
                    <p className="text-sm font-semibold">
                      {formatDate(inquiry.alt_date, locale)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Guest Count</p>
                  <p className="text-sm font-semibold">
                    ~{inquiry.guest_count ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Package2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Package Interest
                  </p>
                  <p className="text-sm font-semibold">
                    {inquiry.package_interest ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="text-sm font-semibold capitalize">
                    {inquiry.source}
                  </p>
                </div>
              </div>

              {inquiry.follow_up_date && (
                <div className="flex items-center gap-2.5">
                  <div
                    className={`rounded-lg p-2 shrink-0 ${
                      isOverdue ? "bg-red-100" : "bg-primary/10"
                    }`}
                  >
                    <Calendar
                      className={`h-4 w-4 ${
                        isOverdue ? "text-red-600" : "text-primary"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Follow-up</p>
                    <p
                      className={`text-sm font-semibold ${
                        isOverdue ? "text-red-600" : ""
                      }`}
                    >
                      {formatDate(inquiry.follow_up_date, locale)}
                      {isOverdue && " ⚠"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            {inquiry.notes && (
              <>
                <Separator />
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Notes
                  </p>
                  <p className="text-sm">{inquiry.notes}</p>
                </CardContent>
              </>
            )}
            {inquiry.pending_notes && (
              <>
                <Separator />
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-amber-600 mb-1">
                    Pending Notes
                  </p>
                  <p className="text-sm text-amber-700">{inquiry.pending_notes}</p>
                </CardContent>
              </>
            )}
          </Card>

          {/* Reminder timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reminder History</CardTitle>
            </CardHeader>
            <CardContent>
              <ReminderTimeline
                inquiryId={inquiry.id}
                noResponseCount={inquiry.no_response_count}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                  {inquiry.client?.name?.[0]}
                </div>
                <div>
                  <p className="font-medium">{inquiry.client?.name}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{inquiry.client?.phone_1}</span>
                </div>
                {inquiry.client?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{inquiry.client.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SetPendingSheet
        inquiry={inquiry}
        open={pendingOpen}
        onClose={() => setPendingOpen(false)}
      />
      <LogOutcomeSheet
        inquiry={inquiry}
        open={outcomeOpen}
        onClose={() => setOutcomeOpen(false)}
        onConvertToBooking={() => {
          setOutcomeOpen(false);
          setConvertWizardOpen(true);
        }}
      />

      <BookingWizard
        open={convertWizardOpen}
        conversion={inquiryConversionContext}
        defaultDate={
          inquiry.desired_date == null ? undefined : inquiry.desired_date.slice(0, 10)
        }
        onClose={() => setConvertWizardOpen(false)}
      />
    </div>
  );
}
