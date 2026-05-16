/** Role being created via Edge Function — not the signed-in user's role. */
export type CreatedUserRole = "owner" | "agent";

export type CreateUserEdgeBody = {
  email: string;
  password: string;
  full_name: string;
  role: CreatedUserRole;
  /** Omit when Super Admin creates an owner account. Required for every agent payload. */
  owner_id?: string;
  venue_ids: string[];
};

export type CreateUserEdgeSuccess = {
  success: true;
  user_id: string;
  email: string;
  role: CreatedUserRole;
  message: string;
};

export type CreateUserFormCaller = "super_admin" | "owner";

export type CreateUserFormValues = {
  full_name: string;
  email: string;
  password: string;
  role: CreatedUserRole;
  /** Effective only when Super Admin chooses Agent */
  owner_id: string;
  venue_ids: string[];
};
