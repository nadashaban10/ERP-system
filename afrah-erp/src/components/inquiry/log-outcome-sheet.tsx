"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, PhoneCall, PhoneMissed, ArrowRight, CalendarClock } from "lucide-react";
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
import type { Inquiry } from "@/lib/types/database";

type OutcomeType = "answered" | "no_response" | "convert" | "reschedule" | "cancel";

interface LogOutcomeSheetProps {
  inquiry: Inquiry;
  open: boolean;
  onClose: () => void;
}

export function LogOutcomeSheet({
  inquiry,
  open,
  onClose,
}: LogOutcomeSheetProps) {
  const t = useTranslations("inquiries.outcome");
  const locale = useLocale();
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    notes: "",
    nextCallAt: "",
    cancelReason: "customer_not_reached",
  });

  const isThirdAttempt = inquiry.no_response_count >= 2;

  const outcomes: { value: OutcomeType; label: string; icon: React.ReactNode; color: string }[] = [
    {
      value: "answered",
      label: t("answered"),
      icon: <PhoneCall className="h-4 w-4" />,
      color: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400",
    },
    {
      value: "no_response",
      label: t("noResponse"),
      icon: <PhoneMissed className="h-4 w-4" />,
      color: "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400",
    },
    {
      value: "convert",
      label: t("convert"),
      icon: <ArrowRight className="h-4 w-4" />,
      color: "border-indigo-300 bg-indigo-50 text-indigo-700 hover:border-indigo-400",
    },
    {
      value: "reschedule",
      label: t("reschedule"),
      icon: <CalendarClock className="h-4 w-4" />,
      color: "border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-400",
    },
  ];

  async function handleSubmit() {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    if (selectedOutcome === "no_response") {
      // TODO: supabase.rpc("log_no_response", { reminder_id, notes, next_call_at })
      if (isThirdAttempt) {
        toast({
          variant: "warning" as "info",
          title: "Inquiry auto-closed",
          description: "3rd no-response — inquiry cancelled automatically",
        });
      } else {
        toast({
          variant: "info",
          title: "No response logged",
          description: `Attempt ${inquiry.no_response_count + 1}/3`,
        });
      }
    } else if (selectedOutcome === "convert") {
      // TODO: supabase.rpc("convert_inquiry_to_booking", ...)
      toast({
        variant: "success",
        title: "Converting to booking",
        description: "Booking wizard will open pre-filled",
      });
    } else {
      toast({
        variant: "success",
        title: "Outcome logged",
      });
    }

    setIsSubmitting(false);
    onClose();
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
                {inquiry.no_response_count}/3 no-responses
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isThirdAttempt && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              ⚠ {t("autoCloseWarning")}
            </div>
          )}

          {/* Outcome selection */}
          <div className="space-y-2">
            {outcomes.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedOutcome(opt.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-sm font-medium transition-all",
                  selectedOutcome === opt.value
                    ? "ring-2 ring-primary ring-offset-1 " + opt.color
                    : "border-border hover:bg-muted " + opt.color.split(" ")[0]
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          {selectedOutcome && (
            <>
              <div className="space-y-1.5">
                <Label>{t("notes")}</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Call notes..."
                  rows={3}
                />
              </div>

              {(selectedOutcome === "no_response" ||
                selectedOutcome === "reschedule") && !isThirdAttempt && (
                <div className="space-y-1.5">
                  <Label>{t("nextCallDate")}</Label>
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
          )}
        </div>

        <SheetFooter>
          <Button
            className="w-full"
            onClick={handleSubmit}
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
