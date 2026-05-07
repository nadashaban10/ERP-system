import { getTranslations } from "next-intl/server";
import { ClientsContent } from "./clients-content";
import { RouteGuard } from "@/components/auth/route-guard";

export async function generateMetadata() {
  const t = await getTranslations("clients");
  return { title: `${t("title")} · Afrah ERP` };
}

export default function ClientsPage() {
  return (
    <RouteGuard permission="bookings.view">
      <ClientsContent />
    </RouteGuard>
  );
}
