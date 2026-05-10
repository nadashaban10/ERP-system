import { getTranslations, getLocale } from "next-intl/server";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { isRTL } from "@/lib/utils";

type Step = { n: string; title: string; desc: string };

export async function LandingHow() {
  const t = await getTranslations("landing.how");
  const locale = await getLocale();
  const rtl = isRTL(locale);
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  const steps = t.raw("steps") as Step[];

  return (
    <section id="how" className="relative scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            {t("tag")}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="relative mt-16">
          {/* Connector line (desktop only) */}
          <div
            className="absolute inset-x-12 top-7 hidden h-px lg:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.50 0.22 264 / 0.3) 20%, oklch(0.50 0.22 264 / 0.3) 80%, transparent)",
            }}
          />

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="flex flex-col items-center text-center">
                  {/* Number badge */}
                  <div className="relative">
                    <div
                      className="absolute -inset-3 rounded-full opacity-30 blur-xl"
                      style={{
                        background:
                          "radial-gradient(circle, oklch(0.50 0.22 264 / 0.5), transparent 70%)",
                      }}
                    />
                    <div
                      className="relative flex h-14 w-14 items-center justify-center rounded-full text-base font-bold text-white shadow-[0_8px_24px_oklch(0.50_0.22_264/0.35)] ring-4 ring-background"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.50 0.22 264) 0%, oklch(0.40 0.20 280) 100%)",
                      }}
                    >
                      {step.n}
                    </div>
                  </div>

                  {/* Card */}
                  <div className="mt-6 w-full rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Mobile arrow between steps */}
                {i < steps.length - 1 && (
                  <div className="my-2 flex justify-center lg:hidden">
                    <Arrow className="h-5 w-5 rotate-90 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
