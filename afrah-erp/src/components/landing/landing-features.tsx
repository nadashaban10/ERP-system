import { getTranslations } from "next-intl/server";
import {
  CalendarRange,
  CalendarDays,
  Inbox,
  Wallet,
  BellRing,
  Layers,
  Languages,
  ShieldCheck,
} from "lucide-react";

type Item = { title: string; desc: string };

const ICONS = [
  CalendarRange,
  CalendarDays,
  Inbox,
  Wallet,
  BellRing,
  Layers,
  Languages,
  ShieldCheck,
];

export async function LandingFeatures() {
  const t = await getTranslations("landing.features");
  const items = t.raw("items") as Item[];

  return (
    <section id="features" className="relative bg-muted/30 scroll-mt-20">
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

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_32px_oklch(0.50_0.22_264/0.12)]"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10 transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="text-base font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
