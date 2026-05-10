import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    // Most common cause in production: missing Supabase env vars on the host.
    // Don't crash the Server Component tree — log and force re-auth instead.
    console.error("[AppLayout] Supabase auth check failed:", err);
    redirect(`/${locale}/login`);
  }

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return <AppShell>{children}</AppShell>;
}
