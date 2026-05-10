import { getTranslations } from "next-intl/server";
import { AlertTriangle, ShieldCheck } from "lucide-react";

type Item = {
  title: string;
  problem: string;
  solution: string;
};

export async function LandingProblem() {
  const t = await getTranslations("landing.problem");
  const items = t.raw("items") as Item[];

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {t("tag")}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-[0_1px_3px_oklch(0_0_0/0.06),_0_8px_24px_oklch(0_0_0/0.04)] transition-all duration-300 hover:shadow-[0_8px_28px_oklch(0_0_0/0.10)]"
            >
              <div
                className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.50 0.22 264 / 0.20), transparent 70%)",
                }}
              />

              <h3 className="text-lg font-bold tracking-tight">{item.title}</h3>

              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.problem}
                  </p>
                </div>

                <div className="flex gap-3 rounded-xl bg-primary/5 p-3.5 ring-1 ring-primary/10">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {item.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
