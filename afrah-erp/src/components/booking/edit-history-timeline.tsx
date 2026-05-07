"use client";

import { useLocale } from "next-intl";
import { History, Edit3 } from "lucide-react";
import { MOCK_EDIT_HISTORY } from "@/lib/mock-data";
import { formatDateRelative, cn } from "@/lib/utils";
import type { BookingEditHistory } from "@/lib/types/database";

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
  const history = MOCK_EDIT_HISTORY.filter((h) => h.booking_id === bookingId);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <History className="h-7 w-7 mb-2 opacity-30" />
        <p className="text-sm">No edits recorded</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-4 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {history.map((edit, i) => (
          <div key={edit.id} className="relative flex gap-4 pl-10">
            {/* Dot */}
            <div className="absolute left-2 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>

            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-start gap-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    EDIT_TYPE_COLORS[edit.edit_type] ?? "bg-gray-100 text-gray-700"
                  )}
                >
                  {edit.edit_type.replace("_", " ")} edit
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateRelative(edit.created_at, locale)}
                </span>
              </div>

              {edit.agent_notes && (
                <p className="mt-1 text-sm text-foreground">
                  {edit.agent_notes}
                </p>
              )}

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-red-50 border border-red-100 p-2">
                  <p className="text-[10px] font-semibold text-red-500 uppercase mb-1">Before</p>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap break-all">
                    {JSON.stringify(edit.previous_values, null, 2)}
                  </pre>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2">
                  <p className="text-[10px] font-semibold text-emerald-500 uppercase mb-1">After</p>
                  <pre className="text-xs text-emerald-700 whitespace-pre-wrap break-all">
                    {JSON.stringify(edit.new_values, null, 2)}
                  </pre>
                </div>
              </div>

              {edit.financial_adjustment && (
                <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2">
                  <p className="text-xs font-medium text-amber-700">
                    Financial adjustment:{" "}
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
