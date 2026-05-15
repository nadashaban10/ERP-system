"use client";

import { useQuery } from "@tanstack/react-query";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { unwrapQuery } from "@/lib/queries/helpers";
import { queryKeys } from "@/lib/queries/keys";

/** One agent ↔ venue row plus joined profile fields for the Users team list. */
export type UserVenueTeamRow = {
  user_id: string;
  venue_id: string;
  profiles: {
    role: string;
    full_name: string | null;
    created_at?: string | null;
  } | null;
};

export function useUserVenuesTeamList() {
  return useQuery({
    queryKey: queryKeys.userVenuesTeamList,
    queryFn: async (): Promise<UserVenueTeamRow[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("user_venues")
        .select("user_id, venue_id, profiles(role, full_name, created_at)")
        .order("user_id", { ascending: true })
        .order("venue_id", { ascending: true });
      return unwrapQuery<UserVenueTeamRow[]>(
        response as {
          data: UserVenueTeamRow[] | null;
          error: PostgrestError | null;
        },
        [],
        "user_venues team list"
      );
    },
  });
}
