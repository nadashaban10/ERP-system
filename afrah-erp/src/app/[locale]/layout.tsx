import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Geist } from "next/font/google";
import { notFound } from "next/navigation";
import { Providers } from "@/providers";
import { isRTL } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Afrah ERP — Venue Management System",
  description: "Modern ERP system for Egyptian wedding venues",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  const messages = await getMessages();
  const dir = isRTL(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>
          <TooltipProvider delayDuration={300}>
            <Providers>{children}</Providers>
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
