"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { EventRecordType, Hall } from "@/lib/types/database";
import { queryKeys } from "@/lib/queries/keys";
import { unwrapMutation, unwrapQuery } from "@/lib/queries/helpers";

/** A hall row joined with its event types — what we render in settings. */
export type HallWithEventTypes = Hall & {
  event_record_types: EventRecordType[];
};

/**
 * List all halls in the user's venue (tenant scoped via RLS).
 * Includes event types so the settings page can render them inline.
 */
export function useHalls() {
  return useQuery({
    queryKey: queryKeys.halls,
    queryFn: async (): Promise<HallWithEventTypes[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("halls")
        .select("*, event_record_types(*)")
        .order("name");
      return unwrapQuery<HallWithEventTypes[]>(
        response as unknown as { data: HallWithEventTypes[] | null; error: typeof response.error },
        [],
        "load halls"
      );
    },
  });
}

/**
 * Just the active halls with id+name — used by selectors (dashboard topbar,
 * booking wizard, calendar filter). Cached separately so toggling a hall's
 * "active" flag in settings invalidates only this small list, not the full
 * halls-with-event-types payload.
 */
export function useActiveHalls() {
  return useQuery({
    queryKey: [...queryKeys.halls, "active"] as const,
    queryFn: async (): Promise<Pick<Hall, "id" | "name" | "is_active">[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("halls")
        .select("id, name, is_active")
        .eq("is_active", true)
        .order("name");
      return unwrapQuery(response, [], "load active halls");
    },
  });
}

export type CreateHallInput = {
  venue_id: string;
  name: string;
  capacity_min: number | null;
  capacity_max: number;
  amenities: string[];
};

export function useCreateHall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateHallInput) => {
      const supabase = createClient();
      const response = await supabase
        .from("halls")
        .insert({
          venue_id: input.venue_id,
          name: input.name,
          capacity_min: input.capacity_min,
          capacity_max: input.capacity_max,
          amenities: input.amenities,
          is_active: true,
        })
        .select()
        .single();
      return unwrapMutation<Hall>(response, "create hall");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.halls });
    },
  });
}

export type UpdateHallInput = {
  id: string;
  changes: Partial<
    Pick<Hall, "name" | "capacity_min" | "capacity_max" | "amenities" | "is_active">
  >;
};

export function useUpdateHall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateHallInput) => {
      const supabase = createClient();
      const response = await supabase
        .from("halls")
        .update(input.changes)
        .eq("id", input.id)
        .select()
        .single();
      return unwrapMutation<Hall>(response, "update hall");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.halls });
    },
  });
}

export function useDeleteHall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("halls").delete().eq("id", id);
      if (error) throw new Error(`delete hall: ${error.message}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.halls });
    },
  });
}
