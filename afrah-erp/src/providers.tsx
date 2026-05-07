"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { createClient } from "@/lib/supabase/client";

function MyProfileBootstrap() {
  // Fetch once early so layout/sidebar can gate UI consistently.
  // Do not render anything.
  useMyProfile();
  return null;
}

/**
 * Listens to Supabase auth events and resets the React Query cache so that
 * data from a previous user is never shown after sign in/out/token refresh.
 */
function AuthCacheSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // Wipe everything — there is no logged-in user anymore.
        queryClient.clear();
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Drop stale data from any previous session and refetch active queries.
        queryClient.clear();
      }
      if (event === "TOKEN_REFRESHED") {
        // Just refresh user-scoped data; no need to wipe everything.
        queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthCacheSync />
      <MyProfileBootstrap />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
