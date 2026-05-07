import { getTranslations } from "next-intl/server";
import { InquiryDetailContent } from "./inquiry-detail-content";
import { RouteGuard } from "@/components/auth/route-guard";

export async function generateMetadata() {
  const t = await getTranslations("inquiries");
  return { title: `${t("title")} Detail · Afrah ERP` };
}

export default function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  return (
    <RouteGuard permission="inquiries.view">
      <InquiryDetailContent params={params} />
    </RouteGuard>
  );
}
