import { getTranslations } from "next-intl/server";
import { InquiriesContent } from "./inquiries-content";
import { RouteGuard } from "@/components/auth/route-guard";

export async function generateMetadata() {
  const t = await getTranslations("inquiries");
  return { title: `${t("title")} · Afrah ERP` };
}

export default function InquiriesPage() {
  return (
    <RouteGuard permission="inquiries.view">
      <InquiriesContent />
    </RouteGuard>
  );
}
