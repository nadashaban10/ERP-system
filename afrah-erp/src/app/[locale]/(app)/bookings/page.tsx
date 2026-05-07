import { getTranslations } from "next-intl/server";
import { BookingsContent } from "./bookings-content";
import { RouteGuard } from "@/components/auth/route-guard";

export async function generateMetadata() {
  const t = await getTranslations("bookings");
  return { title: `${t("title")} · Afrah ERP` };
}

export default function BookingsPage() {
  return (
    <RouteGuard permission="bookings.view">
      <BookingsContent />
    </RouteGuard>
  );
}
