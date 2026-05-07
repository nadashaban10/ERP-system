"use client";

import { useLocale } from "next-intl";
import { BellRing, CheckCircle2, XCircle, RefreshCw, PhoneMissed } from "lucide-react";
import { MOCK_REMINDERS } from "@/lib/mock-data";
import { formatDate, formatDateRelative, cn } from "@/lib/utils";
import type { InquiryReminder } from "@/lib/types/database";

interface ReminderTimelineProps {
  inquiryId: string;
  noResponseCount: number;
}

const OUTCOME_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  converted: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-emerald-600",
    label: "Converted to booking",
  },
  rescheduled: {
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    color: "text-blue-600",
    label: "Rescheduled",
  },
  cancelled: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: "text-red-600",
    label: "Cancelled",
  },
  no_response: {
    icon: <PhoneMissed className="h-3.5 w-3.5" />,
    color: "text-amber-600",
    label: "No response",
  },
};

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-400 bg-amber-50",
  fired: "border-indigo-400 bg-indigo-50",
  dismissed: "border-slate-300 bg-slate-50",
  completed: "border-emerald-400 bg-emerald-50",
};

export function ReminderTimeline({ inquiryId, noResponseCount }: ReminderTimelineProps) {
  const locale = useLocale();
  const reminders = MOCK_REMINDERS.filter((r) => r.inquiry_id === inquiryId);

  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <BellRing className="h-7 w-7 mb-2 opacity-30" />
        <p className="text-sm">No reminders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {noResponseCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm">
          <PhoneMissed className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-700">
            <span className="font-semibold">{noResponseCount}/3</span> no-response
            attempts.{" "}
            {noResponseCount === 2 && (
              <span className="font-medium">Next no-response will auto-close.</span>
            )}
          </span>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-4 top-4 bottom-0 w-px bg-border" />
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const outcome = reminder.outcome
              ? OUTCOME_CONFIG[reminder.outcome]
              : null;
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
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium capitalize">
                      {reminder.reminder_type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(reminder.scheduled_at, locale, "dd MMM yyyy · HH:mm")}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border",
                        reminder.status === "pending" &&
                          "bg-amber-100 text-amber-700 border-amber-200",
                        reminder.status === "completed" &&
                          "bg-emerald-100 text-emerald-700 border-emerald-200",
                        reminder.status === "fired" &&
                          "bg-indigo-100 text-indigo-700 border-indigo-200",
                        reminder.status === "dismissed" &&
                          "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      {reminder.status}
                    </span>
                  </div>

                  {outcome && (
                    <div
                      className={cn(
                        "mt-2 flex items-center gap-1.5 font-medium",
                        outcome.color
                      )}
                    >
                      {outcome.icon}
                      {outcome.label}
                    </div>
                  )}

                  {reminder.outcome_notes && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {reminder.outcome_notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
