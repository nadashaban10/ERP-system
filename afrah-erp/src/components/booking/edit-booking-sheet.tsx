"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import type { Booking, Json, ShiftEnum } from "@/lib/types/database";
import { useActiveHalls } from "@/lib/queries/halls";
import { usePackages } from "@/lib/queries/packages";
import {
  bookingEditRpcHasChanges,
  buildEditBookingRpcChanges,
  normPackageId,
  useEditBooking,
  type EditBookingFormSnapshot,
} from "@/lib/queries/bookings";

interface EditBookingSheetProps {
  booking: Booking;
  open: boolean;
  onClose: () => void;
}

export function EditBookingSheet({
  booking,
  open,
  onClose,
}: EditBookingSheetProps) {
  const t = useTranslations("bookings");
  const tStatus = useTranslations("status");
  const [showFinancialStep, setShowFinancialStep] = useState(false);

  const { data: halls = [], isPending: hallsLoading } = useActiveHalls();
  const { data: packages = [], isPending: pkgsLoading } = usePackages();
  const editMutation = useEditBooking();

  const [form, setForm] = useState({
    hallId: booking.hall_id,
    eventDate: booking.event_date,
    shift: (booking.shift ?? "evening") as ShiftEnum,
    packageId: booking.package_id ?? "",
    totalAmount: booking.total_amount?.toString() ?? "",
    guestCount: booking.guest_count?.toString() ?? "",
    notes: booking.notes ?? "",
    assignedTo: booking.assigned_to ?? "",
    agentNotes: "",
    financialResolution: "client_pays_diff",
  });

  useEffect(() => {
    if (!open) return;
    setShowFinancialStep(false);
    setForm({
      hallId: booking.hall_id,
      eventDate: booking.event_date,
      shift: (booking.shift ?? "evening") as ShiftEnum,
      packageId: booking.package_id ?? "",
      totalAmount: booking.total_amount?.toString() ?? "",
      guestCount: booking.guest_count?.toString() ?? "",
      notes: booking.notes ?? "",
      assignedTo: booking.assigned_to ?? "",
      agentNotes: "",
      financialResolution: "client_pays_diff",
    });
  }, [open, booking]);

  const packageChanged =
    normPackageId(form.packageId) !== (booking.package_id ?? null);

  const selectedPkg = packages.find((p) => p.id === form.packageId);
  const originalPkg = packages.find((p) => p.id === booking.package_id);
  const newAmountRaw = parseFloat(form.totalAmount);
  const newAmount = Number.isNaN(newAmountRaw) ? 0 : newAmountRaw;
  const priceDiff = newAmount - (booking.total_amount ?? 0);

  async function handleSubmit() {
    const totalAmt = parseFloat(form.totalAmount);
    const totalAmountNum = Number.isNaN(totalAmt) ? null : totalAmt;
    const guestParsed = parseInt(form.guestCount, 10);
    const guestCountNum = Number.isNaN(guestParsed) ? null : guestParsed;

    const snapshot: EditBookingFormSnapshot = {
      hallId: form.hallId,
      eventDate: form.eventDate,
      shift: form.shift,
      packageIdRaw: form.packageId,
      totalAmountNum,
      guestCountNum,
      notes: form.notes,
      assignedTo: form.assignedTo,
    };

    const changes = buildEditBookingRpcChanges({ booking, form: snapshot });

    if (!bookingEditRpcHasChanges(changes)) {
      toast({ variant: "destructive", title: t("editNoChanges") });
      return;
    }

    if (packageChanged && !showFinancialStep) {
      setShowFinancialStep(true);
      return;
    }

    const fin: Json | null =
      showFinancialStep && packageChanged
        ? ({ scheme: form.financialResolution } as Json)
        : null;

    const agent_notes =
      showFinancialStep && packageChanged ? form.agentNotes.trim() : null;

    if (showFinancialStep && packageChanged && !agent_notes) {
      return;
    }

    try {
      await editMutation.mutateAsync({
        booking,
        form: snapshot,
        financial_resolution: fin,
        agent_notes,
      });
      toast({ variant: "success", title: t("editSaved") });
      onClose();
    } catch {
      /* onError toast on hook */
    }
  }

  const editAllowed = true;
  const resourcesLoading = hallsLoading || pkgsLoading;
  const isSubmitting = editMutation.isPending;

  const packageSelectValue = form.packageId.trim().length ? form.packageId : "__none__";

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("edit")}</SheetTitle>
          <SheetDescription>
            Booking #{booking.id.slice(0, 8)} · {booking.client?.name}
          </SheetDescription>
        </SheetHeader>

        {!editAllowed && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {t("editsLocked")}
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {resourcesLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("editLoadingVenue")}
            </div>
          ) : !showFinancialStep ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("hall")}</Label>
                  <Select
                    value={form.hallId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, hallId: v }))
                    }
                    disabled={!editAllowed}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("shift")}</Label>
                  <Select
                    value={form.shift}
                    onValueChange={(v: ShiftEnum) =>
                      setForm((f) => ({ ...f, shift: v }))
                    }
                    disabled={!editAllowed}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">{tStatus("morning")}</SelectItem>
                      <SelectItem value="evening">{tStatus("evening")}</SelectItem>
                      <SelectItem value="full_day">{tStatus("full_day")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("date")}</Label>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, eventDate: e.target.value }))
                  }
                  disabled={!editAllowed}
                />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label>{t("package")}</Label>
                <Select
                  value={packageSelectValue}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      packageId: v === "__none__" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("packageFallback")}</SelectItem>
                    {packages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {formatCurrency(p.base_price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {packageChanged && (
                  <Badge variant="warning" className="text-xs">
                    {t("editPackageChangedHint")}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("amount")}</Label>
                  <Input
                    type="number"
                    value={form.totalAmount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, totalAmount: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("guestCount")}</Label>
                  <Input
                    type="number"
                    value={form.guestCount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestCount: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("assignedLabel")}</Label>
                <Input
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assignedTo: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("notes")}</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  {t("editFinancialTitle")}
                </p>
                <div className="space-y-1 text-sm text-amber-700">
                  <div className="flex justify-between">
                    <span>{t("editFinancialPrevPackage")}</span>
                    <span>{originalPkg?.name ?? t("packageFallback")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("editFinancialNewPackage")}</span>
                    <span>{selectedPkg?.name ?? t("packageFallback")}</span>
                  </div>
                  <Separator className="bg-amber-200" />
                  <div className="flex justify-between font-semibold">
                    <span>{t("editFinancialPriceDiff")}</span>
                    <span
                      className={
                        priceDiff >= 0 ? "text-emerald-700" : "text-red-700"
                      }
                    >
                      {priceDiff >= 0 ? "+" : ""}
                      {formatCurrency(priceDiff)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("editFinancialResolutionLabel")}</Label>
                <Select
                  value={form.financialResolution}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, financialResolution: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_pays_diff">
                      {t("editResolutionClientPays")}
                    </SelectItem>
                    <SelectItem value="credit_applied">
                      {t("editResolutionCredit")}
                    </SelectItem>
                    <SelectItem value="refund">{t("editResolutionRefund")}</SelectItem>
                    <SelectItem value="no_change">
                      {t("editResolutionNoChange")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t("editAgentNotesRequired")}</Label>
                <Textarea
                  value={form.agentNotes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, agentNotes: e.target.value }))
                  }
                  placeholder={t("editAgentNotesPlaceholder")}
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          {showFinancialStep ? (
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1"
                type="button"
                onClick={() => setShowFinancialStep(false)}
                disabled={isSubmitting}
              >
                {t("editFinancialBack")}
              </Button>
              <Button
                className="flex-1"
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || !form.agentNotes.trim()}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("editFinancialConfirm")}
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting || !editAllowed}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {packageChanged ? t("editReviewFinancial") : t("saveEdits")}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
