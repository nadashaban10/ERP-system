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
import { MOCK_BOOKINGS } from "@/lib/mock-data";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Can } from "@/components/auth/can";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toaster";

interface BookingDetailContentProps {
  params: Promise<{ id: string; locale: string }>;
}

export function BookingDetailContent({ params }: BookingDetailContentProps) {
  const { id } = use(params);
  const t = useTranslations("bookings");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const booking = MOCK_BOOKINGS.find((b) => b.id === id);

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Booking not found</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/bookings`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
      </div>
    );
  }

  // TODO (Supabase): replace with RPC `is_edit_allowed(booking_id)` to enforce cutoff.
  const editAllowed = true;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/bookings`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Bookings
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
              disabled={!editAllowed}
            >
              <Edit3 className="h-4 w-4" />
              {t("edit")}
            </Button>
          </Can>

          <Can permission="bookings.delete">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirmCancel")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel the booking for {booking.client?.name}. The
                    slot will be freed and a notification will be sent.
                    {booking.amount_outstanding > 0 && (
                      <span className="block mt-2 text-amber-600 font-medium">
                        ⚠ Outstanding balance:{" "}
                        {formatCurrency(booking.amount_outstanding)}
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      toast({
                        variant: "success",
                        title: "Booking cancelled",
                        description: "The slot has been freed",
                      });
                      router.push(`/${locale}/bookings`);
                    }}
                  >
                    Cancel Booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Can>
        </div>
      </div>

      {/* Title row */}
      <div className="flex items-start gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {booking.client?.name}
            </h1>
            <StatusBadge
              status={booking.status}
              label={tStatus(booking.status as never)}
            />
            {booking.edit_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {booking.edit_count} edit{booking.edit_count !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Booking #{booking.id.slice(0, 8)} · Created{" "}
            {formatDate(booking.created_at, locale)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Event details card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Event Date</p>
                  <p className="text-sm font-semibold">
                    {formatDate(booking.event_date, locale)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Shift / Time</p>
                  <p className="text-sm font-semibold capitalize">
                    {booking.shift?.replace("_", " ")} · {booking.start_time} –{" "}
                    {booking.end_time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hall</p>
                  <p className="text-sm font-semibold">
                    {booking.hall?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Guests</p>
                  <p className="text-sm font-semibold">
                    {booking.guest_count ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Package2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Package</p>
                  <p className="text-sm font-semibold">
                    {booking.package?.name ?? "Custom"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="text-sm font-semibold">
                    {booking.assigned_to ?? "—"}
                  </p>
                </div>
              </div>
            </CardContent>
            {booking.notes && (
              <>
                <Separator />
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Notes
                  </p>
                  <p className="text-sm">{booking.notes}</p>
                </CardContent>
              </>
            )}
          </Card>

          {/* Tabs: Payments + Edit History */}
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

        {/* Right column: Client + Financial */}
        <div className="space-y-5">
          {/* Client card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                  {booking.client?.name?.[0]}
                </div>
                <div>
                  <p className="font-medium">{booking.client?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Source: {booking.source}
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
                <Link href={`/${locale}/clients`}>View Client Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Financial card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">
                  {formatCurrency(booking.total_amount ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(booking.amount_paid)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-bold">
                <span>Outstanding</span>
                <span
                  className={
                    booking.amount_outstanding > 0
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }
                >
                  {booking.amount_outstanding > 0
                    ? formatCurrency(booking.amount_outstanding)
                    : "Paid in full ✓"}
                </span>
              </div>

              {!editAllowed && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-700">
                  Edits locked
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
