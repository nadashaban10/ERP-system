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
 * - **Owner**: agents with `parent_owner_id = owner.user_id`.
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
        q = q.eq("parent_owner_id", profile!.user_id);
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
