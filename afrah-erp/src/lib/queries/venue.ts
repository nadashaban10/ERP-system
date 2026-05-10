"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Venue } from "@/lib/types/database";
import { queryKeys } from "@/lib/queries/keys";
import { unwrapMutation, unwrapQuery } from "@/lib/queries/helpers";

/**
 * Load the current user's venue.
 *
 * RLS in Supabase scopes `venues` to the user's tenant — `.single()` returns
 * exactly the venue this user belongs to. Soft-fails to `null` if the table
 * isn't provisioned yet.
 */
export function useVenue() {
  return useQuery({
    queryKey: queryKeys.venue,
    queryFn: async (): Promise<Venue | null> => {
      const supabase = createClient();
      const response = await supabase.from("venues").select("*").maybeSingle();
      return unwrapQuery<Venue | null>(response, null, "load venue");
    },
  });
}

/**
 * Editable subset of the venue profile. We accept Partial<Venue> so callers
 * can patch only the fields that changed.
 */
export type VenueProfileUpdate = Partial<
  Pick<
    Venue,
    | "name_ar"
    | "name_en"
    | "type"
    | "address"
    | "city"
    | "district"
    | "phone_1"
    | "phone_2"
    | "instagram"
    | "facebook"
    | "description_ar"
    | "description_en"
    | "edit_cutoff_days"
    | "edit_cutoff_override"
  >
>;

export function useUpdateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; changes: VenueProfileUpdate }) => {
      const supabase = createClient();
      const response = await supabase
        .from("venues")
        .update(input.changes)
        .eq("id", input.id)
        .select()
        .single();
      return unwrapMutation<Venue>(response, "update venue");
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.venue, data);
    },
  });
}
