"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X, Sparkles, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const t = useTranslations("landing.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const otherLocale = locale === "ar" ? "en" : "ar";
  // Strip the current locale prefix and prepend the other one.
  const switchedPath = pathname.replace(/^\/(ar|en)/, `/${otherLocale}`);

  const links = [
    { href: "#features", label: t("features") },
    { href: "#how", label: t("howItWorks") },
    { href: "#pricing", label: t("pricing") },
    { href: "#faq", label: t("faq") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="border-b border-border/40 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary shadow-[0_2px_10px_oklch(0.50_0.22_264/0.4)]">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight">
              {locale === "ar" ? "نظام أفراح" : "Afrah ERP"}
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href={switchedPath}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Switch language"
            >
              <Languages className="h-4 w-4" />
              <span className="font-semibold">
                {otherLocale === "ar" ? "العربية" : "EN"}
              </span>
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/login`}>{t("signIn")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/${locale}/login`}>{t("getStarted")}</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-accent md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        <div
          className={cn(
            "overflow-hidden border-t border-border/40 transition-[max-height] duration-300 md:hidden",
            open ? "max-h-96" : "max-h-0"
          )}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Link
              href={switchedPath}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Languages className="h-4 w-4" />
              {otherLocale === "ar" ? "العربية" : "English"}
            </Link>
            <div className="mt-2 flex flex-col gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/${locale}/login`}>{t("signIn")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/${locale}/login`}>{t("getStarted")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
