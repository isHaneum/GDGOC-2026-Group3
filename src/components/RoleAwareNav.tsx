'use client';

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import MarketSelector from "./MarketSelector";
import {
  type BridgeUserRole,
  getRequiredBridgeRouteRole,
  readBridgeUserRole
} from "@src/lib/roleStorage";

type NavItem = {
  href: string;
  label: string;
};

const developerNav: NavItem[] = [
  { href: "/developer", label: "기업별 구인정보" },
  { href: "/companies", label: "채용중인 회사" },
  { href: "/signal-lab?role=developer", label: "추천 직무" },
  { href: "/apply", label: "자기소개서" },
  { href: "/community", label: "커뮤니티" }
];

const employerNav: NavItem[] = [
  { href: "/employer", label: "지원자 관리" },
  { href: "/signal-lab?role=employer", label: "추천 개발자" },
  { href: "/employer/register", label: "기업/직무 조건" },
  { href: "/community", label: "커뮤니티" }
];

export default function RoleAwareNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  const navItems = activeRole === "developer" ? developerNav : activeRole === "employer" ? employerNav : [];
  const minimal = navItems.length === 0;

  function isActive(href: string) {
    const [hrefPath, hrefSearchOrHash] = href.split(/[?#]/);
    if (pathname !== hrefPath) return false;

    if (href.includes("role=developer")) return roleParam === "developer" || (!roleParam && activeRole === "developer");
    if (href.includes("role=employer")) return roleParam === "employer" || (!roleParam && activeRole === "employer");

    return !hrefSearchOrHash || href.includes("#");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight" aria-label="Bridge IT home">
          <span className="text-bridge-primary">Bridge</span>
          <span className="text-ink"> IT</span>
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          {minimal ? (
            <Link
              href="/get-started"
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
            >
              Get Started
            </Link>
          ) : (
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors",
                    isActive(item.href)
                      ? "bg-bridge-primary text-ink"
                      : "text-gray-500 hover:bg-gray-50 hover:text-ink"
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/get-started"
                className="whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold text-gray-400 transition-colors hover:bg-gray-50 hover:text-ink"
              >
                Switch Role
              </Link>
            </div>
          )}
          <MarketSelector />
        </div>
      </div>
    </nav>
  );
}
