"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  BellRing,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
  PhoneMissed,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import type {
  InquiryReminder,
  ReminderOutcome,
  ReminderStatus,
} from "@/lib/types/database";
import { useInquiryReminders } from "@/lib/queries/inquiry-reminders";

interface ReminderTimelineProps {
  inquiryId: string;
  noResponseCount: number;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-400 bg-amber-50",
  fired: "border-indigo-400 bg-indigo-50",
  dismissed: "border-slate-300 bg-slate-50",
  completed: "border-emerald-400 bg-emerald-50",
};

function outcomeIcon(kind: ReminderOutcome) {
  switch (kind) {
    case "converted":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "rescheduled":
      return <RefreshCw className="h-3.5 w-3.5" />;
    case "cancelled":
      return <XCircle className="h-3.5 w-3.5" />;
    case "no_response":
    default:
      return <PhoneMissed className="h-3.5 w-3.5" />;
  }
}

function outcomeColor(kind: ReminderOutcome): string {
  switch (kind) {
    case "converted":
      return "text-emerald-600";
    case "rescheduled":
      return "text-blue-600";
    case "cancelled":
      return "text-red-600";
    case "no_response":
    default:
      return "text-amber-600";
  }
}

export function ReminderTimeline({
  inquiryId,
  noResponseCount,
}: ReminderTimelineProps) {
  const locale = useLocale();
  const t = useTranslations("inquiries.reminderTimeline");

  const { data = [], isPending } = useInquiryReminders(inquiryId);

  const reminders = data;

  const outcomeTitles = useMemo(
    (): Record<ReminderOutcome, string> => ({
      converted: t("outcomeConverted"),
      rescheduled: t("outcomeRescheduled"),
      cancelled: t("outcomeCancelled"),
      no_response: t("outcomeNoResponse"),
    }),
    [t]
  );

  const statusTitles = useMemo(
    (): Record<ReminderStatus, string> => ({
      pending: t("status.pending"),
      fired: t("status.fired"),
      dismissed: t("status.dismissed"),
      completed: t("status.completed"),
    }),
    [t]
  );

  const typeLabel = useMemo(
    () => ({
      scheduled_call: t("typeScheduledCall"),
      deposit_follow_up: t("typeDepositFollowUp"),
    }),
    [t]
  );

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
        <p className="text-sm">{t("loading")}</p>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <BellRing className="mb-2 h-7 w-7 opacity-30" />
        <p className="text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {noResponseCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
          <PhoneMissed className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="text-amber-700">
            {t("attemptsBanner", { count: noResponseCount })}
            {noResponseCount === 2 && (
              <>
                {" "}
                <span className="font-medium">{t("attemptsBannerFinalHint")}</span>
              </>
            )}
          </span>
        </div>
      )}

      <div className="relative">
        <div className="absolute bottom-0 left-4 top-4 w-px bg-border" />
        <div className="space-y-3">
          {reminders.map((reminder: InquiryReminder) => {
            const labelType =
              reminder.reminder_type === "deposit_follow_up"
                ? typeLabel.deposit_follow_up
                : typeLabel.scheduled_call;

            return (
              <div key={reminder.id} className="relative flex gap-4 pl-10">
                <div
                  className={cn(
                    "absolute left-2 top-2 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-background",
                    reminder.status === "pending"
                      ? "border-amber-400"
                      : reminder.status === "completed"
                        ? "border-emerald-400"
                        : "border-border"
                  )}
                >
                  {reminder.status === "completed" ? (
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </div>

                <div
                  className={cn(
                    "flex-1 rounded-xl border p-3 text-sm",
                    STATUS_STYLES[reminder.status]
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{labelType}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(reminder.scheduled_at, locale, "dd MMM yyyy · HH:mm")}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                        reminder.status === "pending" &&
                          "border-amber-200 bg-amber-100 text-amber-700",
                        reminder.status === "completed" &&
                          "border-emerald-200 bg-emerald-100 text-emerald-700",
                        reminder.status === "fired" &&
                          "border-indigo-200 bg-indigo-100 text-indigo-700",
                        reminder.status === "dismissed" &&
                          "border-slate-200 bg-slate-100 text-slate-600"
                      )}
                    >
                      {statusTitles[reminder.status]}
                    </span>
                  </div>

                  {reminder.outcome ? (
                    <div
                      className={cn(
                        "mt-2 flex items-center gap-1.5 font-medium",
                        outcomeColor(reminder.outcome)
                      )}
                    >
                      {outcomeIcon(reminder.outcome)}
                      {outcomeTitles[reminder.outcome]}
                    </div>
                  ) : null}

                  {reminder.outcome_notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {reminder.outcome_notes}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
