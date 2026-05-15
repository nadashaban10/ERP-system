"use client";

import type { MyProfile } from "@/lib/auth/my-profile";

/** Supabase PostgREST builder chain (`eq` returns same builder type). */
export function applyAgentWorkloadFilter<Q extends { eq: (c: string, v: string) => Q }>(
  query: Q,
  profile: MyProfile | null | undefined
): Q {
  if (profile?.role === "agent" && profile.user_id) {
    return query.eq("assigned_agent_id", profile.user_id);
  }
  return query;
}

/** Include in React Query keys so lists refetch when switching users / roles. */
export function agentWorkloadCacheKey(profile: MyProfile | null | undefined): string {
  return profile?.role === "agent" && profile.user_id ? profile.user_id : "all";
}
