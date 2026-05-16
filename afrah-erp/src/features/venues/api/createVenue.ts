"use client";

import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/types/database";
import { unwrapMutation } from "@/lib/queries/helpers";
import type { CreateVenueRpcPayload, CreateVenueSuccess } from "@/features/venues/types/venue";
import type { CreateVenueSchemaOut } from "@/features/venues/schemas/createVenueSchema";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function trimOrNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

/** Build `p_venue_data` for the existing `create_venue` RPC; omits null/empty optional strings. */
export function buildVenueRpcPayload(values: CreateVenueRpcPayload): Json {
  const out: Record<string, Json> = {
    name_ar: values.name_ar.trim(),
    name_en: values.name_en.trim(),
    type: values.type,
    address: values.address.trim(),
    city: values.city,
    phone_1: values.phone_1.trim(),
    marketplace_active: values.marketplace_active,
    edit_cutoff_days: values.edit_cutoff_days,
    edit_cutoff_override: values.edit_cutoff_override,
    subscription_plan: values.subscription_plan,
  };

  const district = trimOrNull(values.district ?? undefined);
  if (district) out.district = district;

  const phone2 = trimOrNull(values.phone_2 ?? undefined);
  if (phone2) out.phone_2 = phone2;

  const ig = trimOrNull(values.instagram ?? undefined);
  if (ig) out.instagram = ig;

  const fb = trimOrNull(values.facebook ?? undefined);
  if (fb) out.facebook = fb;

  const da = trimOrNull(values.description_ar ?? undefined);
  if (da) out.description_ar = da;

  const de = trimOrNull(values.description_en ?? undefined);
  if (de) out.description_en = de;

  const logo = trimOrNull(values.logo_url ?? undefined);
  if (logo) out.logo_url = logo;

  const trial = trimOrNull(values.trial_ends_at ?? undefined);
  if (trial) out.trial_ends_at = trial;

  return out as Json;
}

export function formValuesToRpcPayload(values: CreateVenueSchemaOut): CreateVenueRpcPayload {
  const { owner_id: _owner, ...rest } = values;
  return rest;
}

function parseCreateVenueResult(data: unknown): CreateVenueSuccess {
  if (!isRecord(data)) {
    throw new Error("Unexpected response from create_venue");
  }
  if (data.success !== true) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : typeof data.error === "string"
          ? data.error
          : "create_venue failed";
    throw new Error(detail);
  }
  const vid = data.venue_id;
  if (typeof vid !== "string" || !vid) {
    throw new Error("Missing venue_id in response");
  }
  const oid = data.owner_id;
  return {
    success: true,
    venue_id: vid,
    owner_id: oid === null || typeof oid === "string" ? (oid as string | null) : null,
    owner_linked: Boolean(data.owner_linked),
  };
}

/**
 * Calls existing `create_venue` RPC (`p_venue_data`, `p_owner_id` only — matches generated DB types).
 */
export async function rpcCreateVenue(input: {
  p_venue_data: CreateVenueRpcPayload;
  p_owner_id: string | null;
}): Promise<CreateVenueSuccess> {
  const supabase = createClient();
  const response = await supabase.rpc("create_venue", {
    p_venue_data: buildVenueRpcPayload(input.p_venue_data),
    p_owner_id: input.p_owner_id,
  });
  const raw = unwrapMutation(response, "create_venue");
  return parseCreateVenueResult(raw);
}
