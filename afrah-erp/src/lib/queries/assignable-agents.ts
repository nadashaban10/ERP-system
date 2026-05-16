"use client";

import { useQuery } from "@tanstack/react-query";
import type { PostgrestError } from "@supabase/supabase-js";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { createClient } from "@/lib/supabase/client";
import { unwrapQuery } from "@/lib/queries/helpers";
import { queryKeys } from "@/lib/queries/keys";

/** Agents that can receive bookings — owners pick from this list (UUID → profile). */
export type AssignableAgent = {
  id: string;
  full_name: string | null;
  email: string;
};

/**
 * Active agents available for assignment.
 * - **Owner**: agents with `parent_user_id = owner.user_id` (same as `useAgents`).
 * - **Super admin**: all active agents (filtered server-side by RLS if needed).
 * - **Agent**: empty list (caller should default assignment to `profile.user_id`).
 */
export function useAssignableAgents() {
  const { data: profile } = useMyProfile();

  const scopeKey = `${profile?.role ?? "none"}:${profile?.user_id ?? "none"}`;

  return useQuery({
    queryKey: queryKeys.assignableAgents(scopeKey),
    enabled: !!profile?.user_id && profile.role !== "agent",
    queryFn: async (): Promise<AssignableAgent[]> => {
      const supabase = createClient();
      let q = supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "agent")
        .eq("status", "active");

      if (profile!.role === "owner") {
        q = q.eq("parent_user_id", profile!.user_id);
      }

      const response = await q.order("full_name", { ascending: true });
      return unwrapQuery<AssignableAgent[]>(
        response as { data: AssignableAgent[] | null; error: PostgrestError | null },
        [],
        "assignable agents"
      );
    },
  });
}

/**
 * Active agents linked to `venue_id` via `user_venues`, scoped to the venue owner when applicable.
 * - **Owner**: `parent_user_id = profile.user_id`.
 * - **Super admin**: optional `venueOwnerUserId` (`venues.owner_user_id`) filters by that owner’s agents; if absent, any active agent on the venue is listed.
 * - **Agent**: query disabled (selector hidden; assignment uses `profile.user_id`).
 */
export function useVenueAssignableAgents(
  venueId: string | null | undefined,
  options?: { enabled?: boolean; venueOwnerUserId?: string | null }
) {
  const { data: profile } = useMyProfile();
  const venueOwnerUserId = options?.venueOwnerUserId ?? null;
  const extraEnabled = options?.enabled ?? true;

  const scopeKey = `${profile?.role ?? "none"}:${profile?.user_id ?? "none"}:${venueId ?? "none"}:${venueOwnerUserId}`;

  return useQuery({
    queryKey: queryKeys.assignableAgentsForVenue(scopeKey),
    enabled:
      extraEnabled &&
      !!venueId &&
      !!profile?.user_id &&
      profile.role !== "agent",
    queryFn: async (): Promise<AssignableAgent[]> => {
      const supabase = createClient();
      const uvResponse = await supabase
        .from("user_venues")
        .select("user_id")
        .eq("venue_id", venueId as string);
      const uvRows = unwrapQuery<{ user_id: string }[]>(
        uvResponse as { data: { user_id: string }[] | null; error: PostgrestError | null },
        [],
        "user_venues for venue agents"
      );
      const userIds = [...new Set(uvRows.map((r) => r.user_id))];
      if (userIds.length === 0) return [];

      let q = supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)
        .eq("role", "agent")
        .eq("status", "active");

      if (profile!.role === "owner") {
        q = q.eq("parent_user_id", profile!.user_id);
      } else if (profile!.role === "super_admin" && venueOwnerUserId) {
        q = q.eq("parent_user_id", venueOwnerUserId);
      }

      const response = await q.order("full_name", { ascending: true });
      return unwrapQuery<AssignableAgent[]>(
        response as { data: AssignableAgent[] | null; error: PostgrestError | null },
        [],
        "venue assignable agents"
      );
    },
  });
}
