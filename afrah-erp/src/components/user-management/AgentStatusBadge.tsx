"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AgentStatusProp = string;

export function AgentStatusBadge({
  status,
  className,
}: {
  status: AgentStatusProp;
  className?: string;
}) {
  const s = String(status).toLowerCase();

  const variant =
    s === "active"
      ? ("success" as const)
      : s === "inactive"
        ? ("muted" as const)
        : s === "suspended"
          ? ("destructive" as const)
          : ("secondary" as const);

  const label =
    s === "active"
      ? "Active"
      : s === "inactive"
        ? "Inactive"
        : s === "suspended"
          ? "Suspended"
          : status;

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {label}
    </Badge>
  );
}
