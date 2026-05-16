'use client';

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { type BridgeUserRole, isBridgeUserRole, readBridgeUserRole } from "@src/lib/roleStorage";

type NavItem = {
  href: string;
  label: string;
};

const developerNav: NavItem[] = [
  { href: "/developer", label: "기업별 구인정보" },
  { href: "/signal-lab?role=developer", label: "추천 직무" },
  { href: "/apply", label: "자기소개서" }
];

const employerNav: NavItem[] = [
  { href: "/signal-lab?role=employer", label: "추천 개발자" },
  { href: "/employer#applicants", label: "지원자 관리" },
  { href: "/employer#profile", label: "기업/직무 조건" }
];

const publicRoutes = new Set(["/", "/get-started", "/onboarding"]);

function getRouteRole(pathname: string, roleParam: string | null): BridgeUserRole | null {
  if (pathname.startsWith("/developer") || pathname === "/apply" || pathname === "/forums") return "developer";
  if (pathname.startsWith("/employer")) return "employer";
  if (pathname === "/signal-lab" && isBridgeUserRole(roleParam)) return roleParam;
  return null;
}

function isPublicRoute(pathname: string) {
  return publicRoutes.has(pathname) || pathname.endsWith("/register");
}

export default function RoleAwareNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [storedRole, setStoredRole] = useState<BridgeUserRole | null>(null);
  const roleParam = searchParams.get("role");

  useEffect(() => {
    setStoredRole(readBridgeUserRole());
  }, [pathname, roleParam]);

  const activeRole = useMemo(() => {
    if (pathname === "/apply" && storedRole === "employer") return "employer";
    const routeRole = getRouteRole(pathname, roleParam);
    if (routeRole) return routeRole;
    if (pathname === "/signal-lab" && storedRole) return storedRole;
    return null;
  }, [pathname, roleParam, storedRole]);

  const navItems = activeRole === "developer" ? developerNav : activeRole === "employer" ? employerNav : [];
  const minimal = isPublicRoute(pathname) || navItems.length === 0;

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
          </div>
        )}
      </div>
    </nav>
  );
}
