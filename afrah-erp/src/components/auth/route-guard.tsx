"use client";

import type { ReactNode } from "react";
import { useMyProfile } from "@/lib/auth/use-my-profile";
import { hasPermission, type Permission } from "@/lib/auth/my-profile";
import { AccessDenied } from "@/components/auth/access-denied";

export function RouteGuard({
  permission,
  children,
}: {
  permission: Permission | Permission[];
  children: ReactNode;
}) {
  const { data: profile, isLoading } = useMyProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const required = Array.isArray(permission) ? permission : [permission];
  const allowed = required.some((p) => hasPermission(profile, p));

  if (!allowed) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
