import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Sparkles, Mail, MessageCircle, Heart } from "lucide-react";

export async function LandingFooter() {
  const t = await getTranslations("landing.footer");
  const locale = await getLocale();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t("product"),
      links: [
        { label: t("links.features"), href: "#features" },
        { label: t("links.pricing"), href: "#pricing" },
        { label: t("links.demo"), href: `/${locale}/login` },
        { label: t("links.changelog"), href: "#" },
      ],
    },
    {
      title: t("company"),
      links: [
        { label: t("links.about"), href: "#" },
        { label: t("links.blog"), href: "#" },
        { label: t("links.careers"), href: "#" },
      ],
    },
    {
      title: t("legal"),
      links: [
        { label: t("links.privacy"), href: "#" },
        { label: t("links.terms"), href: "#" },
        { label: t("links.security"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/40 bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link href={`/${locale}`} className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary shadow-[0_2px_10px_oklch(0.50_0.22_264/0.4)]">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-base font-bold tracking-tight">
                {locale === "ar" ? "نظام أفراح" : "Afrah ERP"}
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <a
                href="https://wa.me/200000000000"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3.5 py-2 text-xs font-medium text-foreground/80 shadow-sm transition-all hover:border-emerald-300 hover:text-emerald-700"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                {t("links.whatsapp")}
              </a>
              <a
                href="mailto:hello@afrah-erp.com"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3.5 py-2 text-xs font-medium text-foreground/80 shadow-sm transition-all hover:border-primary/40 hover:text-primary"
              >
                <Mail className="h-3.5 w-3.5 text-primary" />
                {t("links.email")}
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} {locale === "ar" ? "نظام أفراح" : "Afrah ERP"} · {t("rights")}
          </p>
          <p className="inline-flex items-center gap-1.5">
            {t("madeIn")}
            <Heart className="h-3 w-3 fill-red-500 text-red-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
