"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types/database";
import { queryKeys } from "@/lib/queries/keys";
import { showMutationError, unwrapQuery } from "@/lib/queries/helpers";

const NOTIFICATIONS_PAGE = 50;

/**
 * Keeps the notifications list fresh when rows change on the server (trigger inserts,
 * another tab marking read, etc.). Requires Realtime enabled on `public.notifications`
 * (SUPABASE_SETUP §10).
 */
export function useSubscribeToNotifications(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const filter = `user_id=eq.${userId}`;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) });
    };

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter,
        },
        invalidate
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter,
        },
        invalidate
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

export function useNotifications(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.notifications(userId ?? "__none__"),
    enabled: !!userId,
    queryFn: async (): Promise<Notification[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId as string)
        .order("created_at", { ascending: false })
        .limit(NOTIFICATIONS_PAGE);
      const rows = unwrapQuery<Notification[] | null>(
        response as { data: Notification[] | null; error: PostgrestError | null },
        null,
        "notifications list"
      );
      return rows ?? [];
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; notificationId: string }) => {
      const supabase = createClient();
      const response = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", input.notificationId)
        .eq("user_id", input.userId);
      if (response.error) {
        throw new Error(response.error.message);
      }
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(v.userId) });
    },
    onError: (e) => showMutationError(e),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const supabase = createClient();
      const response = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (response.error) {
        throw new Error(response.error.message);
      }
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) });
    },
    onError: (e) => showMutationError(e),
  });
}
