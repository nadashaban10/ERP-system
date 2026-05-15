"use client";

import { useQuery } from "@tanstack/react-query";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { unwrapQuery } from "@/lib/queries/helpers";
import { queryKeys } from "@/lib/queries/keys";

/** Venue IDs assigned to an agent (`user_venues.user_id` = agent). */
export function useAgentVenues(agentId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.agentVenues(agentId ?? "__none__"),
    enabled: !!agentId && enabled,
    queryFn: async (): Promise<string[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("user_venues")
        .select("venue_id")
        .eq("user_id", agentId as string);
      const rows = unwrapQuery<{ venue_id: string }[] | null>(
        response as { data: { venue_id: string }[] | null; error: PostgrestError | null },
        [],
        "user_venues for agent"
      );
      return (rows ?? []).map((r) => r.venue_id);
    },
  });
}
