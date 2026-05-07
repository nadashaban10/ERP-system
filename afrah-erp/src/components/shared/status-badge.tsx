import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const colors = getStatusColor(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {label}
    </span>
  );
}
