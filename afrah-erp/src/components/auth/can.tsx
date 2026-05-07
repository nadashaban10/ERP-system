"use client";

import type { ReactNode } from "react";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { hasPermission, type Permission } from "@/lib/auth/my-profile";

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { data } = useMyProfile();
  return hasPermission(data, permission) ? <>{children}</> : <>{fallback}</>;
}

