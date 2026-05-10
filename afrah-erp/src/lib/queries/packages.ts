"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Package } from "@/lib/types/database";
import { queryKeys } from "@/lib/queries/keys";
import { unwrapMutation, unwrapQuery } from "@/lib/queries/helpers";

export function usePackages() {
  return useQuery({
    queryKey: queryKeys.packages,
    queryFn: async (): Promise<Package[]> => {
      const supabase = createClient();
      const response = await supabase
        .from("packages")
        .select("*")
        .order("base_price");
      return unwrapQuery<Package[]>(response, [], "load packages");
    },
  });
}

export type CreatePackageInput = {
  venue_id: string;
  name: string;
  price_type: Package["price_type"];
  base_price: number;
  min_guests: number | null;
  inclusions: string | null;
};

export function useCreatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePackageInput) => {
      const supabase = createClient();
      const response = await supabase
        .from("packages")
        .insert({
          venue_id: input.venue_id,
          name: input.name,
          price_type: input.price_type,
          base_price: input.base_price,
          min_guests: input.min_guests,
          inclusions: input.inclusions,
          is_active: true,
        })
        .select()
        .single();
      return unwrapMutation<Package>(response, "create package");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packages });
    },
  });
}

export type UpdatePackageInput = {
  id: string;
  changes: Partial<
    Pick<
      Package,
      | "name"
      | "price_type"
      | "base_price"
      | "min_guests"
      | "inclusions"
      | "is_active"
    >
  >;
};

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdatePackageInput) => {
      const supabase = createClient();
      const response = await supabase
        .from("packages")
        .update(input.changes)
        .eq("id", input.id)
        .select()
        .single();
      return unwrapMutation<Package>(response, "update package");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packages });
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("packages").delete().eq("id", id);
      if (error) throw new Error(`delete package: ${error.message}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packages });
    },
  });
}
