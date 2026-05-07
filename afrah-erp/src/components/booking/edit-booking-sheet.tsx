"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Edit3, AlertCircle, Loader2 } from "lucide-react";
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
import { MOCK_HALLS, MOCK_PACKAGES } from "@/lib/mock-data";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import type { Booking } from "@/lib/types/database";

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
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinancialStep, setShowFinancialStep] = useState(false);

  const [form, setForm] = useState({
    hallId: booking.hall_id,
    eventDate: booking.event_date,
    shift: booking.shift ?? "evening",
    packageId: booking.package_id ?? "",
    totalAmount: booking.total_amount?.toString() ?? "",
    guestCount: booking.guest_count?.toString() ?? "",
    notes: booking.notes ?? "",
    assignedTo: booking.assigned_to ?? "",
    agentNotes: "",
    financialResolution: "client_pays_diff",
  });

  const packageChanged = form.packageId !== (booking.package_id ?? "");
  const selectedPkg = MOCK_PACKAGES.find((p) => p.id === form.packageId);
  const originalPkg = MOCK_PACKAGES.find((p) => p.id === booking.package_id);
  const newAmount = parseFloat(form.totalAmount) || 0;
  const priceDiff = newAmount - (booking.total_amount ?? 0);

  async function handleSubmit() {
    if (packageChanged && !showFinancialStep) {
      setShowFinancialStep(true);
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    // TODO: supabase.rpc("edit_booking", { booking_id: booking.id, changes: form, ... })
    toast({
      variant: "success",
      title: "Booking updated",
      description: "Edit history has been recorded",
    });
    setIsSubmitting(false);
    onClose();
  }

  // TODO (Supabase): replace with RPC `is_edit_allowed(booking_id)` to enforce
  // server-side cutoff using venue settings + overrides.
  const editAllowed = true;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("edit")}</SheetTitle>
          <SheetDescription>
            Booking #{booking.id.slice(0, 8)} · {booking.client?.name}
          </SheetDescription>
        </SheetHeader>

        {!editAllowed && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Editing locked
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!showFinancialStep ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hall</Label>
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
                      {MOCK_HALLS.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Shift</Label>
                  <Select
                    value={form.shift}
                    onValueChange={(v: "morning" | "evening" | "full_day") =>
                      setForm((f) => ({ ...f, shift: v }))
                    }
                    disabled={!editAllowed}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="full_day">Full Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Event Date</Label>
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
                <Label>Package</Label>
                <Select
                  value={form.packageId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, packageId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_PACKAGES.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {formatCurrency(p.base_price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {packageChanged && (
                  <Badge variant="warning" className="text-xs">
                    Package changed — financial review required
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Total Amount (EGP)</Label>
                  <Input
                    type="number"
                    value={form.totalAmount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, totalAmount: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Guest Count</Label>
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
                <Label>Assigned To</Label>
                <Input
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assignedTo: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
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
            /* Financial resolution step */
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-800">
                  Financial Review Required
                </p>
                <div className="text-sm text-amber-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Previous package</span>
                    <span>{originalPkg?.name ?? "Custom"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New package</span>
                    <span>{selectedPkg?.name ?? "Custom"}</span>
                  </div>
                  <Separator className="bg-amber-200" />
                  <div className="flex justify-between font-semibold">
                    <span>Price difference</span>
                    <span className={priceDiff >= 0 ? "text-emerald-700" : "text-red-700"}>
                      {priceDiff >= 0 ? "+" : ""}{formatCurrency(priceDiff)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Resolution</Label>
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
                    <SelectItem value="client_pays_diff">Client pays the difference</SelectItem>
                    <SelectItem value="credit_applied">Apply as credit</SelectItem>
                    <SelectItem value="refund">Issue refund</SelectItem>
                    <SelectItem value="no_change">No financial change</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Agent Notes (required)</Label>
                <Textarea
                  value={form.agentNotes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, agentNotes: e.target.value }))
                  }
                  placeholder="Explain the reason for package change..."
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
                onClick={() => setShowFinancialStep(false)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting || !form.agentNotes}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Edit
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !editAllowed}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {packageChanged ? "Review Financial Change →" : "Save Changes"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
