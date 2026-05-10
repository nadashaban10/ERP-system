"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PlusCircle, Receipt, Loader2 } from "lucide-react";
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
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import type { Payment } from "@/lib/types/database";
import { Can } from "@/components/auth/can";
import { useLogPayment, usePaymentsForBooking } from "@/lib/queries/payments";

interface PaymentHistoryProps {
  bookingId: string;
  totalAmount: number;
  amountPaid: number;
  amountOutstanding: number;
}

export function PaymentHistory({
  bookingId,
  totalAmount,
  amountPaid,
  amountOutstanding,
}: PaymentHistoryProps) {
  const t = useTranslations("payments");
  const locale = useLocale();
  const [logOpen, setLogOpen] = useState(false);

  const listQuery = usePaymentsForBooking(bookingId);
  const payments = listQuery.data ?? [];
  const isLoading = listQuery.isPending;

  const logPayment = useLogPayment();
  const isSubmitting = logPayment.isPending;

  const [form, setForm] = useState({
    amount: "",
    method: "cash" as Payment["method"],
    paid_at: new Date().toISOString().split("T")[0],
    milestone: "deposit",
    notes: "",
  });

  async function handleSubmit() {
    const amt = parseFloat(form.amount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast({ variant: "destructive", title: t("invalidAmount") });
      return;
    }

    try {
      await logPayment.mutateAsync({
        bookingId,
        amount: amt,
        method: form.method,
        paid_at_date: form.paid_at,
        milestone: form.milestone || null,
        notes: form.notes.trim() || null,
      });
      toast({ variant: "success", title: t("loggedSuccess") });
      setForm({
        amount: "",
        method: "cash",
        paid_at: new Date().toISOString().split("T")[0],
        milestone: "deposit",
        notes: "",
      });
      setLogOpen(false);
    } catch {
      /* onError on mutation hook */
    }
  }

  const paidPct = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;

  const methodColors: Record<string, string> = {
    cash: "bg-emerald-100 text-emerald-700",
    bank_transfer: "bg-blue-100 text-blue-700",
    instapay: "bg-violet-100 text-violet-700",
    fawry: "bg-amber-100 text-amber-700",
    vodafone_cash: "bg-red-100 text-red-700",
    card: "bg-slate-100 text-slate-700",
    adjustment: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("progressLabel")}</span>
          <span className="font-medium">
            {formatCurrency(amountPaid)} / {formatCurrency(totalAmount)}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(paidPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("percentPaid", { pct: Math.round(paidPct) })}</span>
          {amountOutstanding > 0 && (
            <span className="font-medium text-amber-600">
              {formatCurrency(amountOutstanding)} {t("outstandingSuffix")}
            </span>
          )}
        </div>
      </div>

      <Can permission="payments.create">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => setLogOpen(true)}
          disabled={isLoading}
        >
          <PlusCircle className="h-4 w-4" />
          {t("log")}
        </Button>
      </Can>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("loading")}
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Receipt className="mb-2 h-7 w-7 opacity-30" />
          <p className="text-sm">{t("noPayments")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <div
                className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium ${
                  methodColors[payment.method] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {payment.method.replace("_", " ")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {payment.milestone && (
                    <span className="capitalize">
                      {payment.milestone.replace("_", " ")} ·{" "}
                    </span>
                  )}
                  {formatDate(payment.paid_at, locale)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Can permission="payments.create">
        <Sheet open={logOpen} onOpenChange={setLogOpen}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{t("log")}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 p-6">
              <div className="space-y-1.5">
                <Label>{t("amount")}</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("method")}</Label>
                <Select
                  value={form.method}
                  onValueChange={(v: Payment["method"]) =>
                    setForm((f) => ({ ...f, method: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        ["cash", t("cash")],
                        ["bank_transfer", t("bankTransfer")],
                        ["instapay", t("instapay")],
                        ["fawry", t("fawry")],
                        ["vodafone_cash", t("vodafoneCash")],
                        ["card", t("card")],
                        ["adjustment", t("adjustment")],
                      ] as [string, string][]
                    ).map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("date")}</Label>
                <Input
                  type="date"
                  value={form.paid_at}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paid_at: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("milestone")}</Label>
                <Select
                  value={form.milestone}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, milestone: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">{t("deposit")}</SelectItem>
                    <SelectItem value="2nd_payment">
                      {t("secondPayment")}
                    </SelectItem>
                    <SelectItem value="final">{t("final")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("notes")}</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            </div>
            <SheetFooter className="px-6">
              <Button
                className="w-full"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || !form.amount}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("submit")}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Can>
    </div>
  );
}
