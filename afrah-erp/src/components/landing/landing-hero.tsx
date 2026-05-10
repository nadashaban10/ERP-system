import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  Wallet,
  MessageSquare,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isRTL } from "@/lib/utils";

export async function LandingHero() {
  const t = await getTranslations("landing.hero");
  const locale = await getLocale();
  const rtl = isRTL(locale);
  const Arrow = rtl ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.50 0.22 264 / 0.5), transparent 70%)",
          }}
        />
        <div
          className="absolute -right-32 top-40 h-96 w-96 rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.65 0.20 330 / 0.45), transparent 70%)",
          }}
        />
        <div
          className="absolute -left-32 top-72 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.68 0.18 220 / 0.45), transparent 70%)",
          }}
        />
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0 0 0) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-24 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {t("badge")}
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            {t("title")}
          </h1>

          {/* Subhead */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg lg:text-xl">
            {t("subtitle")}
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={`/${locale}/login`}>
                {t("cta")}
                <Arrow className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href={`/${locale}/login`}>{t("secondary")}</Link>
            </Button>
          </div>

          <p className="mt-5 text-xs text-muted-foreground/70">
            {t("trustNote")}
          </p>
        </div>

        {/* Dashboard preview mockup */}
        <div className="relative mx-auto mt-14 max-w-5xl sm:mt-20">
          {/* Glow behind */}
          <div
            className="absolute -inset-x-10 -top-10 -bottom-10 -z-10 rounded-[3rem] opacity-60 blur-3xl"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.50 0.22 264 / 0.25), oklch(0.65 0.20 330 / 0.20), oklch(0.68 0.18 220 / 0.20))",
            }}
          />

          <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-card shadow-[0_30px_80px_oklch(0.20_0.06_264/0.25),_0_8px_24px_oklch(0_0_0/0.10)] sm:rounded-[2rem]">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="ms-3 hidden flex-1 items-center justify-center sm:flex">
                <div className="rounded-md bg-background/60 px-3 py-1 text-[10px] text-muted-foreground/70">
                  app.afrah-erp.com / dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="grid grid-cols-12 gap-0">
              {/* Sidebar */}
              <div
                className="col-span-2 hidden flex-col gap-1 p-3 sm:flex"
                style={{
                  background:
                    "linear-gradient(180deg, oklch(0.22 0.06 264) 0%, oklch(0.20 0.07 280) 100%)",
                }}
              >
                <div className="mb-2 flex items-center gap-2 px-2 py-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="hidden text-xs font-bold text-white lg:inline">
                    Afrah
                  </span>
                </div>
                {[
                  { label: locale === "ar" ? "الرئيسية" : "Dashboard", active: true },
                  { label: locale === "ar" ? "التقويم" : "Calendar" },
                  { label: locale === "ar" ? "الحجوزات" : "Bookings" },
                  { label: locale === "ar" ? "الاستفسارات" : "Inquiries" },
                  { label: locale === "ar" ? "العملاء" : "Clients" },
                  { label: locale === "ar" ? "الإعدادات" : "Settings" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-md px-2 py-1.5 text-[10px] font-medium lg:text-xs ${
                      item.active
                        ? "bg-white/15 text-white"
                        : "text-white/55"
                    }`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="col-span-12 bg-background p-4 sm:col-span-10 sm:p-6">
                {/* Topbar */}
                <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold sm:text-base">
                      {locale === "ar" ? "الرئيسية" : "Dashboard"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {locale === "ar"
                        ? "نظرة عامة على عمليات القاعة"
                        : "Overview of your venue operations"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-violet-500" />
                  </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[
                    {
                      label: t("preview.todayEvents"),
                      value: "3",
                      icon: Calendar,
                      tone: "text-violet-600 bg-violet-50",
                    },
                    {
                      label: t("preview.outstanding"),
                      value: "ج.م 84,500",
                      icon: Wallet,
                      tone: "text-amber-600 bg-amber-50",
                    },
                    {
                      label: t("preview.newInquiries"),
                      value: "12",
                      icon: MessageSquare,
                      tone: "text-sky-600 bg-sky-50",
                    },
                    {
                      label: t("preview.occupancy"),
                      value: "9",
                      icon: TrendingUp,
                      tone: "text-emerald-600 bg-emerald-50",
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-lg border border-border/60 bg-card p-2.5 sm:p-3"
                    >
                      <div
                        className={`mb-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md ${kpi.tone}`}
                      >
                        <kpi.icon className="h-3 w-3" />
                      </div>
                      <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                        {kpi.label}
                      </p>
                      <p className="text-sm font-bold sm:text-base">{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Today's events */}
                <div className="mt-4 rounded-lg border border-border/60 bg-card p-3">
                  <h4 className="mb-2 text-[11px] font-semibold sm:text-xs">
                    {t("preview.todayEvents")}
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      {
                        name: locale === "ar" ? "أحمد ومنى" : "Ahmed & Mona",
                        status: t("preview.confirmed"),
                        tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      },
                      {
                        name: locale === "ar" ? "كريم ونور" : "Karim & Nour",
                        status: t("preview.confirmed"),
                        tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      },
                      {
                        name: locale === "ar" ? "محمد وسارة" : "Mohamed & Sara",
                        status: t("preview.onHold"),
                        tone: "bg-amber-50 text-amber-700 border-amber-200",
                      },
                    ].map((row) => (
                      <div
                        key={row.name}
                        className="flex items-center justify-between rounded-md border border-border/40 bg-background px-2.5 py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className="text-[10px] font-medium sm:text-xs">
                            {t("preview.weddingOf")} {row.name}
                          </span>
                          <span className="hidden text-[9px] text-muted-foreground sm:inline">
                            · {t("preview.elGarden")} · {t("preview.evening")}
                          </span>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-medium ${row.tone}`}
                        >
                          {row.status}
                        </span>
                      </div>
                    ))}
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
