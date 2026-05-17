'use client';

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Link, usePathname } from "@i18n/navigation";
import type { AppLocale } from "@i18n/routing";
import {
  type BridgeUserRole,
  getRequiredBridgeRouteRole,
  readBridgeUserRole
} from "@src/lib/roleStorage";

type NavItem = {
  href: string;
  labelKey: string;
};

const employeeNav: NavItem[] = [
  { href: "/employee/companies", labelKey: "companies" },
  { href: "/employee/recommends", labelKey: "recommends" },
  { href: "/employee/portfolio", labelKey: "portfolio" },
  { href: "/community/posts", labelKey: "community" },
  { href: "/account", labelKey: "account" }
];

const employerNav: NavItem[] = [
  { href: "/employer/postings", labelKey: "postings" },
  { href: "/employer/applicants", labelKey: "applicants" },
  { href: "/community/posts", labelKey: "community" },
  { href: "/account", labelKey: "account" }
];

export default function RoleAwareNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const [storedRole, setStoredRole] = useState<BridgeUserRole | null>(null);
  const roleParam = searchParams.get("role");

  useEffect(() => {
    setStoredRole(readBridgeUserRole());
  }, [pathname, roleParam]);

  const activeRole = useMemo(() => {
    const routeRole = getRequiredBridgeRouteRole(pathname, roleParam);
    if (routeRole) return routeRole;
    return storedRole;
  }, [pathname, roleParam, storedRole]);

  const navItems = activeRole === "employee" ? employeeNav : activeRole === "employer" ? employerNav : [];
  const minimal = navItems.length === 0;
  const queryString = searchParams.toString();
  const localeSwitchHref = `${pathname}${queryString ? `?${queryString}` : ""}`;

  function isActive(href: string) {
    const [hrefPath, hrefSearchOrHash] = href.split(/[?#]/);
    if (pathname !== hrefPath) return false;

    if (href.includes("role=employee")) return roleParam === "employee" || (!roleParam && activeRole === "employee");
    if (href.includes("role=employer")) return roleParam === "employer" || (!roleParam && activeRole === "employer");

    return !hrefSearchOrHash || href.includes("#");
  }

  const localeSwitcher = (
    <div className="inline-flex shrink-0 rounded-full border border-gray-200 bg-white p-1">
      {(["ko", "ja"] as const).map((nextLocale) => (
        <Link
          key={nextLocale}
          href={localeSwitchHref || "/signin"}
          locale={nextLocale}
          className={[
            "rounded-full px-3 py-1.5 text-caption font-black transition-colors",
            locale === nextLocale ? "bg-ink text-white" : "text-gray-400 hover:text-ink"
          ].join(" ")}
        >
          {nextLocale === "ko" ? t("korean") : t("japanese")}
        </Link>
      ))}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/signin" className="shrink-0 text-h2 font-bold tracking-tight" aria-label={common("brandAria")}>
          <span className="text-bridge-primary">Bridge</span>
          <span className="text-ink"> IT</span>
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          {minimal ? (
            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="rounded-full px-4 py-2 text-body font-bold text-gray-500 transition-colors hover:bg-gray-50 hover:text-ink"
              >
                {t("signin")}
              </Link>
              <Link
                href="/signup/onboarding"
                className="rounded-full bg-ink px-4 py-2 text-body font-bold text-white transition-colors hover:bg-black"
              >
                {t("signup")}
              </Link>
              {localeSwitcher}
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "whitespace-nowrap rounded-full px-4 py-2 text-body font-bold transition-colors",
                    isActive(item.href)
                      ? "bg-bridge-primary text-white"
                      : "text-gray-500 hover:bg-gray-50 hover:text-ink"
                  ].join(" ")}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
              {localeSwitcher}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
