"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";
import { useVenueSelection } from "@/lib/auth/venue-selection-context";
import { useActiveHalls } from "@/lib/queries/halls";

export function HallSelector() {
  const t = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentHall = searchParams.get("hall") ?? "all";

  const { selectedVenueId } = useVenueSelection();
  const { data: halls = [], isPending } = useActiveHalls(selectedVenueId);

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("hall");
    } else {
      params.set("hall", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select
      value={currentHall}
      onValueChange={handleChange}
      disabled={isPending || !selectedVenueId}
    >
      <SelectTrigger className="w-[180px] gap-2">
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        {isPending ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : null}
        <SelectValue placeholder={t("hallSelector")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          {t("all")} · {tDashboard("allHalls")}
        </SelectItem>
        {halls.map((hall) => (
          <SelectItem key={hall.id} value={hall.id}>
            {hall.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
