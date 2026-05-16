"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  CreateUserEdgeBody,
  CreatedUserRole,
  CreateUserEdgeSuccess,
} from "@/features/users/types/user";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Parse application-level error message from Functions JSON body when present. */
function messageFromPayload(data: unknown): string | null {
  const msg = stringifyEdgeMessage(data);
  return msg?.trim() || null;
}

function stringifyEdgeMessage(data: unknown): string | null {
  if (!isRecord(data)) return null;
  const er = data.error;
  const m = data.message;
  if (typeof er === "string") return er;
  if (typeof m === "string") return m;
  if (isRecord(er) && typeof er.message === "string") return er.message;
  return null;
}

async function tryReadResponseJson(ctx: Response | undefined | null): Promise<unknown | null> {
  if (!ctx || typeof ctx.json !== "function") return null;
  try {
    return await ctx.json();
  } catch {
    return null;
  }
}

/**
 * Create a dashboard user via the `create-user` Edge Function (JWT-checked server-side).
 * Never calls signup or inserts into Postgres from the browser.
 */
export async function invokeCreateDashboardUser(
  payload: CreateUserEdgeBody
): Promise<CreateUserEdgeSuccess> {
  const supabase = createClient();
  const body: Record<string, unknown> = {
    email: payload.email.trim(),
    password: payload.password,
    full_name: payload.full_name.trim(),
    role: payload.role,
    venue_ids: payload.venue_ids ?? [],
  };
  const owner = payload.owner_id?.trim();
  if (payload.role === "agent") {
    if (!owner) {
      throw new Error("Missing owner assignment for agent");
    }
    body.owner_id = owner;
  }

  const { data, error } = await supabase.functions.invoke<unknown>("create-user", { body });

  if (error) {
    let text = messageFromPayload(data);
    try {
      const fnErr = error as { context?: Response };
      const j = await tryReadResponseJson(fnErr.context);
      text = stringifyEdgeMessage(j) ?? text;
    } catch {
      /* ignore parse noise */
    }
    throw new Error(text?.trim() || error.message?.trim() || "Request failed");
  }

  if (!isRecord(data)) {
    throw new Error("Unexpected empty response");
  }

  if (data.success !== true) {
    throw new Error(messageFromPayload(data) || "Could not create user");
  }

  const userId = data.user_id;
  const email = data.email;
  const role = data.role;
  const message = data.message;
  if (typeof userId !== "string" || typeof email !== "string") {
    throw new Error(messageFromPayload(data) || "Unexpected server response shape");
  }
  if (role !== "owner" && role !== "agent") {
    throw new Error(messageFromPayload(data) || "Unexpected role in response");
  }
  const msg =
    typeof message === "string" ? message.trim() || "User created" : "User created";

  return {
    success: true,
    user_id: userId,
    email,
    role: role as CreatedUserRole,
    message: msg,
  };
}
