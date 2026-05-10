import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isRTL } from "@/lib/utils";

export async function LandingCta() {
  const t = await getTranslations("landing.finalCta");
  const locale = await getLocale();
  const Arrow = isRTL(locale) ? ArrowLeft : ArrowRight;

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-16 sm:px-16 sm:py-20 lg:py-24"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.22 0.06 264) 0%, oklch(0.30 0.10 280) 50%, oklch(0.24 0.08 245) 100%)",
          }}
        >
          {/* Animated blobs */}
          <div
            className="absolute -top-40 -end-40 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.65 0.20 330 / 0.6), transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-40 -start-40 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.68 0.18 220 / 0.6), transparent 70%)",
            }}
          />

          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t("title")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/70 sm:text-lg">
              {t("subtitle")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="w-full bg-white text-foreground hover:bg-white/90 sm:w-auto">
                <Link href={`/${locale}/login`}>
                  {t("primary")}
                  <Arrow className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white sm:w-auto"
              >
                <Link href={`/${locale}/login`}>{t("secondary")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
