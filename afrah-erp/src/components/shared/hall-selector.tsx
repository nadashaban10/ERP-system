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
import { MOCK_HALLS } from "@/lib/mock-data";
import { Building2 } from "lucide-react";

export function HallSelector() {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentHall = searchParams.get("hall") ?? "all";

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
    <Select value={currentHall} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px] gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <SelectValue placeholder={t("hallSelector")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("all")} القاعات</SelectItem>
        {MOCK_HALLS.map((hall) => (
          <SelectItem key={hall.id} value={hall.id}>
            {hall.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
