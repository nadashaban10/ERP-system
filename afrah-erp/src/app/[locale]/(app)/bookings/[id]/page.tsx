import { getTranslations } from "next-intl/server";
import { BookingDetailContent } from "./booking-detail-content";

export async function generateMetadata() {
  const t = await getTranslations("bookings");
  return { title: `${t("title")} Detail · Afrah ERP` };
}

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  return <BookingDetailContent params={params} />;
}
