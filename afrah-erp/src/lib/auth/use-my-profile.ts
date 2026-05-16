"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { MyProfile } from "@/lib/auth/my-profile";

export function useMyProfile() {
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: async (): Promise<MyProfile> => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_my_profile");
      if (error) throw new Error(error.message);
      const raw = data as unknown as MyProfile;
      return {
        ...raw,
        permissions:
          raw.permissions && typeof raw.permissions === "object" ? raw.permissions : {},
      };
    },
  });
}

