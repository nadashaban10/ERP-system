import { getTranslations } from "next-intl/server";

export async function LandingBilingual() {
  const t = await getTranslations("landing.bilingual");

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {t("tag")}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* Arabic mockup */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_12px_36px_oklch(0_0_0/0.08)]">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("arLabel")}
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                AR · RTL
              </span>
            </div>
            <div dir="rtl" className="p-6 text-right" lang="ar">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                الحجوزات
              </div>
              <h3 className="text-xl font-bold">إدارة جميع حجوزات القاعة</h3>

              <div className="mt-5 space-y-2">
                {[
                  {
                    name: "أحمد ومنى",
                    hall: "قاعة الجاردن",
                    status: "مؤكد",
                    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  },
                  {
                    name: "كريم ونور",
                    hall: "قاعة الفل",
                    status: "محجوز مؤقت",
                    tone: "bg-amber-50 text-amber-700 border-amber-200",
                  },
                  {
                    name: "محمد وسارة",
                    hall: "قاعة الجاردن",
                    status: "استفسار",
                    tone: "bg-sky-50 text-sky-700 border-sky-200",
                  },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{row.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.hall} · مسائي
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${row.tone}`}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* English mockup */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_12px_36px_oklch(0_0_0/0.08)]">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("enLabel")}
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                EN · LTR
              </span>
            </div>
            <div dir="ltr" className="p-6 text-left" lang="en">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Bookings
              </div>
              <h3 className="text-xl font-bold">Manage all venue bookings</h3>

              <div className="mt-5 space-y-2">
                {[
                  {
                    name: "Ahmed & Mona",
                    hall: "El Garden Hall",
                    status: "Confirmed",
                    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  },
                  {
                    name: "Karim & Nour",
                    hall: "El Foll Hall",
                    status: "On hold",
                    tone: "bg-amber-50 text-amber-700 border-amber-200",
                  },
                  {
                    name: "Mohamed & Sara",
                    hall: "El Garden Hall",
                    status: "Inquiry",
                    tone: "bg-sky-50 text-sky-700 border-sky-200",
                  },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{row.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.hall} · Evening
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${row.tone}`}
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
    </section>
  );
}
