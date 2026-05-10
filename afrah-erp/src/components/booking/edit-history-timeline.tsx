"use client";

import { useLocale, useTranslations } from "next-intl";
import { History, Loader2 } from "lucide-react";
import { formatDateRelative, cn } from "@/lib/utils";
import type { BookingEditHistory } from "@/lib/types/database";
import { useBookingEditHistory } from "@/lib/queries/bookings";

interface EditHistoryTimelineProps {
  bookingId: string;
}

const EDIT_TYPE_COLORS: Record<string, string> = {
  package: "bg-violet-100 text-violet-700",
  hall: "bg-blue-100 text-blue-700",
  date_shift: "bg-amber-100 text-amber-700",
  guest_count: "bg-teal-100 text-teal-700",
  notes: "bg-slate-100 text-slate-700",
  combined: "bg-indigo-100 text-indigo-700",
};

export function EditHistoryTimeline({ bookingId }: EditHistoryTimelineProps) {
  const locale = useLocale();
  const t = useTranslations("bookings");

  const q = useBookingEditHistory(bookingId);
  const history = q.data ?? [];
  const isLoading = q.isPending;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        {t("editHistoryLoading")}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <History className="mb-2 h-7 w-7 opacity-30" />
        <p className="text-sm">{t("editHistoryEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-4 top-4 w-px bg-border" />

      <div className="space-y-4">
        {history.map((edit: BookingEditHistory) => (
          <div key={edit.id} className="relative flex gap-4 pl-10">
            <div className="absolute left-2 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>

            <div className="min-w-0 flex-1 pb-4">
              <div className="flex flex-wrap items-start gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    EDIT_TYPE_COLORS[edit.edit_type] ??
                      "bg-gray-100 text-gray-700"
                  )}
                >
                  {edit.edit_type.replace("_", " ")} · {t("editHistoryEditSuffix")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateRelative(edit.created_at, locale)}
                </span>
              </div>

              {edit.agent_notes && (
                <p className="mt-1 text-sm text-foreground">{edit.agent_notes}</p>
              )}

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-red-100 bg-red-50 p-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase text-red-500">
                    {t("editHistoryBefore")}
                  </p>
                  <pre className="whitespace-pre-wrap break-all text-xs text-red-700">
                    {JSON.stringify(edit.previous_values, null, 2)}
                  </pre>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase text-emerald-500">
                    {t("editHistoryAfter")}
                  </p>
                  <pre className="whitespace-pre-wrap break-all text-xs text-emerald-700">
                    {JSON.stringify(edit.new_values, null, 2)}
                  </pre>
                </div>
              </div>

              {edit.financial_adjustment && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                  <p className="text-xs font-medium text-amber-700">
                    {t("editHistoryFinancial")}{" "}
                    {JSON.stringify(edit.financial_adjustment)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
