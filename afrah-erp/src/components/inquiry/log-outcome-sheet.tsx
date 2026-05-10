"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Loader2,
  PhoneCall,
  PhoneMissed,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import type { Inquiry, Json } from "@/lib/types/database";
import {
  useAnswerInquiryCall,
  useInquiryReminders,
  useLogNoResponseInquiry,
  useResolveInquiryReminder,
} from "@/lib/queries/inquiry-reminders";

function readRpcAction(payload: Json): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return "";
  const action = (payload as Record<string, unknown>).action;
  return typeof action === "string" ? action : "";
}

type OutcomeType = "answered" | "no_response" | "convert" | "reschedule";

interface LogOutcomeSheetProps {
  inquiry: Inquiry;
  open: boolean;
  onClose: () => void;
  /** When set, "Convert to booking" runs this callback (e.g. open wizard) instead of navigating to Bookings. */
  onConvertToBooking?: () => void;
}

function toUtcIso(datetimeLocal: string): string | undefined {
  if (!datetimeLocal.trim()) return undefined;
  const d = new Date(datetimeLocal);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function LogOutcomeSheet({
  inquiry,
  open,
  onClose,
  onConvertToBooking,
}: LogOutcomeSheetProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("inquiries.outcome");
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeType | null>(
    null
  );
  const [form, setForm] = useState({
    notes: "",
    nextCallAt: "",
  });

  const { data: reminders = [] } = useInquiryReminders(
    open ? inquiry.id : null
  );

  const pendingReminderId =
    reminders.find((r) => r.status === "pending")?.id ?? null;

  const logNoMutation = useLogNoResponseInquiry();
  const resolveMutation = useResolveInquiryReminder();
  const answeredMutation = useAnswerInquiryCall();

  const isSubmitting =
    logNoMutation.isPending ||
    resolveMutation.isPending ||
    answeredMutation.isPending;

  const isThirdAttempt = inquiry.no_response_count >= 2;

  const outcomes: {
    value: OutcomeType;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      value: "answered",
      label: t("answered"),
      icon: <PhoneCall className="h-4 w-4" />,
      color:
        "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400",
    },
    {
      value: "no_response",
      label: t("noResponse"),
      icon: <PhoneMissed className="h-4 w-4" />,
      color:
        "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400",
    },
    {
      value: "convert",
      label: t("convert"),
      icon: <ArrowRight className="h-4 w-4" />,
      color:
        "border-indigo-300 bg-indigo-50 text-indigo-700 hover:border-indigo-400",
    },
    {
      value: "reschedule",
      label: t("reschedule"),
      icon: <CalendarClock className="h-4 w-4" />,
      color: "border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-400",
    },
  ];

  async function handleSubmit() {
    if (!selectedOutcome) return;

    try {
      if (selectedOutcome === "answered") {
        await answeredMutation.mutateAsync({
          inquiryId: inquiry.id,
          reminderId: pendingReminderId,
          notes: form.notes,
        });
        toast({ variant: "success", title: t("answeredSuccess") });
      } else if (selectedOutcome === "no_response") {
        if (!pendingReminderId) {
          toast({
            variant: "destructive",
            title: t("needPendingReminderTitle"),
            description: t("needPendingReminderBody"),
          });
          return;
        }
        const data = await logNoMutation.mutateAsync({
          inquiryId: inquiry.id,
          reminder_id: pendingReminderId,
          notes: form.notes || null,
          next_call_at_iso:
            !isThirdAttempt && form.nextCallAt.trim()
              ? toUtcIso(form.nextCallAt) ?? null
              : null,
        });
        const action = readRpcAction(data);
        if (action === "auto_closed") {
          toast({
            variant: "info",
            title: t("autoClosedTitle"),
            description: t("autoClosedBody"),
          });
        } else {
          toast({
            variant: "success",
            title: t("noResponseLogged"),
          });
        }
      } else if (selectedOutcome === "convert") {
        if (onConvertToBooking) {
          onConvertToBooking();
          toast({
            variant: "success",
            title: t("convertOpenWizardTitle"),
            description: t("convertOpenWizardBody"),
          });
        } else {
          router.push(
            `/${locale}/bookings?client=${encodeURIComponent(inquiry.client_id)}`
          );
          toast({
            variant: "info",
            title: t("convertNavigateTitle"),
            description: t("convertNavigateBody"),
          });
        }
      } else if (selectedOutcome === "reschedule") {
        if (!pendingReminderId) {
          toast({
            variant: "destructive",
            title: t("needPendingReminderTitle"),
            description: t("needPendingReminderBody"),
          });
          return;
        }
        const nextIso = toUtcIso(form.nextCallAt);
        if (!nextIso) {
          toast({
            variant: "destructive",
            title: t("nextCallRequiredTitle"),
            description: t("nextCallRequiredBody"),
          });
          return;
        }
        await resolveMutation.mutateAsync({
          inquiryId: inquiry.id,
          reminder_id: pendingReminderId,
          outcome: "rescheduled",
          outcome_notes: form.notes || "",
          next_call_at_iso: nextIso,
        });
        toast({ variant: "success", title: t("rescheduleSuccess") });
      }

      setSelectedOutcome(null);
      setForm({ notes: "", nextCallAt: "" });
      onClose();
    } catch {
      /* hook onError toast */
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {inquiry.client?.name}
            {inquiry.no_response_count > 0 && (
              <Badge variant="warning" className="text-[10px]">
                {t("attemptBadge", { count: inquiry.no_response_count })}
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {isThirdAttempt && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              ⚠ {t("autoCloseWarning")}
            </div>
          )}

          <div className="space-y-2">
            {outcomes.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedOutcome(opt.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-sm font-medium transition-all",
                  selectedOutcome === opt.value
                    ? "ring-primary ring-offset-1 ring-2 " + opt.color
                    : "border-border hover:bg-muted " + opt.color.split(" ")[0]
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          {selectedOutcome ? (
            <>
              <div className="space-y-1.5">
                <Label>{t("notes")}</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder={t("notesPlaceholder")}
                  rows={3}
                />
              </div>

              {(selectedOutcome === "no_response" ||
                selectedOutcome === "reschedule") &&
                !isThirdAttempt && (
                  <div className="space-y-1.5">
                    <Label>
                      {t("nextCallDate")}
                      {selectedOutcome === "reschedule" ? (
                        <span className="ml-0.5 text-destructive">*</span>
                      ) : (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          ({t("nextCallOptional")})
                        </span>
                      )}
                    </Label>
                    <Input
                      type="datetime-local"
                      value={form.nextCallAt}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, nextCallAt: e.target.value }))
                      }
                    />
                  </div>
                )}
            </>
          ) : null}
        </div>

        <SheetFooter>
          <Button
            className="w-full"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !selectedOutcome}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("submit")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
