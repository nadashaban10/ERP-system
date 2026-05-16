"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/components/ui/toaster";
import { invokeCreateDashboardUser } from "@/features/users/api/createUser";
import type { CreateUserEdgeBody } from "@/features/users/types/user";
import { queryKeys } from "@/lib/queries/keys";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateUserEdgeBody) => invokeCreateDashboardUser(body),
    onSuccess: (res) => {
      toast({
        variant: "success",
        title: "User created",
        description: res.message,
      });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ownersList });
      queryClient.invalidateQueries({ queryKey: queryKeys.userVenuesTeamList });
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "venues",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Could not create user",
        description: error.message?.trim() || "Something went wrong",
      });
    },
  });
}
