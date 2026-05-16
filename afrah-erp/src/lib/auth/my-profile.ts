import { can } from "@/lib/utils/permissions";

/** Venue summary embedded in `get_my_profile` — no separate venues query on login. */
export interface ProfileVenue {
  id: string;
  name_en: string;
  name_ar: string;
  city: string;
  type: string;
}

export type ProfileRole = "super_admin" | "owner" | "agent";

export type ProfileStatusValue = "active" | "inactive" | "suspended";

/** Permissions: module → action → granted. Missing keys = denied. */
export type PermissionMap = Record<string, Record<string, boolean>>;

/**
 * Exact shape returned by `get_my_profile` RPC.
 * Use `user_id` (not `id`) as the stable auth user UUID everywhere (Realtime, filters).
 */
export interface MyProfile {
  user_id: string;
  email: string;
  full_name: string;
  role: ProfileRole | string;
  status: ProfileStatusValue | string;
  parent_owner_id: string | null;
  venues: ProfileVenue[];
  permissions: PermissionMap;
}

/**
 * Dot-path permission string used by nav/guards, mapped to `can(permissions, module, action)`.
 * Examples: `bookings.view`, `billing.manage`, `venues.view`.
 */
export type PermissionDotPath =
  | "billing.manage"
  | "bookings.create"
  | "bookings.delete"
  | "bookings.edit"
  | "bookings.view"
  | "inquiries.create"
  | "inquiries.view"
  | "payments.create"
  | "payments.edit"
  | "payments.view"
  | "reports.view"
  | "users.create"
  | "users.delete"
  | "users.edit"
  | "users.view"
  | "venues.create"
  | "venues.edit"
  | "venues.view"
  | (string & {});

function parseDotPermission(dot: string): { module: string; action: string } | null {
  const i = dot.indexOf(".");
  if (i <= 0 || i === dot.length - 1) return null;
  return { module: dot.slice(0, i), action: dot.slice(i + 1) };
}

/**
 * `get_my_profile` may use `venue_settings` or `venues` (and similarly for users).
 * Prefer the module name the API actually returns (`venues` first) so nav matches live payloads.
 */
const PERMISSION_MODULE_ALIASES: Record<string, readonly string[]> = {
  users: ["users", "user_management"],
  venues: ["venues", "venue_settings"],
};

function moduleKeysForUiDotModule(uiModule: string): readonly string[] {
  return PERMISSION_MODULE_ALIASES[uiModule] ?? [uiModule];
}

export function hasPermission(
  profile: MyProfile | null | undefined,
  permission: PermissionDotPath
): boolean {
  const parsed = parseDotPermission(permission);
  if (!parsed) return false;
  const perms = profile?.permissions;
  if (!perms || typeof perms !== "object") return false;
  for (const mod of moduleKeysForUiDotModule(parsed.module)) {
    if (can(perms, mod, parsed.action)) return true;
  }
  return false;
}
