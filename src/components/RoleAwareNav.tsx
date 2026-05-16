'use client';

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  { href: "/employee/companies", label: "채용중인 회사" },
  { href: "/employee/recommends", label: "추천 직무" },
  { href: "/employee/portfolio", label: "내 포트폴리오" },
  { href: "/community/posts", label: "커뮤니티" },
  { href: "/account", label: "계정" }
];

const employerNav: NavItem[] = [
  { href: "/employer/postings", label: "채용 공고" },
  { href: "/employer/applicants", label: "지원자" },
  { href: "/community/posts", label: "커뮤니티" },
  { href: "/account", label: "계정" }
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
        <Link href="/signin" className="shrink-0 text-xl font-bold tracking-tight" aria-label="Bridge IT home">
          <span className="text-bridge-primary">Bridge</span>
          <span className="text-ink"> IT</span>
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          {minimal ? (
            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="rounded-full px-4 py-2 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-50 hover:text-ink"
              >
                Sign in
              </Link>
              <Link
                href="/signup/onboarding"
                className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
              >
                Sign up
              </Link>
            </div>
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
                href="/signup/onboarding"
                className="whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold text-gray-400 transition-colors hover:bg-gray-50 hover:text-ink"
              >
                Switch Role
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
