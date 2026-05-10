import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tier = {
  name: string;
  price: string;
  desc: string;
  features: string[];
};

export async function LandingPricing() {
  const t = await getTranslations("landing.pricing");
  const locale = await getLocale();
  const tiers = t.raw("tiers") as Tier[];

  return (
    <section id="pricing" className="relative bg-muted/30 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            {t("tag")}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {tiers.map((tier, i) => {
            const popular = i === 1;
            const isCustom = i === 2;

            return (
              <div
                key={tier.name}
                className={cn(
                  "relative flex flex-col rounded-3xl border p-7 transition-all duration-300",
                  popular
                    ? "border-primary/40 bg-card shadow-[0_24px_60px_oklch(0.50_0.22_264/0.18)] lg:scale-[1.04]"
                    : "border-border/60 bg-card shadow-sm hover:border-border hover:shadow-md"
                )}
              >
                {popular && (
                  <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-[0_4px_12px_oklch(0.50_0.22_264/0.4)]">
                      <Sparkles className="h-3 w-3" />
                      {t("popular")}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    {tier.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {tier.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-baseline gap-1.5">
                  {!isCustom && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {locale === "ar" ? "ج.م" : "EGP"}
                    </span>
                  )}
                  <span className="text-4xl font-bold tracking-tight">
                    {tier.price}
                  </span>
                  {!isCustom && (
                    <span className="text-sm text-muted-foreground">
                      {t("monthly")}
                    </span>
                  )}
                </div>

                <ul className="mt-6 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          popular
                            ? "bg-primary text-primary-foreground"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/85">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-2">
                  <Button
                    asChild
                    size="lg"
                    variant={popular ? "default" : "outline"}
                    className="w-full"
                  >
                    <Link href={`/${locale}/login`}>
                      {isCustom ? t("ctaContact") : t("cta")}
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
