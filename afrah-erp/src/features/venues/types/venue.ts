import type { CityEnum, VenueType } from "@/lib/types/database";

/** UI / RPC subscription values (matches static options in Create Venue form). */
export type CreateVenueSubscriptionPlanUi = "trial" | "starter" | "professional";

/** JSON payload for `p_venue_data` in `create_venue` RPC (existing backend contract). */
export type CreateVenueRpcPayload = {
  name_ar: string;
  name_en: string;
  type: VenueType;
  address: string;
  city: CityEnum;
  district?: string;
  phone_1: string;
  phone_2?: string;
  instagram?: string;
  facebook?: string;
  description_ar?: string;
  description_en?: string;
  logo_url?: string;
  marketplace_active: boolean;
  edit_cutoff_days: number;
  edit_cutoff_override: boolean;
  subscription_plan: CreateVenueSubscriptionPlanUi;
  trial_ends_at?: string;
};

/** Parsed success body from `create_venue` JSON return (best-effort). */
export type CreateVenueSuccess = {
  success: true;
  venue_id: string;
  owner_id: string | null;
  owner_linked: boolean;
};
