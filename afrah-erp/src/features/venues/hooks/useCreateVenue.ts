"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/components/ui/toaster";
import { rpcCreateVenue } from "@/features/venues/api/createVenue";
import type { CreateVenueRpcPayload } from "@/features/venues/types/venue";
import { queryKeys } from "@/lib/queries/keys";

export function useCreateVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { venue: CreateVenueRpcPayload; ownerId: string | null }) =>
      rpcCreateVenue({
        p_venue_data: input.venue,
        p_owner_id: input.ownerId,
      }),
    onSuccess: (res) => {
      toast({
        variant: "success",
        title: "Venue created",
        description: res.owner_linked ? "Owner linked to the new venue." : undefined,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
      queryClient.invalidateQueries({ queryKey: ["venue"] });
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === "allVenues" ||
            (q.queryKey[0] === "venues" && q.queryKey[1] === "list")),
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        variant: "destructive",
        title: "Could not create venue",
        description: message,
      });
    },
  });
}
