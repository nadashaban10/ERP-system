import { getTranslations } from "next-intl/server";
import { DashboardContent } from "./dashboard-content";
import { RouteGuard } from "@/components/auth/route-guard";

export async function generateMetadata() {
  const t = await getTranslations("dashboard");
  return { title: `${t("title")} · Afrah ERP` };
}

export default function DashboardPage() {
  return (
    <RouteGuard permission="reports.view">
      <DashboardContent />
    </RouteGuard>
  );
}
