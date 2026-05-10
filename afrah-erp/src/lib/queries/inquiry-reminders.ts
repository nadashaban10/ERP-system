"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  InquiryReminder,
  Json,
  PendingReason,
  ReminderOutcome,
} from "@/lib/types/database";
import { queryKeys } from "@/lib/queries/keys";
import { showMutationError, unwrapMutation, unwrapQuery } from "@/lib/queries/helpers";

export function invalidateInquiryRelatedQueries(
  qc: QueryClient,
  inquiryId: string
): void {
  qc.invalidateQueries({ queryKey: ["inquiries"] });
  qc.invalidateQueries({ queryKey: queryKeys.inquiry(inquiryId) });
  qc.invalidateQueries({ queryKey: queryKeys.inquiryReminders(inquiryId) });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useInquiryReminders(inquiryId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.inquiryReminders(inquiryId ?? "__none__"),
    enabled: !!inquiryId,
    queryFn: async (): Promise<InquiryReminder[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("inquiry_reminders")
        .select("*")
        .eq("inquiry_id", inquiryId as string)
        .order("created_at", { ascending: false });

      const data = unwrapQuery<InquiryReminder[] | null>(
        response as {
          data: InquiryReminder[] | null;
          error: PostgrestError | null;
        },
        null,
        "inquiry reminders"
      );
      return data ?? [];
    },
  });
}

export function useSetInquiryPending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inquiryId: string;
      pending_reason: PendingReason;
      pending_notes: string;
      scheduled_at_iso: string;
    }) => {
      const supabase = createClient();
      const reminder_data: Json = {
        reminder_type: "scheduled_call",
        scheduled_at: input.scheduled_at_iso,
      };
      /** Parameter names must match SQL: `p_reason`, `p_notes`, `p_reminder_data`. */
      const response = await supabase.rpc("set_inquiry_pending", {
        p_inquiry_id: input.inquiryId,
        p_reason: input.pending_reason,
        p_notes: input.pending_notes,
        p_reminder_data: reminder_data,
      });
      return unwrapMutation<Json>(
        response as { data: Json | null; error: PostgrestError | null },
        "set inquiry pending"
      );
    },
    onSuccess: (_, v) => invalidateInquiryRelatedQueries(queryClient, v.inquiryId),
    onError: (e) => showMutationError(e),
  });
}

export function useLogNoResponseInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inquiryId: string;
      reminder_id: string;
      notes?: string | null;
      next_call_at_iso?: string | null;
    }) => {
      const supabase = createClient();
      const response = await supabase.rpc("log_no_response", {
        p_reminder_id: input.reminder_id,
        p_notes: input.notes ?? null,
        p_next_call_at: input.next_call_at_iso ?? null,
      });
      return unwrapMutation<Json>(
        response as { data: Json | null; error: PostgrestError | null },
        "log no response"
      );
    },
    onSuccess: (_, v) => invalidateInquiryRelatedQueries(queryClient, v.inquiryId),
    onError: (e) => showMutationError(e),
  });
}

export function useResolveInquiryReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inquiryId: string;
      reminder_id: string;
      outcome: ReminderOutcome;
      outcome_notes: string;
      next_call_at_iso?: string | null;
    }) => {
      const supabase = createClient();
      const response = await supabase.rpc("resolve_reminder", {
        p_reminder_id: input.reminder_id,
        p_outcome: input.outcome,
        p_outcome_notes: input.outcome_notes,
        p_next_call_at: input.next_call_at_iso ?? null,
      });
      return unwrapMutation<Json>(
        response as { data: Json | null; error: PostgrestError | null },
        "resolve reminder"
      );
    },
    onSuccess: (_, v) => invalidateInquiryRelatedQueries(queryClient, v.inquiryId),
    onError: (e) => showMutationError(e),
  });
}

/** Completes an open reminder (answered / success) without a dedicated RPC. */
export function useAnswerInquiryCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inquiryId: string;
      reminderId: string | null;
      notes: string;
    }) => {
      const supabase = createClient();

      if (input.reminderId) {
        const r1 = await supabase
          .from("inquiry_reminders")
          .update({
            status: "completed",
            outcome_notes: input.notes || null,
          })
          .eq("id", input.reminderId)
          .eq("status", "pending");
        if (r1.error) throw new Error(r1.error.message);
      }

      const r2 = await supabase
        .from("inquiries")
        .update({ status: "contacted" })
        .eq("id", input.inquiryId)
        .neq("status", "converted")
        .neq("status", "cancelled");

      if (r2.error) throw new Error(r2.error.message);
      return { ok: true as const };
    },
    onSuccess: (_, v) => invalidateInquiryRelatedQueries(queryClient, v.inquiryId),
    onError: (e) => showMutationError(e),
  });
}
