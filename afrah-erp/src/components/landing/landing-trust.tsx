import { getTranslations } from "next-intl/server";
import { Smartphone, Banknote, Building2, Globe, CreditCard } from "lucide-react";

export async function LandingTrust() {
  const t = await getTranslations("landing.trust");

  const items = [
    { label: t("labels.instapay"), icon: Smartphone },
    { label: t("labels.fawry"), icon: CreditCard },
    { label: t("labels.vodafoneCash"), icon: Smartphone },
    { label: t("labels.bankTransfer"), icon: Building2 },
    { label: t("labels.cash"), icon: Banknote },
    { label: t("labels.arabic"), icon: Globe },
    { label: t("labels.egp"), icon: Banknote },
  ];

  return (
    <section className="border-y border-border/40 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-xs font-medium text-foreground/80 shadow-sm transition-all hover:scale-[1.03] hover:border-primary/30 hover:text-foreground sm:text-sm"
            >
              <item.icon className="h-3.5 w-3.5 text-primary" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
