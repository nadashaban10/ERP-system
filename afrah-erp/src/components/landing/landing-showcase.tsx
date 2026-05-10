import { getTranslations, getLocale } from "next-intl/server";
import { Check, CalendarRange } from "lucide-react";

export async function LandingShowcase() {
  const t = await getTranslations("landing.showcase");
  const locale = await getLocale();
  const isAr = locale === "ar";

  // Days of the current month (mocked) — the actual day labels just need to look real
  const dayLabels = isAr
    ? ["أ", "ن", "ث", "ر", "خ", "ج", "س"]
    : ["S", "M", "T", "W", "T", "F", "S"];

  // Pre-set events on certain days for visual richness
  const events: Record<number, "confirmed" | "hold" | "inquiry"> = {
    3: "confirmed",
    7: "confirmed",
    9: "hold",
    12: "inquiry",
    14: "confirmed",
    18: "confirmed",
    21: "hold",
    24: "confirmed",
    27: "inquiry",
  };

  const eventColor = {
    confirmed: "bg-primary",
    hold: "bg-amber-400",
    inquiry: "bg-sky-400",
  } as const;

  const wizardSteps = [
    { n: 1, label: t("step1"), done: true },
    { n: 2, label: t("step2"), done: true },
    { n: 3, label: t("step3"), active: true },
    { n: 4, label: t("step4"), done: false },
  ];

  return (
    <section className="relative overflow-hidden bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {t("tag")}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Calendar mockup — wider */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_12px_36px_oklch(0_0_0/0.08)]">
              <div className="flex items-center justify-between border-b border-border/60 bg-card px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarRange className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-sm font-semibold">{t("calendarTitle")}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: isAr ? "شهر" : "Month", active: true },
                    { label: isAr ? "أسبوع" : "Week" },
                    { label: isAr ? "يوم" : "Day" },
                  ].map((tab) => (
                    <span
                      key={tab.label}
                      className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                        tab.active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      {tab.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <p className="mb-4 text-xs text-muted-foreground">
                  {t("calendarDesc")}
                </p>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {dayLabels.map((d, i) => (
                    <div
                      key={i}
                      className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid (5 weeks = 35 cells, days 1-31 + 4 trailing) */}
                <div className="mt-2 grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const day = i - 1;
                    const inMonth = day >= 1 && day <= 31;
                    const ev = inMonth ? events[day] : undefined;
                    const isToday = day === 14;

                    return (
                      <div
                        key={i}
                        className={`relative flex h-12 flex-col items-stretch justify-start rounded-lg border p-1 text-[10px] sm:h-16 ${
                          inMonth
                            ? "border-border/40 bg-background"
                            : "border-transparent bg-muted/20 text-muted-foreground/40"
                        } ${isToday ? "ring-2 ring-primary/40" : ""}`}
                      >
                        <span
                          className={`text-[10px] ${
                            isToday
                              ? "font-bold text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {inMonth ? day : ""}
                        </span>
                        {ev && (
                          <div
                            className={`mt-auto h-1 w-full rounded-full ${eventColor[ev]}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-border/40 pt-3">
                  {[
                    {
                      color: "bg-primary",
                      label: isAr ? "مؤكد" : "Confirmed",
                    },
                    {
                      color: "bg-amber-400",
                      label: isAr ? "محجوز مؤقت" : "On hold",
                    },
                    {
                      color: "bg-sky-400",
                      label: isAr ? "استفسار" : "Inquiry",
                    },
                  ].map((l) => (
                    <div
                      key={l.label}
                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${l.color}`}
                      />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking wizard mockup */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_12px_36px_oklch(0_0_0/0.08)]">
              <div className="border-b border-border/60 bg-card px-5 py-3.5">
                <h3 className="text-sm font-semibold">{t("wizardTitle")}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("wizardDesc")}
                </p>
              </div>

              <div className="p-5">
                {/* Stepper */}
                <div className="mb-5 flex items-center justify-between">
                  {wizardSteps.map((s, i) => (
                    <div
                      key={s.n}
                      className="flex flex-1 flex-col items-center"
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${
                          s.done
                            ? "bg-primary text-primary-foreground"
                            : s.active
                            ? "bg-primary/15 text-primary ring-2 ring-primary/40"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.done ? <Check className="h-3 w-3" /> : s.n}
                      </div>
                      <span
                        className={`mt-1.5 text-[9px] font-medium ${
                          s.active || s.done
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {s.label}
                      </span>
                      {i < wizardSteps.length - 1 && (
                        <div
                          className={`absolute mt-3.5 h-px w-1/4 translate-x-1/2 ${
                            s.done ? "bg-primary/40" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Active step content (Package) */}
                <div className="space-y-2.5">
                  {[
                    {
                      name: isAr ? "الباقة الفضية" : "Silver Package",
                      price: "85,000",
                      sub: isAr ? "حتى 200 ضيف" : "Up to 200 guests",
                    },
                    {
                      name: isAr ? "الباقة الذهبية" : "Gold Package",
                      price: "140,000",
                      sub: isAr ? "حتى 350 ضيف" : "Up to 350 guests",
                      selected: true,
                    },
                    {
                      name: isAr ? "الباقة البلاتينية" : "Platinum Package",
                      price: "210,000",
                      sub: isAr ? "حتى 500 ضيف" : "Up to 500 guests",
                    },
                  ].map((pkg) => (
                    <div
                      key={pkg.name}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                        pkg.selected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border/60"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold">{pkg.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {pkg.sub}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-xs font-bold">
                          {pkg.price}{" "}
                          <span className="text-[9px] font-medium text-muted-foreground">
                            {isAr ? "ج.م" : "EGP"}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer buttons */}
                <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
                  <span className="text-[10px] text-muted-foreground">
                    {isAr ? "الخطوة 3 من 4" : "Step 3 of 4"}
                  </span>
                  <div className="flex gap-2">
                    <span className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
                      {isAr ? "رجوع" : "Back"}
                    </span>
                    <span className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground">
                      {isAr ? "التالي" : "Next"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
