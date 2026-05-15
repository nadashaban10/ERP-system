"use client";

import { use, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  XCircle,
  Calendar,
  Users,
  Building2,
  Package2,
  Phone,
  Mail,
  User,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaymentHistory } from "@/components/booking/payment-history";
import { EditHistoryTimeline } from "@/components/booking/edit-history-timeline";
import { EditBookingSheet } from "@/components/booking/edit-booking-sheet";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Can } from "@/components/auth/can";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toaster";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BookingStatus, CancellationReason } from "@/lib/types/database";
import {
  useBookingDetail,
  useCancelBooking,
  useIsEditAllowed,
} from "@/lib/queries/bookings";
import { bookingAssignedDisplay } from "@/lib/booking/assigned-label";
import { useAssignableAgents } from "@/lib/queries/assignable-agents";

const CANCEL_REASONS: CancellationReason[] = [
  "customer_not_reached",
  "chose_another_venue",
  "budget_too_high",
  "date_not_available",
  "no_longer_getting_married",
  "unresponsive_no_contact",
  "hold_expired",
  "other",
];

interface BookingDetailContentProps {
  params: Promise<{ id: string; locale: string }>;
}

export function BookingDetailContent({ params }: BookingDetailContentProps) {
  const { id } = use(params);
  const t = useTranslations("bookings");
  const tRc = useTranslations("bookings.cancellationReasons");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<CancellationReason>("other");
  const [cancelNotes, setCancelNotes] = useState("");

  const bookingQuery = useBookingDetail(id);
  const editAllowedQuery = useIsEditAllowed(id);
  const cancelMutation = useCancelBooking();
  const { data: assignableAgents = [] } = useAssignableAgents();

  const booking = bookingQuery.data;
  const bookingLoading = bookingQuery.isPending;
  const editAllowed =
    booking != null &&
    booking.status !== "cancelled" &&
    editAllowedQuery.data?.allowed !== false;

  if (bookingLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("notFoundTitle")}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/bookings`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToBookings")}
          </Link>
        </Button>
      </div>
    );
  }

  const assignedLabel = bookingAssignedDisplay(booking, assignableAgents);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/bookings`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToBookings")}
          </Link>
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Can permission="bookings.edit">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setEditOpen(true)}
              disabled={!editAllowed || booking.status === "cancelled"}
            >
              <Edit3 className="h-4 w-4" />
              {t("edit")}
            </Button>
          </Can>

          <Can permission="bookings.delete">
            {booking.status !== "cancelled" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <XCircle className="h-4 w-4" />
                    {t("cancel")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("confirmCancel")}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3">
                        <p>
                          {t("cancelDescriptionIntro", {
                            name: booking.client?.name ?? "—",
                          })}
                        </p>
                        {booking.amount_outstanding > 0 && (
                          <span className="block font-medium text-amber-600">
                            {t("cancelOutstandingWarning")}{" "}
                            {formatCurrency(booking.amount_outstanding)}
                          </span>
                        )}
                        <div className="space-y-1.5 pt-2">
                          <Label>{t("cancelReason")}</Label>
                          <Select
                            value={cancelReason}
                            onValueChange={(v) =>
                              setCancelReason(v as CancellationReason)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CANCEL_REASONS.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {tRc(r)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t("notes")}</Label>
                          <Textarea
                            value={cancelNotes}
                            onChange={(e) => setCancelNotes(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("keepBooking")}</AlertDialogCancel>
                    <Button
                      variant="destructive"
                      disabled={cancelMutation.isPending}
                      onClick={() => {
                        cancelMutation.mutate(
                          {
                            bookingId: booking.id,
                            reason: cancelReason,
                            notes: cancelNotes.trim() || undefined,
                          },
                          {
                            onSuccess: () => {
                              toast({
                                variant: "success",
                                title: t("cancelSuccessToast"),
                              });
                              router.push(`/${locale}/bookings`);
                            },
                          }
                        );
                      }}
                    >
                      {cancelMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("cancelBookingAction")}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </Can>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {booking.client?.name}
            </h1>
            <StatusBadge
              status={booking.status}
              label={tStatus(booking.status as BookingStatus)}
            />
            {booking.edit_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {booking.edit_count} edits
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Booking #{booking.id.slice(0, 8)} · Created{" "}
            {formatDate(booking.created_at, locale)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("eventDetailsSection")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("date")}</p>
                  <p className="text-sm font-semibold">
                    {formatDate(booking.event_date, locale)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("shiftTimeLabel")}</p>
                  <p className="text-sm font-semibold capitalize">
                    {booking.shift?.replace("_", " ")} · {booking.start_time} –{" "}
                    {booking.end_time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("hall")}</p>
                  <p className="text-sm font-semibold">{booking.hall?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("guestsShort")}</p>
                  <p className="text-sm font-semibold">
                    {booking.guest_count ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                  <Package2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("package")}</p>
                  <p className="text-sm font-semibold">
                    {booking.package?.name ?? t("packageFallback")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("assignedLabel")}</p>
                  <p className="text-sm font-semibold">{assignedLabel}</p>
                </div>
              </div>
            </CardContent>
            {booking.notes && (
              <>
                <Separator />
                <CardContent className="pt-4">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">
                    {t("notes")}
                  </p>
                  <p className="text-sm">{booking.notes}</p>
                </CardContent>
              </>
            )}
          </Card>

          <Tabs defaultValue="payments">
            <TabsList>
              <TabsTrigger value="payments">{t("paymentHistory")}</TabsTrigger>
              <TabsTrigger value="edits">{t("editHistory")}</TabsTrigger>
            </TabsList>
            <TabsContent value="payments">
              <Card>
                <CardContent className="pt-5">
                  <PaymentHistory
                    bookingId={booking.id}
                    totalAmount={booking.total_amount ?? 0}
                    amountPaid={booking.amount_paid}
                    amountOutstanding={booking.amount_outstanding}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="edits">
              <Card>
                <CardContent className="pt-5">
                  <EditHistoryTimeline bookingId={booking.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("clientCardTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {booking.client?.name?.[0]}
                </div>
                <div>
                  <p className="font-medium">{booking.client?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("sourceLabel")}: {booking.source}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{booking.client?.phone_1}</span>
                </div>
                {booking.client?.phone_2 && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{booking.client.phone_2}</span>
                  </div>
                )}
                {booking.client?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{booking.client.email}</span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/${locale}/clients`}>{t("viewClients")}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("financialsSection")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("totalLabel")}</span>
                <span className="font-semibold">
                  {formatCurrency(booking.total_amount ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("paidLabel")}</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(booking.amount_paid)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-bold">
                <span>{t("outstandingLabel")}</span>
                <span
                  className={
                    booking.amount_outstanding > 0
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }
                >
                  {booking.amount_outstanding > 0
                    ? formatCurrency(booking.amount_outstanding)
                    : t("paidInFull")}
                </span>
              </div>

              {!editAllowed && booking.status !== "cancelled" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                  {t("editsLocked")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Can permission="bookings.edit">
        <EditBookingSheet
          booking={booking}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      </Can>
    </div>
  );
}
