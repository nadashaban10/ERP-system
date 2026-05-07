import { getTranslations } from "next-intl/server";
import { CalendarContent } from "./calendar-content";
import { RouteGuard } from "@/components/auth/route-guard";

export async function generateMetadata() {
  const t = await getTranslations("calendar");
  return { title: `${t("title")} · Afrah ERP` };
}

export default function CalendarPage() {
  return (
    <RouteGuard permission="bookings.view">
      <CalendarContent />
    </RouteGuard>
  );
}
