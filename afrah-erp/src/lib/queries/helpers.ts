"use client";

import type { PostgrestError } from "@supabase/supabase-js";
import { toast } from "@/components/ui/toaster";

/**
 * Postgres error codes the frontend should treat as "the backend isn't fully
 * provisioned yet" rather than a real failure. We log a console warning and
 * fall back to an empty/null value so the UI keeps rendering.
 *
 *  42P01 — undefined_table          (table doesn't exist)
 *  42883 — undefined_function       (RPC doesn't exist)
 *  42501 — insufficient_privilege   (RLS not yet configured for this user)
 *  PGRST116 — single() returned 0 rows
 */
const SOFT_ERROR_CODES = new Set(["42P01", "42883", "42501", "PGRST116"]);

export type SupabaseLikeError = Pick<PostgrestError, "message" | "code"> | null;

export function isSoftError(error: SupabaseLikeError | null | undefined): boolean {
  if (!error) return false;
  return SOFT_ERROR_CODES.has(error.code ?? "");
}

/**
 * Inspect a Supabase response and decide what to do:
 *  - hard error  -> throw (so React Query marks the query as failed and the
 *                  ErrorBoundary / mutation onError handler runs)
 *  - soft error  -> warn in console, return the fallback value (so the UI
 *                  shows an empty state instead of crashing)
 *  - success    -> return the data
 *
 * Use for SELECT-style queries where graceful degradation is desired.
 */
export function unwrapQuery<T>(
  response: { data: T | null; error: SupabaseLikeError },
  fallback: T,
  context: string
): T {
  if (response.error) {
    if (isSoftError(response.error)) {
      console.warn(
        `[supabase] soft error in "${context}": ${response.error.message} ` +
          `(code=${response.error.code}). Falling back to empty data — ` +
          `wire the missing table/RPC in Supabase to enable this feature.`
      );
      return fallback;
    }
    throw new Error(`${context}: ${response.error.message}`);
  }
  return (response.data ?? fallback) as T;
}

/**
 * For mutations: turn a Supabase response into a thrown error or the data
 * payload. Mutations should never be soft-failed silently — the user just
 * pressed a button, they need real feedback.
 */
export function unwrapMutation<T>(
  response: { data: T | null; error: SupabaseLikeError },
  context: string
): T {
  if (response.error) {
    throw new Error(`${context}: ${response.error.message}`);
  }
  if (response.data === null || response.data === undefined) {
    throw new Error(`${context}: no data returned`);
  }
  return response.data;
}

/**
 * Standard mutation error toast. Pass to `useMutation({ onError })`.
 */
export function showMutationError(error: unknown, fallbackTitle = "Action failed") {
  const message = error instanceof Error ? error.message : String(error);
  toast({
    variant: "destructive",
    title: fallbackTitle,
    description: message,
  });
}
