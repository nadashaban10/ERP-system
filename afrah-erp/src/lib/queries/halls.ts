"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { EventRecordType, Hall } from "@/lib/types/database";
import { queryKeys } from "@/lib/queries/keys";
import { showMutationError, unwrapMutation, unwrapQuery } from "@/lib/queries/helpers";

/** A hall row joined with its event types — what we render in settings. */
export type HallWithEventTypes = Hall & {
  event_record_types: EventRecordType[];
};

/**
 * Halls for a specific venue. Pass the active `selectedVenueId` from context.
 */
export function useHalls(venueId: string | null | undefined) {
  return useQuery({
    queryKey: [...queryKeys.hallsForVenue(venueId ?? "__none__"), "withEventTypes"] as const,
    enabled: !!venueId,
    queryFn: async (): Promise<HallWithEventTypes[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("halls")
        .select("*, event_record_types(*)")
        .eq("venue_id", venueId as string)
        .order("name");
      return unwrapQuery<HallWithEventTypes[]>(
        response as unknown as {
          data: HallWithEventTypes[] | null;
          error: typeof response.error;
        },
        [],
        "load halls"
      );
    },
  });
}

/**
 * Active halls with id+name for selectors — filtered by **selected venue**.
 */
export function useActiveHalls(venueId: string | null | undefined) {
  return useQuery({
    queryKey: [...queryKeys.hallsForVenue(venueId ?? "__none__"), "active"] as const,
    enabled: !!venueId,
    queryFn: async (): Promise<Pick<Hall, "id" | "name" | "is_active">[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("halls")
        .select("id, name, is_active")
        .eq("venue_id", venueId as string)
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
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hallsForVenue(v.venue_id) });
    },
  });
}

export type UpdateHallInput = {
  id: string;
  venueId: string;
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
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hallsForVenue(v.venueId) });
    },
  });
}

export function useDeleteHall() {
  const queryClient = useQueryClient();
  return useMutation({
    /** Same as REST: `DELETE /halls?id=eq.{id}` (RLS applies). */
    mutationFn: async (args: { id: string; venueId: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("halls").delete().eq("id", args.id);
      if (error) throw new Error(`delete hall: ${error.message}`);
      return args;
    },
    onSuccess: ({ id: deletedId, venueId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hallsForVenue(venueId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes(deletedId) });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientsRoot });
    },
    onError: (e) => showMutationError(e),
  });
}
