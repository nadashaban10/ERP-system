export type Permission =
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

export interface MyProfile {
  id: string;
  role: string;
  email: string;
  status: string;
  venues: unknown[];
  full_name: string | null;
  permissions: Permission[];
}

export function hasPermission(profile: MyProfile | null | undefined, permission: Permission) {
  return !!profile?.permissions?.includes(permission);
}

