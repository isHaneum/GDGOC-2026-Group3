import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Suspense } from "react";
import "../../src/index.css";

import { isAppLocale, locales, type AppLocale } from "@i18n/routing";
import RoleAwareNav from "@src/components/RoleAwareNav";
import RoleRouteGate from "@src/components/RoleRouteGate";

export const metadata: Metadata = {
  title: "Bridge IT | KR-JP IT Talent Signal Platform",
  description: "A role-aware matching platform for hiring companies and developers moving between Korea and Japan.",
  icons: {
    icon: "/favicon.svg"
  }
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body className="bg-bridge-paper text-ink antialiased">
        <NextIntlClientProvider locale={locale as AppLocale} messages={messages}>
          <Suspense fallback={null}>
            <RoleAwareNav />
          </Suspense>
          <main>
            <Suspense fallback={<div className="min-h-[45vh] bg-bridge-paper" />}>
              <RoleRouteGate>{children}</RoleRouteGate>
            </Suspense>
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
