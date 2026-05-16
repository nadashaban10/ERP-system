/**
 * Permission map from `get_my_profile` — only granted actions appear.
 */
export function can(
  permissions: Record<string, Record<string, boolean>> | null | undefined,
  module: string,
  action: string
): boolean {
  const v = permissions?.[module]?.[action] as boolean | number | undefined;
  return v === true || v === 1;
}
