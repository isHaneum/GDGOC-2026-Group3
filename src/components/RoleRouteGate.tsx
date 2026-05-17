'use client';

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { Link, usePathname } from "@i18n/navigation";
import {
  type BridgeUserRole,
  getRequiredBridgeRouteRole,
  readBridgeUserRole,
  writeBridgeUserRole
} from "@src/lib/roleStorage";

export default function RoleRouteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("errors");
  const common = useTranslations("common");
  const roleParam = searchParams.get("role");
  const [mounted, setMounted] = useState(false);
  const [storedRole, setStoredRole] = useState<BridgeUserRole | null>(null);

  const requiredRole = useMemo(
    () => getRequiredBridgeRouteRole(pathname, roleParam),
    [pathname, roleParam]
  );

  useEffect(() => {
    setStoredRole(readBridgeUserRole());
    setMounted(true);
  }, [pathname, roleParam]);

  if (!requiredRole) return children;

  if (!mounted) {
    return <div className="min-h-[45vh] bg-bridge-paper" />;
  }

  if (storedRole === requiredRole) return children;

  const gatedRole = requiredRole;

  function switchRole() {
    writeBridgeUserRole(gatedRole);
    setStoredRole(gatedRole);
  }

  const requiredRoleLabel = gatedRole === "employee" ? common("applicant") : common("employer");
  const currentRoleLabel = storedRole ? (storedRole === "employee" ? common("applicant") : common("employer")) : t("noRole");

  return (
    <section className="min-h-[70vh] bg-bridge-paper px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-panel">
        <p className="text-caption font-black uppercase tracking-widest text-bridge-teal">
          {t("routeAccess")}
        </p>
        <h1 className="mt-3 text-h1 font-black text-ink">
          {t("areaTitle", { role: requiredRoleLabel })}
        </h1>
        <p className="mt-3 text-body leading-6 text-gray-600">
          {t("areaDescription", { role: requiredRoleLabel.toLowerCase(), currentRole: currentRoleLabel })}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={switchRole}
            className="rounded-full bg-bridge-primary px-5 py-3 text-body font-black text-white transition-opacity hover:opacity-90"
          >
            {t("continueAs", { role: requiredRoleLabel })}
          </button>
          <Link
            href="/signup/onboarding"
            className="rounded-full border border-gray-200 px-5 py-3 text-center text-body font-black text-gray-500 transition-colors hover:border-bridge-primary hover:text-ink"
          >
            {t("chooseRole")}
          </Link>
        </div>
      </div>
    </section>
  );
}
