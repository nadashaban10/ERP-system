"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Json, Payment, PaymentMethod } from "@/lib/types/database";
import { queryKeys } from "@/lib/queries/keys";
import {
  showMutationError,
  unwrapMutation,
  unwrapQuery,
} from "@/lib/queries/helpers";

export function usePaymentsForBooking(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.payments(bookingId ?? "__none__"),
    enabled: !!bookingId,
    queryFn: async (): Promise<Payment[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId as string)
        .order("created_at", { ascending: false });
      const rows = unwrapQuery<Payment[] | null>(
        response as { data: Payment[] | null; error: PostgrestError | null },
        null,
        "payments list"
      );
      return rows ?? [];
    },
  });
}

export type LogPaymentInput = {
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  /** `YYYY-MM-DD` (Postgres `date` for `log_payment.p_paid_at`) */
  paid_at_date: string;
  milestone: string | null;
  notes?: string | null;
};

export function useLogPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LogPaymentInput) => {
      const supabase = createClient();
      const response = await supabase.rpc("log_payment", {
        p_booking_id: input.bookingId,
        p_amount: input.amount,
        p_method: input.method,
        p_paid_at: input.paid_at_date,
        p_milestone: input.milestone,
        p_proof_url: null,
        p_notes: input.notes ?? null,
      });
      return unwrapMutation<Json>(
        response as { data: Json | null; error: PostgrestError | null },
        "log payment"
      );
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments(v.bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.booking(v.bookingId) });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => showMutationError(e),
  });
}
