import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export interface CreateUserBody {
  email: string;
  password: string;
  full_name: string;
  role: "agent" | "owner";
  owner_id?: string;
  venue_ids?: string[];
}

export interface CreateUserResponse {
  success: true;
  user_id: string;
  email: string;
  role: string;
  message: string;
}

export async function invokeCreateUser(
  supabase: SupabaseClient<Database>,
  body: CreateUserBody
): Promise<CreateUserResponse> {
  const { data, error } = await supabase.functions.invoke("create-user", { body });
  if (error) throw new Error(error.message);
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const err = (data as Record<string, unknown>).error;
    if (typeof err === "string" && err.length > 0) {
      throw new Error(err);
    }
  }
  return data as CreateUserResponse;
}
