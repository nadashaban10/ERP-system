import { getTranslations } from "next-intl/server";
import { SettingsContent } from "./settings-content";
import { RouteGuard } from "@/components/auth/route-guard";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("title")} · Afrah ERP` };
}

export default function SettingsPage() {
  return (
    <RouteGuard permission={["venues.view", "billing.manage", "users.view"]}>
      <SettingsContent />
    </RouteGuard>
  );
}
