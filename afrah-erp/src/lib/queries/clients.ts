"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/lib/types/database";
import { queryKeys } from "@/lib/queries/keys";
import { showMutationError, unwrapMutation, unwrapQuery } from "@/lib/queries/helpers";

export interface ClientBookingSummary {
  count: number;
  lastEventDate: string | null;
}

export function aggregateClientBookingSummaries(
  rows: { client_id: string; event_date: string }[]
): Record<string, ClientBookingSummary> {
  const map: Record<string, ClientBookingSummary> = {};
  for (const row of rows) {
    const cur = map[row.client_id] ?? { count: 0, lastEventDate: null };
    cur.count += 1;
    if (!cur.lastEventDate || row.event_date > cur.lastEventDate) {
      cur.lastEventDate = row.event_date;
    }
    map[row.client_id] = cur;
  }
  return map;
}

/** All clients for the current venue (RLS-scoped). */
export function useClientsForVenue(venueId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.clientsForVenue(venueId ?? "__none__"),
    enabled: !!venueId,
    queryFn: async (): Promise<Client[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("clients")
        .select("*")
        .eq("venue_id", venueId as string)
        .order("name", { ascending: true });
      return unwrapQuery(response, [], "clients list");
    },
  });
}

/** Non-cancelled bookings aggregate for client cards (count + last event date). */
export function useClientBookingSummaries(venueId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.clientBookingSummaries(venueId ?? "__none__"),
    enabled: !!venueId,
    queryFn: async (): Promise<Record<string, ClientBookingSummary>> => {
      const supabase = createClient();
      const response = await supabase
        .from("bookings")
        .select("client_id, event_date")
        .eq("venue_id", venueId as string)
        .neq("status", "cancelled");
      const rows = unwrapQuery(response, [], "client booking summaries");
      return aggregateClientBookingSummaries(rows);
    },
  });
}

/** Fields required by `clients` insert — `venue_id` is set server-side caller. */
export type NewClientInput = Omit<Client, "id" | "created_at">;

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewClientInput) => {
      const supabase = createClient();
      const payload = {
        venue_id: input.venue_id,
        name: input.name.trim(),
        phone_1: input.phone_1.trim(),
        phone_2: input.phone_2?.trim() ? input.phone_2.trim() : null,
        email: input.email?.trim() ? input.email.trim() : null,
        notes: input.notes?.trim() ? input.notes.trim() : null,
      };
      const response = await supabase.from("clients").insert(payload).select().single();
      return unwrapMutation<Client>(response, "create client");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientsRoot });
    },
    onError: (err) =>
      showMutationError(err),
  });
}
