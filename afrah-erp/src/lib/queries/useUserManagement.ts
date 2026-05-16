"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostgrestError } from "@supabase/supabase-js";
import { toast } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/client";
import { unwrapMutation, unwrapQuery } from "@/lib/queries/helpers";
import { queryKeys } from "@/lib/queries/keys";
import type { Profile } from "@/lib/types/database";

export type OwnerOption = Pick<Profile, "id" | "full_name" | "email" | "status">;

export type AgentProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
  user_venues: {
    venue_id: string;
    venues: { id: string; name_en: string } | null;
  }[];
};

/**
 * List agents. By default, agents where `parent_user_id = ownerId`.
 * Pass `listAllAgents: true` for super-admin (all profiles with role agent).
 */
export function useAgents(
  ownerId: string | null,
  options?: { listAllAgents?: boolean }
) {
  const listAll = options?.listAllAgents === true;
  return useQuery({
    queryKey: listAll ? (["agents", "all"] as const) : queryKeys.agents(ownerId ?? ""),
    queryFn: async (): Promise<AgentProfileRow[]> => {
      const supabase = createClient();
      let q = supabase
        .from("profiles")
        .select(
          `
          id, email, full_name, role, status, created_at,
          user_venues(venue_id, venues(id, name_en))
        `
        )
        .eq("role", "agent")
        .order("created_at", { ascending: false });
      if (!listAll) {
        q = q.eq("parent_user_id", ownerId as string);
      }
      const response = await q;
      return unwrapQuery<AgentProfileRow[]>(
        response as {
          data: AgentProfileRow[] | null;
          error: PostgrestError | null;
        },
        [],
        "agents list"
      );
    },
    enabled: listAll ? true : !!ownerId,
  });
}

/** Active owners — super-admin workflows (e.g. assign owner). */
export function useOwnersList(enabled = true) {
  return useQuery({
    queryKey: queryKeys.ownersList,
    enabled,
    queryFn: async (): Promise<OwnerOption[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("profiles")
        .select("id, full_name, email, status")
        .eq("role", "owner")
        .eq("status", "active")
        .order("full_name", { ascending: true });
      return unwrapQuery<OwnerOption[]>(
        response as { data: OwnerOption[] | null; error: PostgrestError | null },
        [],
        "owners list"
      );
    },
  });
}

export function useUpdateAgentVenues() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      agentId,
      venueIds,
    }: {
      agentId: string;
      venueIds: string[];
    }) => {
      const supabase = createClient();
      const response = await supabase.rpc("update_agent_venues", {
        p_agent_id: agentId,
        p_venue_ids: venueIds,
      });
      return unwrapMutation(response, "update_agent_venues");
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.agentVenues(vars.agentId) });
      toast({ variant: "success", title: "Venue access updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update venues",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason?: string;
    }) => {
      const supabase = createClient();
      const response = await supabase.rpc("deactivate_user", {
        p_user_id: userId,
        p_reason: reason ?? null,
      });
      return unwrapMutation(response, "deactivate_user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({ variant: "success", title: "User deactivated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to deactivate user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ status: "active" })
        .eq("id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({ variant: "success", title: "User reactivated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reactivate user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
