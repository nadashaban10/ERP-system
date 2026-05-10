"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database, EventRecordType } from "@/lib/types/database";
import { queryKeys } from "@/lib/queries/keys";
import { unwrapMutation, unwrapQuery } from "@/lib/queries/helpers";

/**
 * Note: event types are loaded as part of `useHalls()` (joined query). These
 * mutation hooks just invalidate the halls cache so the inline list refreshes.
 */

type EventRecordTypeInsert =
  Database["public"]["Tables"]["event_record_types"]["Insert"];
type EventRecordTypeUpdate =
  Database["public"]["Tables"]["event_record_types"]["Update"];

export type CreateEventTypeInput = {
  hall_id: string;
  name: string;
  time_model: EventRecordType["time_model"];
};

export function useCreateEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEventTypeInput) => {
      const supabase = createClient();
      const payload: EventRecordTypeInsert = {
        hall_id: input.hall_id,
        name: input.name,
        time_model: input.time_model,
        is_active: true,
      };
      const response = await supabase
        .from("event_record_types")
        .insert(payload)
        .select()
        .single();
      return unwrapMutation<EventRecordType>(response, "create event type");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.halls });
    },
  });
}

export type UpdateEventTypeInput = {
  id: string;
  changes: Partial<Pick<EventRecordType, "name" | "time_model" | "is_active">>;
};

export function useUpdateEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateEventTypeInput) => {
      const supabase = createClient();
      const payload: EventRecordTypeUpdate = input.changes;
      const response = await supabase
        .from("event_record_types")
        .update(payload)
        .eq("id", input.id)
        .select()
        .single();
      return unwrapMutation<EventRecordType>(response, "update event type");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.halls });
    },
  });
}

export function useDeleteEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("event_record_types")
        .delete()
        .eq("id", id);
      if (error) throw new Error(`delete event type: ${error.message}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.halls });
    },
  });
}

/**
 * Active event type for `create_booking.event_type_id`: prefers **shift_based**;
 * falls back to any active type (slot-based halls may still need slot UX later).
 */
export function usePrimaryShiftBasedEventTypeIdForHall(
  hallId: string | null | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: [...queryKeys.eventTypes(hallId ?? "__none__"), "shiftPrimary"] as const,
    enabled: enabled && !!hallId,
    queryFn: async (): Promise<string | null> => {
      const supabase = createClient();
      const primary = await supabase
        .from("event_record_types")
        .select("id")
        .eq("hall_id", hallId as string)
        .eq("is_active", true)
        .eq("time_model", "shift_based")
        .order("name")
        .limit(1)
        .maybeSingle();

      let row = unwrapQuery<{ id: string } | null>(
        primary,
        null,
        "hall primary shift event type"
      );

      if (!row) {
        const fallback = await supabase
          .from("event_record_types")
          .select("id")
          .eq("hall_id", hallId as string)
          .eq("is_active", true)
          .order("name")
          .limit(1)
          .maybeSingle();
        row = unwrapQuery<{ id: string } | null>(
          fallback,
          null,
          "hall primary event type (any model)"
        );
      }

      return row?.id ?? null;
    },
  });
}
