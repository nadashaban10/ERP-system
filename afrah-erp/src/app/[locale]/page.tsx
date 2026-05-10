import { redirect } from "next/navigation";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingTrust } from "@/components/landing/landing-trust";
import { LandingProblem } from "@/components/landing/landing-problem";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingHow } from "@/components/landing/landing-how";
import { LandingShowcase } from "@/components/landing/landing-showcase";
import { LandingBilingual } from "@/components/landing/landing-bilingual";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { createClient } from "@/lib/supabase/server";

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // If the visitor is already signed in, send them straight to the app.
  // We swallow any auth check failure (e.g. missing Supabase env vars in dev)
  // so the landing page still renders for unauthenticated visitors.
  // Important: redirect() throws NEXT_REDIRECT internally, so it must run
  // OUTSIDE the try/catch — otherwise the catch would swallow the redirect.
  let signedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = !!data.user;
  } catch {
    signedIn = false;
  }
  if (signedIn) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingTrust />
        <LandingProblem />
        <LandingFeatures />
        <LandingHow />
        <LandingShowcase />
        <LandingBilingual />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
