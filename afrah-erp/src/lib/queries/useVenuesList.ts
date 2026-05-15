"use client";

import { useQuery } from "@tanstack/react-query";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { unwrapQuery } from "@/lib/queries/helpers";
import { queryKeys } from "@/lib/queries/keys";

export type VenueOption = {
  id: string;
  name_en: string;
  name_ar: string;
};

export type VenuesListScope = "owned" | "all";

/**
 * Venues for checkbox lists.
 * - `owned`: venues where `owner_user_id` matches (owner managing agents).
 * - `all`: full list (super admin) — relies on RLS allowing read.
 */
export function useVenuesList(options: {
  scope: VenuesListScope;
  /** Required when `scope === 'owned'`. */
  ownerUserId?: string | null;
}) {
  const ok =
    options.scope === "all" ||
    (!!options.ownerUserId && options.scope === "owned");

  return useQuery({
    queryKey: queryKeys.venuesList(
      options.scope,
      options.ownerUserId ?? ""
    ),
    enabled: ok,
    queryFn: async (): Promise<VenueOption[]> => {
      const supabase = createClient();
      let q = supabase
        .from("venues")
        .select("id, name_en, name_ar")
        .order("name_en", { ascending: true });

      if (options.scope === "owned" && options.ownerUserId) {
        q = q.eq("owner_user_id", options.ownerUserId);
      }

      const response = await q;
      return unwrapQuery<VenueOption[]>(
        response as { data: VenueOption[] | null; error: PostgrestError | null },
        [],
        "venues list"
      );
    },
  });
}
