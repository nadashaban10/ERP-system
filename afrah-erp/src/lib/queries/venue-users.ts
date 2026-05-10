"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { VenueUser } from "@/lib/types/database";
import { unwrapQuery } from "@/lib/queries/helpers";
import { queryKeys } from "@/lib/queries/keys";

export function useVenueUsersList() {
  return useQuery({
    queryKey: queryKeys.venueUsersList,
    queryFn: async (): Promise<VenueUser[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("venue_users")
        .select("*")
        .order("role", { ascending: true })
        .order("created_at", { ascending: true });
      return unwrapQuery<VenueUser[]>(response, [], "venue users list");
    },
  });
}
