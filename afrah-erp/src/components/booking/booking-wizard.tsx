"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  CalendarDays,
  Package,
  CheckCircle2,
  Search,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import type {
  BookingSource,
  BookingStatus,
  Client,
  Package as PackageType,
  ShiftEnum,
} from "@/lib/types/database";
import { useVenue } from "@/lib/queries/venue";
import { useClientsForVenue } from "@/lib/queries/clients";
import { useActiveHalls } from "@/lib/queries/halls";
import { usePackages } from "@/lib/queries/packages";
import {
  buildCreateBookingJson,
  runCheckAvailabilityRpc,
  useCreateBooking,
} from "@/lib/queries/bookings";
import { usePrimaryShiftBasedEventTypeIdForHall } from "@/lib/queries/event-types";
import {
  useConvertInquiryToBooking,
  type InquiryBookingConversionContext,
} from "@/lib/queries/inquiries";

// ─── Wizard State ─────────────────────────────────────────────────────────────

interface WizardData {
  // Step 1: Client
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  clientPhone2: string;
  clientEmail: string;
  isNewClient: boolean;
  // Step 2: Date & Time
  hallId: string;
  eventDate: string;
  shift: "morning" | "evening" | "full_day";
  guestCount: string;
  // Step 3: Package
  packageId: string | null;
  totalAmount: string;
  // Step 4: Confirm
  status: "on_hold" | "confirmed";
  holdExpiresAt: string;
  assignedTo: string;
  notes: string;
  source: string;
}

// ─── Step indicators ──────────────────────────────────────────────────────────

const STEPS = ["step1", "step2", "step3", "step4"] as const;

interface BookingWizardProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  /** When set, submit calls `convert_inquiry_to_booking` with this inquiry id and the built booking JSON. */
  conversion?: InquiryBookingConversionContext | null;
}

export function BookingWizard({
  open,
  onClose,
  defaultDate,
  conversion,
}: BookingWizardProps) {
  const t = useTranslations("bookings.wizard");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [availabilityMsg, setAvailabilityMsg] = useState<{
    available: boolean;
    msg: string;
  } | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const appliedConversionInquiryId = useRef<string | null>(null);

  const [data, setData] = useState<WizardData>({
    clientId: null,
    clientName: "",
    clientPhone: "",
    clientPhone2: "",
    clientEmail: "",
    isNewClient: false,
    hallId: "",
    eventDate: defaultDate ?? "",
    shift: "evening",
    guestCount: "",
    packageId: null,
    totalAmount: "",
    status: "confirmed",
    holdExpiresAt: "",
    assignedTo: "",
    notes: "",
    source: "phone",
  });

  const venueQuery = useVenue();
  const venueId = venueQuery.data?.id;
  const { data: halls = [] } = useActiveHalls();
  const packagesQuery = usePackages();
  const packagesList = (packagesQuery.data ?? []).filter((p) => p.is_active);

  const clientsQuery = useClientsForVenue(open ? venueId : undefined);
  const allClients = clientsQuery.data ?? [];

  const createBookingMutation = useCreateBooking();
  const convertInquiryMutation = useConvertInquiryToBooking();

  const eventTypeIdQuery = usePrimaryShiftBasedEventTypeIdForHall(
    data.hallId || undefined,
    open && !!venueId && !!data.hallId
  );

  useEffect(() => {
    if (!open || !halls.length) return;
    setData((d) => (d.hallId ? d : { ...d, hallId: halls[0].id }));
  }, [open, halls]);

  useEffect(() => {
    if (!open) {
      appliedConversionInquiryId.current = null;
      return;
    }
    if (!conversion) return;
    if (appliedConversionInquiryId.current === conversion.inquiryId) return;
    appliedConversionInquiryId.current = conversion.inquiryId;

    setData((d) => ({
      ...d,
      clientId: conversion.clientId,
      clientName: conversion.clientName,
      clientPhone: conversion.clientPhone,
      clientPhone2: conversion.clientPhone2,
      clientEmail: conversion.clientEmail,
      isNewClient: false,
      eventDate: conversion.desiredDate ?? defaultDate ?? d.eventDate ?? "",
      guestCount:
        conversion.guestCount != null ? String(conversion.guestCount) : d.guestCount,
      source: conversion.bookingSource,
      notes: conversion.inquiryNotes
        ? d.notes.trim()
          ? `${conversion.inquiryNotes}\n\n${d.notes}`
          : conversion.inquiryNotes
        : d.notes,
    }));
    setStep(0);
    setAvailabilityMsg(null);
    setClientSearch("");
  }, [open, conversion, defaultDate]);

  function update(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function selectClient(client: Client) {
    update({
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone_1,
      clientPhone2: client.phone_2 ?? "",
      clientEmail: client.email ?? "",
      isNewClient: false,
    });
    setClientSearch("");
  }

  function selectPackage(pkg: PackageType) {
    const guests = parseInt(data.guestCount) || 1;
    const amount =
      pkg.price_type === "flat_rate"
        ? pkg.base_price
        : pkg.base_price * guests;
    update({
      packageId: pkg.id,
      totalAmount: amount.toString(),
    });
  }

  async function checkAvailability() {
    if (!data.hallId || !data.eventDate || !data.shift) return;
    setIsCheckingAvailability(true);
    setAvailabilityMsg(null);
    const result = await runCheckAvailabilityRpc({
      hallId: data.hallId,
      date: data.eventDate,
      shift: data.shift,
    });
    setIsCheckingAvailability(false);

    if (!result) {
      setAvailabilityMsg({
        available: true,
        msg: t("configureBackend"),
      });
      return;
    }

    if (!result.available) {
      const conflictHint =
        result.client_name != null
          ? result.client_name
          : result.booking_id != null
            ? `#${result.booking_id.slice(0, 8)}`
            : null;
      setAvailabilityMsg({
        available: false,
        msg: conflictHint
          ? `${t("slotUnavailable")} (${conflictHint})`
          : t("slotUnavailable"),
      });
      return;
    }

    setAvailabilityMsg({
      available: true,
      msg: t("slotAvailable"),
    });
  }

  async function handleSubmit() {
    if (!venueId) return;
    const eventTypeId = eventTypeIdQuery.data;
    if (!eventTypeId) {
      toast({
        variant: "destructive",
        title: t("bookingCreateFailedTitle"),
        description: t("noEventTypeConfigured"),
      });
      return;
    }

    const totalAmt = parseFloat(data.totalAmount);
    const gc = parseInt(data.guestCount, 10);
    const bookingJson = buildCreateBookingJson({
      hallId: data.hallId,
      eventTypeId,
      packageId: data.packageId,
      clientId: data.clientId,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientPhone2: data.clientPhone2,
      clientEmail: data.clientEmail,
      eventDate: data.eventDate,
      shift: data.shift as ShiftEnum,
      totalAmount: Number.isNaN(totalAmt) ? null : totalAmt,
      guestCount: Number.isNaN(gc) ? null : gc,
      status: data.status as BookingStatus,
      source: data.source as BookingSource,
      assignedTo: data.assignedTo,
      notes: data.notes,
      holdExpiresAt: data.status === "on_hold" ? data.holdExpiresAt || null : null,
    });

    setIsSubmitting(true);
    try {
      if (conversion) {
        await convertInquiryMutation.mutateAsync({
          inquiryId: conversion.inquiryId,
          booking_data: bookingJson,
        });
        toast({
          variant: "success",
          title: t("bookingConvertedToast"),
          description: t("bookingConvertedToastDesc", {
            name: data.clientName,
            date: formatDate(data.eventDate, locale),
          }),
        });
      } else {
        await createBookingMutation.mutateAsync(bookingJson);
        toast({
          variant: "success",
          title: t("bookingCreatedToast"),
          description: t("bookingCreatedToastDesc", {
            name: data.clientName,
            date: formatDate(data.eventDate, locale),
          }),
        });
      }
      handleClose();
    } catch {
      /* mutation shows toast */
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    onClose();
    setStep(0);
    setData({
      clientId: null,
      clientName: "",
      clientPhone: "",
      clientPhone2: "",
      clientEmail: "",
      isNewClient: false,
      hallId: "",
      eventDate: defaultDate ?? "",
      shift: "evening",
      guestCount: "",
      packageId: null,
      totalAmount: "",
      status: "confirmed",
      holdExpiresAt: "",
      assignedTo: "",
      notes: "",
      source: "phone",
    });
    setAvailabilityMsg(null);
    setClientSearch("");
  }

  const filteredClients = clientSearch
    ? allClients.filter(
        (c) =>
          c.phone_1.includes(clientSearch) ||
          c.name.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : [];

  const stepIcons = [
    <User key="1" className="h-4 w-4" />,
    <CalendarDays key="2" className="h-4 w-4" />,
    <Package key="3" className="h-4 w-4" />,
    <CheckCircle2 key="4" className="h-4 w-4" />,
  ];

  const stepLabels = [t("step1"), t("step2"), t("step3"), t("step4")];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{conversion ? t("titleFromInquiry") : t("title")}</DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-0 mb-6 mt-2">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors border-2",
                  i < step
                    ? "bg-primary border-primary text-primary-foreground"
                    : i === step
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : stepIcons[i]}
              </div>
              <span
                className={cn(
                  "ml-2 text-xs font-medium hidden sm:block",
                  i === step ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {stepLabels[i]}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-3",
                    i < step ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="space-y-4 min-h-[280px]">
          {/* ─── Step 1: Client ─── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchClient")}
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {filteredClients.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectClient(c)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors border-b last:border-0 border-border"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phone_1}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {data.clientId && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                    {data.clientName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{data.clientName}</p>
                    <p className="text-xs text-muted-foreground">{data.clientPhone}</p>
                  </div>
                  <Badge variant="success">Selected</Badge>
                </div>
              )}

              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Or add {t("newClient")}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("clientName")}</Label>
                  <Input
                    value={data.clientName}
                    onChange={(e) =>
                      update({ clientName: e.target.value, clientId: null, isNewClient: true })
                    }
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("clientPhone")}</Label>
                  <Input
                    value={data.clientPhone}
                    onChange={(e) =>
                      update({ clientPhone: e.target.value })
                    }
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("clientPhone2")}</Label>
                  <Input
                    value={data.clientPhone2}
                    onChange={(e) => update({ clientPhone2: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("clientEmail")}</Label>
                  <Input
                    value={data.clientEmail}
                    onChange={(e) => update({ clientEmail: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 2: Date & Time ─── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("hallLabel")}</Label>
                  <Select
                    value={data.hallId}
                    onValueChange={(v) =>
                      update({ hallId: v, packageId: null, totalAmount: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          halls.length ? undefined : t("noHallsConfigured")
                        }
                      />
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
                  <Label>{t("guestCountLabel")}</Label>
                  <Input
                    type="number"
                    value={data.guestCount}
                    onChange={(e) => update({ guestCount: e.target.value })}
                    placeholder="150"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("selectDate")}</Label>
                <Input
                  type="date"
                  value={data.eventDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    update({ eventDate: e.target.value });
                    setAvailabilityMsg(null);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("selectShift")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "morning", label: t("morning") },
                      { value: "evening", label: t("evening") },
                      { value: "full_day", label: t("fullDay") },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        update({ shift: opt.value });
                        setAvailabilityMsg(null);
                      }}
                      className={cn(
                        "rounded-xl border p-3 text-sm font-medium transition-colors text-center",
                        data.shift === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={checkAvailability}
                disabled={!data.eventDate || isCheckingAvailability}
              >
                {isCheckingAvailability && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isCheckingAvailability
                  ? t("checking")
                  : t("checkAvailability")}
              </Button>

              {availabilityMsg && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl p-3 text-sm",
                    availabilityMsg.available
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  )}
                >
                  {availabilityMsg.available ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <span className="h-4 w-4 shrink-0">⚠</span>
                  )}
                  {availabilityMsg.msg}
                </div>
              )}
            </div>
          )}

          {/* ─── Step 3: Package ─── */}
          {step === 2 && (
            <div className="space-y-4">
              {packagesList.length === 0 && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {t("noPackagesConfigured")}
                </p>
              )}
              <div className="grid grid-cols-1 gap-2.5">
                {packagesList.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => selectPackage(pkg)}
                    className={cn(
                      "rounded-xl border p-3.5 text-left transition-colors",
                      data.packageId === pkg.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {pkg.inclusions}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-primary">
                          {formatCurrency(pkg.base_price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pkg.price_type === "per_person"
                            ? "/person"
                            : "flat rate"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <Separator />
              <div className="space-y-1.5">
                <Label>{t("totalAmount")}</Label>
                <Input
                  type="number"
                  value={data.totalAmount}
                  onChange={(e) => update({ totalAmount: e.target.value })}
                  placeholder="Custom amount"
                />
                <p className="text-xs text-muted-foreground">
                  Override package price for custom deals
                </p>
              </div>
            </div>
          )}

          {/* ─── Step 4: Confirm ─── */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-xl bg-muted/50 p-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{data.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hall</span>
                  <span className="font-medium">
                    {halls.find((h) => h.id === data.hallId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {data.eventDate
                      ? formatDate(data.eventDate, locale)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shift</span>
                  <span className="font-medium capitalize">{data.shift}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-primary">
                    {data.totalAmount
                      ? formatCurrency(parseFloat(data.totalAmount))
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Initial Status</Label>
                  <Select
                    value={data.status}
                    onValueChange={(v: "on_hold" | "confirmed") =>
                      update({ status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select
                    value={data.source}
                    onValueChange={(v) => update({ source: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {data.status === "on_hold" && (
                <div className="space-y-1.5">
                  <Label>Hold Expires At</Label>
                  <Input
                    type="date"
                    value={data.holdExpiresAt}
                    onChange={(e) => update({ holdExpiresAt: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Assigned To</Label>
                <Input
                  value={data.assignedTo}
                  onChange={(e) => update({ assignedTo: e.target.value })}
                  placeholder="Staff member name"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={data.notes}
                  onChange={(e) => update({ notes: e.target.value })}
                  placeholder="Special requests, dietary needs..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => (step === 0 ? handleClose() : setStep(step - 1))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step === 0 ? tc("cancel") : t("back")}
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !data.clientName}
            >
              {t("next")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => void handleSubmit()}
              disabled={
                isSubmitting ||
                convertInquiryMutation.isPending ||
                createBookingMutation.isPending ||
                (data.status === "on_hold" && !data.holdExpiresAt)
              }
            >
              {(isSubmitting ||
                convertInquiryMutation.isPending ||
                createBookingMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {conversion ? t("confirmFromInquiry") : t("confirm")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
