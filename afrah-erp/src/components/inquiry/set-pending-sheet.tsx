"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
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
import { toast } from "@/components/ui/toaster";
import type { Inquiry } from "@/lib/types/database";
import { useSetInquiryPending } from "@/lib/queries/inquiry-reminders";

interface SetPendingSheetProps {
  inquiry: Inquiry;
  open: boolean;
  onClose: () => void;
}

export function SetPendingSheet({
  inquiry,
  open,
  onClose,
}: SetPendingSheetProps) {
  const t = useTranslations("inquiries.pending");
  const [form, setForm] = useState({
    reason: "call_again" as "call_again" | "pending_deposit",
    notes: "",
    scheduledAt: "",
  });

  const setPendingMutation = useSetInquiryPending();
  const isSubmitting = setPendingMutation.isPending;

  async function handleSubmit() {
    if (!form.notes.trim() || !form.scheduledAt.trim()) return;

    const scheduledIso = new Date(form.scheduledAt).toISOString();
    if (Number.isNaN(new Date(form.scheduledAt).getTime())) {
      toast({
        variant: "destructive",
        title: t("invalidSchedule"),
      });
      return;
    }

    try {
      await setPendingMutation.mutateAsync({
        inquiryId: inquiry.id,
        pending_reason: form.reason,
        pending_notes: form.notes.trim(),
        scheduled_at_iso: scheduledIso,
      });
      toast({ variant: "success", title: t("submitSuccess") });
      onClose();
      setForm({ reason: "call_again", notes: "", scheduledAt: "" });
    } catch {
      /* onError toast on mutation hook */
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>
            {inquiry.client?.name} · {inquiry.client?.phone_1}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
          <div className="space-y-1.5">
            <Label>{t("reason")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "call_again", label: t("callAgain") },
                  { value: "pending_deposit", label: t("pendingDeposit") },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, reason: opt.value }))
                  }
                  className={`rounded-xl border p-3 text-left text-sm font-medium transition-colors ${
                    form.reason === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              {t("notes")}
              <span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder={t("notesPlaceholder")}
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              {t("scheduleCall")}
              <span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, scheduledAt: e.target.value }))
              }
            />
          </div>
        </div>

        <SheetFooter>
          <Button
            className="w-full"
            onClick={() => void handleSubmit()}
            disabled={
              isSubmitting || !form.notes.trim() || !form.scheduledAt.trim()
            }
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
